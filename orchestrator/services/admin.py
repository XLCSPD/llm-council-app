"""Admin service for organization management and audit logging."""

from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

from db.supabase import get_supabase_client


class AdminError(Exception):
    """Error during admin operations."""
    pass


async def verify_org_owner(org_id: UUID, user_id: UUID) -> bool:
    """Verify that a user is the owner of an organization.

    Args:
        org_id: Organization ID
        user_id: User ID to verify

    Returns:
        True if user is owner, False otherwise
    """
    client = get_supabase_client()._client

    result = (
        client.table("org_members")
        .select("role")
        .eq("org_id", str(org_id))
        .eq("user_id", str(user_id))
        .single()
        .execute()
    )

    if not result.data:
        return False

    return result.data.get("role") == "owner"


async def verify_org_admin(org_id: UUID, user_id: UUID) -> bool:
    """Verify that a user is an admin or owner of an organization.

    Args:
        org_id: Organization ID
        user_id: User ID to verify

    Returns:
        True if user is admin/owner, False otherwise
    """
    client = get_supabase_client()._client

    result = (
        client.table("org_members")
        .select("role")
        .eq("org_id", str(org_id))
        .eq("user_id", str(user_id))
        .single()
        .execute()
    )

    if not result.data:
        return False

    return result.data.get("role") in ("owner", "admin")


async def get_all_system_users() -> list[dict]:
    """Get all users from Supabase auth.users table.

    Returns a list of all users in the system with their org membership info.

    Returns:
        List of user records with email, created_at, last_sign_in, and org membership
    """
    client = get_supabase_client()._client

    try:
        # Get all users from auth using admin API
        # Note: This may need pagination for large user bases
        users_response = client.auth.admin.list_users()
        users = users_response if isinstance(users_response, list) else []

        # Get all org_members to map user_id -> org membership
        members_result = (
            client.table("org_members")
            .select("user_id, org_id, role, created_at")
            .execute()
        )
        members_by_user = {}
        for member in (members_result.data or []):
            members_by_user[member["user_id"]] = member

        # Build user list with org info
        result = []
        for user in users:
            user_id = user.id if hasattr(user, 'id') else user.get('id')
            email = user.email if hasattr(user, 'email') else user.get('email')
            created_at = user.created_at if hasattr(user, 'created_at') else user.get('created_at')
            last_sign_in = user.last_sign_in_at if hasattr(user, 'last_sign_in_at') else user.get('last_sign_in_at')
            user_metadata = user.user_metadata if hasattr(user, 'user_metadata') else user.get('user_metadata', {})

            # Get org membership if exists
            membership = members_by_user.get(user_id)

            result.append({
                "id": user_id,
                "email": email,
                "display_name": user_metadata.get("full_name") or user_metadata.get("name") if user_metadata else None,
                "created_at": created_at,
                "last_sign_in_at": last_sign_in,
                "org_id": membership["org_id"] if membership else None,
                "role": membership["role"] if membership else None,
                "member_since": membership["created_at"] if membership else None,
            })

        return result

    except Exception as e:
        raise AdminError(f"Failed to fetch system users: {str(e)}")


async def get_detailed_members(org_id: UUID) -> list[dict]:
    """Get all members with detailed activity stats.

    Args:
        org_id: Organization ID

    Returns:
        List of member records with email and activity stats
    """
    client = get_supabase_client()._client

    # Get org members
    members_result = (
        client.table("org_members")
        .select("id, user_id, role, created_at, updated_at")
        .eq("org_id", str(org_id))
        .order("created_at")
        .execute()
    )

    members = members_result.data or []

    # Enrich with user details and activity stats
    for member in members:
        # Get user email and last login
        try:
            user_response = client.auth.admin.get_user_by_id(member["user_id"])
            if user_response and user_response.user:
                member["email"] = user_response.user.email
                member["last_login_at"] = user_response.user.last_sign_in_at
            else:
                member["email"] = None
                member["last_login_at"] = None
        except Exception:
            member["email"] = None
            member["last_login_at"] = None

        # Get activity stats using database function
        try:
            activity = client.rpc(
                "get_member_activity_stats",
                {
                    "p_org_id": str(org_id),
                    "p_user_id": member["user_id"]
                }
            ).execute()

            if activity.data and len(activity.data) > 0:
                stats = activity.data[0]
                member["session_count"] = stats.get("session_count", 0) or 0
                member["run_count"] = stats.get("run_count", 0) or 0
                member["last_active_at"] = stats.get("last_active_at")
            else:
                member["session_count"] = 0
                member["run_count"] = 0
                member["last_active_at"] = None
        except Exception:
            member["session_count"] = 0
            member["run_count"] = 0
            member["last_active_at"] = None

    return members


