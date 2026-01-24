/**
 * Admin Panel Types
 */

export type MemberRole = 'owner' | 'admin' | 'member';
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'canceled';

export interface DetailedMember {
  id: string;
  user_id: string;
  org_id: string;
  role: MemberRole;
  email: string | null;
  created_at: string;
  updated_at: string | null;
  last_login_at: string | null;
  session_count: number;
  run_count: number;
  last_active_at: string | null;
}

/**
 * System user from Supabase auth.users table
 */
export interface SystemUser {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  org_id: string | null;
  role: MemberRole | null;
  member_since: string | null;
}

export interface FullInvite {
  id: string;
  org_id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'member';
  status: InviteStatus;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export type AuditAction =
  | 'member_role_change'
  | 'member_removed'
  | 'account_deleted'
  | 'invite_created'
  | 'invite_canceled'
  | 'invite_resent'
  | 'invite_deleted';

export interface AuditLog {
  id: string;
  org_id: string;
  actor_id: string;
  actor_email: string;
  action: AuditAction;
  target_type: 'member' | 'invite';
  target_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface BulkActionRequest {
  member_ids: string[];
  action: 'update_role' | 'remove';
  role?: MemberRole;
}

export interface BulkActionResult {
  success: string[];
  failed: { id: string; error: string }[];
}

// Table sorting
export type SortDirection = 'asc' | 'desc';

export interface TableSort<T extends string = string> {
  column: T;
  direction: SortDirection;
}

export interface MembersFilter {
  search: string;
  role: MemberRole | 'all';
}

export interface InvitesFilter {
  search: string;
  status: InviteStatus | 'all';
}
