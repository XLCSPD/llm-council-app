/**
 * Admin Panel API functions
 * Falls back to direct Supabase queries when orchestrator is unavailable
 */

import { supabase } from '@/lib/supabase';
import type {
  DetailedMember,
  SystemUser,
  FullInvite,
  AuditLog,
  BulkActionRequest,
  BulkActionResult,
} from '../types';

const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:8002';

/**
 * Get all system users from Supabase auth
 * Falls back to org members only when orchestrator unavailable
 * (Full auth.users list requires orchestrator with admin API)
 */
export async function getAllSystemUsers(
  userId: string
): Promise<SystemUser[]> {
  // Try orchestrator first (required for full auth.users list)
  try {
    const response = await fetch(`${ORCHESTRATOR_URL}/api/admin/users`, {
      headers: { 'X-User-ID': userId },
    });

    if (response.ok) {
      const data = await response.json();
      return data.users;
    }
  } catch {
    // Fall through to Supabase fallback
  }

  // Fallback: Query org_members directly from Supabase
  // Note: This only shows org members, not all system users (auth.users requires admin API)
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) {
    throw new Error('Not authenticated');
  }

  // Get user's org_id
  type OrgMembership = { org_id: string };
  const { data: membershipData } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.user.id)
    .single();

  const membership = membershipData as OrgMembership | null;
  if (!membership?.org_id) {
    throw new Error('No organization found');
  }

  const orgId = membership.org_id;

  // Get all org members
  type MemberRow = { id: string; user_id: string; role: string; created_at: string };
  const { data: membersData, error } = await supabase
    .from('org_members')
    .select('id, user_id, role, created_at')
    .eq('org_id', orgId)
    .order('created_at');

  if (error) {
    throw new Error(error.message || 'Failed to fetch users');
  }

  const members = (membersData || []) as MemberRow[];

  // Map org_members to SystemUser format (limited data without admin API)
  return members.map((m) => ({
    id: m.user_id,
    email: null, // Can't fetch without admin API
    display_name: null,
    created_at: m.created_at,
    last_sign_in_at: null,
    org_id: orgId,
    role: m.role as 'owner' | 'admin' | 'member',
    member_since: m.created_at,
  })) as SystemUser[];
}

/**
 * Get detailed member list with activity stats
 * Falls back to Supabase if orchestrator unavailable
 */
export async function getDetailedMembers(
  orgId: string,
  userId: string
): Promise<DetailedMember[]> {
  // Try orchestrator first
  try {
    const response = await fetch(
      `${ORCHESTRATOR_URL}/api/orgs/${orgId}/members/detailed`,
      {
        headers: { 'X-User-ID': userId },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.members;
    }
  } catch {
    // Fall through to Supabase
  }

  // Fallback: Query Supabase directly
  const { data: members, error } = await supabase
    .from('org_members')
    .select('id, user_id, role, created_at, updated_at')
    .eq('org_id', orgId)
    .order('created_at');

  if (error) {
    throw new Error(error.message || 'Failed to fetch members');
  }

  // Enrich with basic info (can't get email or activity stats without admin API)
  type MemberRow = { id: string; user_id: string; role: string; created_at: string; updated_at: string | null };
  return (members || []).map((m: MemberRow) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role,
    created_at: m.created_at,
    updated_at: m.updated_at,
    org_id: orgId,
    email: null, // Can't fetch without admin API
    last_login_at: null,
    session_count: 0,
    run_count: 0,
    last_active_at: null,
  })) as DetailedMember[];
}

/**
 * Update a member's role
 * Falls back to Supabase if orchestrator unavailable
 */
export async function updateMemberRole(
  orgId: string,
  memberId: string,
  role: string,
  userId: string
): Promise<DetailedMember> {
  // Try orchestrator first
  try {
    const response = await fetch(
      `${ORCHESTRATOR_URL}/api/orgs/${orgId}/members/${memberId}/role`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify({ role }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.member;
    }
  } catch {
    // Fall through to Supabase
  }

  // Fallback: Update directly in Supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('org_members') as any)
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .eq('org_id', orgId)
    .select('id, user_id, role, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update member role');
  }

  const row = data as { id: string; user_id: string; role: string; created_at: string; updated_at: string | null } | null;
  if (!row) {
    throw new Error('Failed to update member role');
  }

  return {
    id: row.id,
    user_id: row.user_id,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
    org_id: orgId,
    email: null,
    last_login_at: null,
    session_count: 0,
    run_count: 0,
    last_active_at: null,
  } as DetailedMember;
}

/**
 * Remove a member from the organization
 * Falls back to Supabase if orchestrator unavailable (but cannot delete auth account without orchestrator)
 *
 * @param deleteAccount - If true, also delete the user's Supabase auth account (requires orchestrator)
 */