async def update_member_role(
    org_id: UUID,
    member_id: UUID,
    new_role: str,
    actor_id: UUID
) -> dict:
    """Update a member's role with audit logging.

    Args:
        org_id: Organization ID
        member_id: Member ID to update
        new_role: New role ('admin' or 'member')
        actor_id: User ID performing the action

    Returns:
        Updated member record

    Raises:
        AdminError: If member not found or operation not allowed
    """
    client = get_supabase_client()._client

    # Validate new role
    if new_role not in ("admin", "member"):
        raise AdminError("Invalid role. Must be 'admin' or 'member'")

    # Get current member
    member_result = (
        client.table("org_members")
        .select("*")
        .eq("id", str(member_id))
        .eq("org_id", str(org_id))
        .single()
        .execute()
    )

    if not member_result.data:
        raise AdminError("Member not found")

    member = member_result.data
    old_role = member["role"]

    # Cannot change owner role
    if old_role == "owner":
        raise AdminError("Cannot change owner role")

    # Cannot change to owner
    if new_role == "owner":
        raise AdminError("Cannot promote to owner role")

    # No change needed
    if old_role == new_role:
        return member

    # Update role
    updated_result = (
        client.table("org_members")
        .update({
            "role": new_role,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        .eq("id", str(member_id))
        .execute()
    )

    if not updated_result.data:
        raise AdminError("Failed to update member role")

    # Create audit log
    await create_audit_log(
        org_id=org_id,
        actor_id=actor_id,
        action="member_role_change",
        target_type="member",
        target_id=member_id,
        old_value={"role": old_role, "user_id": member["user_id"]},
        new_value={"role": new_role, "user_id": member["user_id"]}
    )

    return updated_result.data[0]


async def delete_user_account(user_id: UUID, actor_id: UUID) -> bool:
    """Delete a user's account from Supabase auth.

    This permanently removes the user from auth.users.

    Args:
        user_id: User ID to delete from auth
        actor_id: User ID performing the action

    Returns:
        True if deleted successfully

    Raises:
        AdminError: If user not found or operation not allowed
    """
    client = get_supabase_client()._client

    # Cannot delete yourself
    if str(user_id) == str(actor_id):
        raise AdminError("Cannot delete your own account")

    try:
        # Delete user from Supabase auth
        client.auth.admin.delete_user(str(user_id))
        return True
    except Exception as e:
        raise AdminError(f"Failed to delete user account: {str(e)}")


async def remove_member(
    org_id: UUID,
    member_id: UUID,
    actor_id: UUID,
    delete_account: bool = False
) -> bool:
    """Remove a member from the organization with audit logging.

    Args:
        org_id: Organization ID
        member_id: Member ID to remove
        actor_id: User ID performing the action
        delete_account: If True, also delete the user's Supabase auth account

    Returns:
        True if removed successfully

    Raises:
        AdminError: If member not found or operation not allowed
    """
    client = get_supabase_client()._client

    # Get member details for audit log
    member_result = (
        client.table("org_members")
        .select("*")
        .eq("id", str(member_id))
        .eq("org_id", str(org_id))
        .single()
        .execute()
    )

    if not member_result.data:
        raise AdminError("Member not found")

    member = member_result.data

    # Cannot remove owner
    if member["role"] == "owner":
        raise AdminError("Cannot remove organization owner")

    # Cannot remove yourself
    if member["user_id"] == str(actor_id):
        raise AdminError("Cannot remove yourself from the organization")

    # Get user email for audit log
    email = None
    try:
        user_response = client.auth.admin.get_user_by_id(member["user_id"])
        if user_response and user_response.user:
            email = user_response.user.email
    except Exception:
        pass

    # Delete member from org_members
    client.table("org_members").delete().eq("id", str(member_id)).execute()

    # Optionally delete user account from auth.users
    account_deleted = False
    if delete_account:
        try:
            client.auth.admin.delete_user(member["user_id"])
            account_deleted = True
        except Exception as e:
            # Log but don't fail - member was already removed from org
            print(f"Warning: Failed to delete user account: {e}")

    # Create audit log
    await create_audit_log(
        org_id=org_id,
        actor_id=actor_id,
        action="member_removed" if not account_deleted else "account_deleted",
        target_type="member",
        target_id=member_id,
        old_value={
            "role": member["role"],
            "user_id": member["user_id"],
            "email": email
        },
        new_value=None,
        metadata={"account_deleted": account_deleted}
    )

    return True


async def bulk_member_action(
    org_id: UUID,
    member_ids: list[str],
    action: str,
    actor_id: UUID,
    role: Optional[str] = None
) -> dict:
    """Perform bulk actions on members.

    Args:
        org_id: Organization ID
        member_ids: List of member IDs
        action: Action to perform ('update_role' or 'remove')
        actor_id: User ID performing the action
        role: New role (required for 'update_role')

    Returns:
        Dict with 'success' and 'failed' lists
    """
    results = {"success": [], "failed": []}

    for member_id in member_ids:
        try:
            if action == "update_role":
                if not role:
                    results["failed"].append({
                        "id": member_id,
                        "error": "Role is required for update_role action"
                    })
                    continue

                await update_member_role(
                    org_id=org_id,
                    member_id=UUID(member_id),
                    new_role=role,
                    actor_id=actor_id
                )
                results["success"].append(member_id)

            elif action == "remove":
                await remove_member(
                    org_id=org_id,
                    member_id=UUID(member_id),
                    actor_id=actor_id
                )
                results["success"].append(member_id)

            else:
                results["failed"].append({
                    "id": member_id,
                    "error": f"Unknown action: {action}"
                })

        except AdminError as e:
            results["failed"].append({"id": member_id, "error": str(e)})
        except Exception as e:
            results["failed"].append({"id": member_id, "error": str(e)})

    return results


async def get_all_invites(org_id: UUID, status: Optional[str] = None) -> list[dict]:
    """Get all invites for an organization with optional status filter.

    Args:
        org_id: Organization ID
        status: Optional status filter ('pending', 'accepted', 'expired', 'canceled')

    Returns:
        List of invite records
    """
    client = get_supabase_client()._client

    query = (
        client.table("org_invites")
        .select("*")
        .eq("org_id", str(org_id))
    )

    if status:
        query = query.eq("status", status)

    result = query.order("created_at", desc=True).execute()
    return result.data or []


async def delete_invite(invite_id: UUID, actor_id: UUID) -> bool:
    """Permanently delete an invite record with audit logging.

    Args:
        invite_id: Invite ID to delete
        actor_id: User ID performing the action

    Returns:
        True if deleted successfully

    Raises:
        AdminError: If invite not found
    """
    client = get_supabase_client()._client

    # Get invite for audit log
    invite_result = (
        client.table("org_invites")
        .select("*")
        .eq("id", str(invite_id))
        .single()
        .execute()
    )

    if not invite_result.data:
        raise AdminError("Invite not found")

    invite = invite_result.data

    # Delete invite
    client.table("org_invites").delete().eq("id", str(invite_id)).execute()

    # Create audit log
    await create_audit_log(
        org_id=UUID(invite["org_id"]),
        actor_id=actor_id,
        action="invite_deleted",
        target_type="invite",
        target_id=invite_id,
        old_value={
            "email": invite["email"],
            "role": invite["role"],
            "status": invite["status"]
        },
        new_value=None
    )

    return True


async def create_audit_log(
    org_id: UUID,
    actor_id: UUID,
    action: str,
    target_type: str,
    target_id: UUID,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
    metadata: Optional[dict] = None
) -> dict:
    """Create an audit log entry.

    Args:
        org_id: Organization ID
        actor_id: User who performed the action
        action: Action type
        target_type: Type of target ('member' or 'invite')
        target_id: ID of the target
        old_value: Previous state (optional)
        new_value: New state (optional)
        metadata: Additional context (optional)

    Returns:
        Created audit log entry
    """
    client = get_supabase_client()._client

    result = (
        client.table("admin_audit_logs")
        .insert({
            "org_id": str(org_id),
            "actor_id": str(actor_id),
            "action": action,
            "target_type": target_type,
            "target_id": str(target_id),
            "old_value": old_value,
            "new_value": new_value,
            "metadata": metadata or {}
        })
        .execute()
    )

    return result.data[0] if result.data else None


async def get_audit_logs(
    org_id: UUID,
    action: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> tuple[list[dict], int]:
    """Get audit logs with pagination.

    Args:
        org_id: Organization ID
        action: Optional action type filter
        limit: Number of records to return
        offset: Number of records to skip

    Returns:
        Tuple of (logs, total_count)
    """
    client = get_supabase_client()._client

    # Count total
    count_query = (
        client.table("admin_audit_logs")
        .select("id", count="exact")
        .eq("org_id", str(org_id))
    )

    if action:
        count_query = count_query.eq("action", action)

    count_result = count_query.execute()
    total = count_result.count or 0

    # Fetch logs
    query = (
        client.table("admin_audit_logs")
        .select("*")
        .eq("org_id", str(org_id))
    )

    if action:
        query = query.eq("action", action)

    result = (
        query
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    logs = result.data or []

    # Enrich with actor emails
    for log in logs:
        try:
            user_response = client.auth.admin.get_user_by_id(log["actor_id"])
            if user_response and user_response.user:
                log["actor_email"] = user_response.user.email
            else:
                log["actor_email"] = "Unknown"
        except Exception:
            log["actor_email"] = "Unknown"

    return logs, total
