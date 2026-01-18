"""Invite service for organization member invitations."""

from typing import Optional
from uuid import UUID

from db.supabase import get_supabase_client
from config import get_settings


class InviteError(Exception):
    """Error during invite operations."""
    pass


async def create_invite(
    org_id: UUID,
    email: str,
    role: str,
    invited_by: UUID,
    redirect_url: Optional[str] = None,
    name: Optional[str] = None,
) -> dict:
    """Create an invite and send invitation email via Supabase Auth.

    Args:
        org_id: Organization to invite to
        email: Email address of invitee
        role: Role to assign ('admin' or 'member')
        invited_by: User ID of the inviter
        redirect_url: Optional redirect URL after email verification
        name: Optional name of the invitee for personalized email

    Returns:
        Created invite record

    Raises:
        InviteError: If invite cannot be created
    """
    client = get_supabase_client()._client
    email_lower = email.lower().strip()

    # Check if user is already a member of this org
    existing_member = (
        client.table("org_members")
        .select("id, user_id")
        .eq("org_id", str(org_id))
        .execute()
    )

    # Get all users to check if this email is already a member
    if existing_member.data:
        # Check auth.users for matching email
        for member in existing_member.data:
            user_response = client.auth.admin.get_user_by_id(member["user_id"])
            if user_response and user_response.user:
                if user_response.user.email and user_response.user.email.lower() == email_lower:
                    raise InviteError("User is already a member of this organization")

    # Check for existing pending invite
    pending = (
        client.table("org_invites")
        .select("id")
        .eq("org_id", str(org_id))
        .ilike("email", email_lower)
        .eq("status", "pending")
        .execute()
    )

    if pending.data:
        raise InviteError("An invite is already pending for this email address")

    # Create invite record
    invite_data = {
        "org_id": str(org_id),
        "email": email_lower,
        "role": role,
        "invited_by": str(invited_by),
        "status": "pending",
    }
    if name:
        invite_data["name"] = name.strip()

    invite_result = (
        client.table("org_invites")
        .insert(invite_data)
        .execute()
    )

    if not invite_result.data:
        raise InviteError("Failed to create invite record")

    invite = invite_result.data[0]

    # Send invitation email via Supabase Auth Admin API
    # This creates the user if they don't exist and sends a magic link
    settings = get_settings()
    base_url = redirect_url or "http://localhost:5173"

    try:
        # Build user metadata for the invite
        user_data = {
            "invite_id": invite["id"],
            "org_id": str(org_id),
            "role": role,
        }
        if name:
            user_data["name"] = name.strip()

        client.auth.admin.invite_user_by_email(
            email_lower,
            options={
                "redirect_to": f"{base_url}/auth/callback?invite={invite['id']}",
                "data": user_data
            }
        )
    except Exception as e:
        # If email fails, delete the invite record
        client.table("org_invites").delete().eq("id", invite["id"]).execute()
        raise InviteError(f"Failed to send invitation email: {str(e)}")

    return invite


async def get_org_invites(org_id: UUID) -> list[dict]:
    """Get all invites for an organization.

    Args:
        org_id: Organization ID

    Returns:
        List of invite records
    """
    client = get_supabase_client()._client

    result = (
        client.table("org_invites")
        .select("*")
        .eq("org_id", str(org_id))
        .order("created_at", desc=True)
        .execute()
    )

    return result.data or []


async def cancel_invite(invite_id: UUID) -> bool:
    """Cancel a pending invite.

    Args:
        invite_id: Invite ID to cancel

    Returns:
        True if canceled successfully, False if not found or already processed
    """
    client = get_supabase_client()._client

    result = (
        client.table("org_invites")
        .update({"status": "canceled"})
        .eq("id", str(invite_id))
        .eq("status", "pending")
        .execute()
    )

    return len(result.data) > 0


async def resend_invite(invite_id: UUID, redirect_url: Optional[str] = None) -> dict:
    """Resend an invite email.

    Args:
        invite_id: Invite ID to resend
        redirect_url: Optional redirect URL

    Returns:
        Updated invite record

    Raises:
        InviteError: If invite not found or cannot be resent
    """
    client = get_supabase_client()._client

    # Get the invite
    invite_result = (
        client.table("org_invites")
        .select("*")
        .eq("id", str(invite_id))
        .eq("status", "pending")
        .single()
        .execute()
    )

    if not invite_result.data:
        raise InviteError("Invite not found or already processed")

    invite = invite_result.data
    settings = get_settings()
    base_url = redirect_url or "http://localhost:5173"

    # Resend via Supabase Auth
    try:
        client.auth.admin.invite_user_by_email(
            invite["email"],
            options={
                "redirect_to": f"{base_url}/auth/callback?invite={invite_id}",
                "data": {
                    "invite_id": str(invite_id),
                    "org_id": invite["org_id"],
                    "role": invite["role"],
                }
            }
        )
    except Exception as e:
        raise InviteError(f"Failed to resend invitation email: {str(e)}")

    return invite


async def get_org_members(org_id: UUID) -> list[dict]:
    """Get all members of an organization with their user details.

    Args:
        org_id: Organization ID

    Returns:
        List of member records with user email
    """
    client = get_supabase_client()._client

    # Get org members
    members_result = (
        client.table("org_members")
        .select("id, user_id, role, created_at")
        .eq("org_id", str(org_id))
        .order("created_at")
        .execute()
    )

    members = members_result.data or []

    # Fetch user emails for each member
    for member in members:
        try:
            user_response = client.auth.admin.get_user_by_id(member["user_id"])
            if user_response and user_response.user:
                member["email"] = user_response.user.email
            else:
                member["email"] = None
        except Exception:
            member["email"] = None

    return members


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