export async function removeMember(
  orgId: string,
  memberId: string,
  userId: string,
  deleteAccount: boolean = false
): Promise<{ accountDeleted: boolean }> {
  // Try orchestrator first (required for account deletion)
  try {
    const url = deleteAccount
      ? `${ORCHESTRATOR_URL}/api/orgs/${orgId}/members/${memberId}?delete_account=true`
      : `${ORCHESTRATOR_URL}/api/orgs/${orgId}/members/${memberId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'X-User-ID': userId },
    });

    if (response.ok) {
      const data = await response.json();
      return { accountDeleted: data.account_deleted || false };
    }
  } catch {
    // Fall through to Supabase (can only remove from org, not delete account)
  }

  // Fallback: Delete directly in Supabase (cannot delete auth account without orchestrator)
  if (deleteAccount) {
    throw new Error('Account deletion requires the orchestrator service. Only org removal is available.');
  }

  const { error } = await supabase
    .from('org_members')
    .delete()
    .eq('id', memberId)
    .eq('org_id', orgId);

  if (error) {
    throw new Error(error.message || 'Failed to remove member');
  }

  return { accountDeleted: false };
}

/**
 * Perform bulk action on members
 * Falls back to Supabase if orchestrator unavailable
 */
export async function bulkMemberAction(
  orgId: string,
  request: BulkActionRequest,
  userId: string
): Promise<BulkActionResult> {
  // Try orchestrator first
  try {
    const response = await fetch(
      `${ORCHESTRATOR_URL}/api/orgs/${orgId}/members/bulk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify(request),
      }
    );

    if (response.ok) {
      return response.json();
    }
  } catch {
    // Fall through to Supabase
  }

  // Fallback: Perform bulk action directly in Supabase
  const results: BulkActionResult = {
    success: [],
    failed: [],
  };

  for (const memberId of request.member_ids) {
    try {
      if (request.action === 'remove') {
        const { error } = await supabase
          .from('org_members')
          .delete()
          .eq('id', memberId)
          .eq('org_id', orgId);

        if (error) throw error;
        results.success.push(memberId);
      } else if (request.action === 'update_role' && request.role) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase
          .from('org_members') as any)
          .update({ role: request.role, updated_at: new Date().toISOString() })
          .eq('id', memberId)
          .eq('org_id', orgId);

        if (error) throw error;
        results.success.push(memberId);
      }
    } catch (err) {
      results.failed.push({
        id: memberId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Get all invites (including non-pending)
 * Falls back to Supabase if orchestrator unavailable
 */
export async function getAllInvites(
  orgId: string,
  userId: string,
  status?: string
): Promise<FullInvite[]> {
  // Try orchestrator first
  try {
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.append('status', status);
    }

    const url = params.toString()
      ? `${ORCHESTRATOR_URL}/api/orgs/${orgId}/invites/all?${params}`
      : `${ORCHESTRATOR_URL}/api/orgs/${orgId}/invites/all`;

    const response = await fetch(url, {
      headers: { 'X-User-ID': userId },
    });

    if (response.ok) {
      const data = await response.json();
      return data.invites;
    }
  } catch {
    // Fall through to Supabase
  }

  // Fallback: Query Supabase directly
  let query = supabase
    .from('org_invites')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || 'Failed to fetch invites');
  }

  return (data || []) as FullInvite[];
}

/**
 * Delete an invite permanently
 * Falls back to Supabase if orchestrator unavailable
 */
export async function deleteInvite(
  inviteId: string,
  userId: string
): Promise<void> {
  // Try orchestrator first
  try {
    const response = await fetch(
      `${ORCHESTRATOR_URL}/api/invites/${inviteId}`,
      {
        method: 'DELETE',
        headers: { 'X-User-ID': userId },
      }
    );

    if (response.ok) {
      return;
    }
  } catch {
    // Fall through to Supabase
  }

  // Fallback: Delete directly in Supabase
  const { error } = await supabase
    .from('org_invites')
    .delete()
    .eq('id', inviteId);

  if (error) {
    throw new Error(error.message || 'Failed to delete invite');
  }
}

/**
 * Get audit logs with pagination
 * Falls back to Supabase if orchestrator unavailable
 */
export async function getAuditLogs(
  orgId: string,
  userId: string,
  options?: { action?: string; limit?: number; offset?: number }
): Promise<{ logs: AuditLog[]; totalCount: number; hasMore: boolean }> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  // Try orchestrator first
  try {
    const params = new URLSearchParams();
    if (options?.action && options.action !== 'all') {
      params.append('action', options.action);
    }
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const url = `${ORCHESTRATOR_URL}/api/orgs/${orgId}/audit-logs?${params}`;

    const response = await fetch(url, {
      headers: { 'X-User-ID': userId },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        logs: data.logs,
        totalCount: data.total_count,
        hasMore: data.has_more,
      };
    }
  } catch {
    // Fall through to Supabase
  }

  // Fallback: Query Supabase directly
  let query = supabase
    .from('admin_audit_logs')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.action && options.action !== 'all') {
    query = query.eq('action', options.action);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message || 'Failed to fetch audit logs');
  }

  type AuditLogRow = {
    id: string;
    org_id: string;
    actor_id: string;
    action: string;
    target_type: string;
    target_id: string;
    old_value: Record<string, unknown> | null;
    new_value: Record<string, unknown> | null;
    metadata: Record<string, unknown>;
    created_at: string;
  };
  const logs = (data || []).map((log: AuditLogRow) => ({
    id: log.id,
    org_id: log.org_id,
    actor_id: log.actor_id,
    action: log.action,
    target_type: log.target_type,
    target_id: log.target_id,
    old_value: log.old_value,
    new_value: log.new_value,
    metadata: log.metadata,
    created_at: log.created_at,
    actor_email: 'Unknown', // Can't fetch email without admin API
  })) as AuditLog[];

  const totalCount = count || 0;

  return {
    logs,
    totalCount,
    hasMore: offset + logs.length < totalCount,
  };
}
