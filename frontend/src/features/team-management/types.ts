/**
 * Types for team management feature
 */

export type InviteRole = 'admin' | 'member';

export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'canceled';

export type MemberRole = 'owner' | 'admin' | 'member';

export interface Invite {
  id: string;
  org_id: string;
  email: string;
  name?: string;
  role: InviteRole;
  status: InviteStatus;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface OrgMember {
  id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
  email?: string;
}

export interface OrgData {
  id: string;
  name: string;
}

export interface InviteCreateRequest {
  org_id: string;
  email: string;
  role: InviteRole;
  name?: string;
}
