/**
 * Team Management Invite API
 * Handles invite creation, listing, and management via orchestrator
 * Falls back to direct Supabase queries when orchestrator is unavailable
 */

import { supabase } from '@/lib/supabase';
import type { Invite, InviteCreateRequest, OrgMember } from '../types';

const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:8002';

/**
 * Create and send an organization invite
 */
export async function createInvite(
  request: InviteCreateRequest,
  userId: string
): Promise<Invite> {
  const response = await fetch(`${ORCHESTRATOR_URL}/api/invites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
      'X-Redirect-URL': window.location.origin,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to create invite' }));
    throw new Error(error.detail || 'Failed to create invite');
  }

  return response.json();
}

/**
 * Get all invites for an organization
 * Falls back to direct Supabase query if orchestrator unavailable
 */
export async function getOrgInvites(
  orgId: string,
  userId: string
): Promise<Invite[]> {
  try {
    const response = await fetch(`${ORCHESTRATOR_URL}/api/orgs/${orgId}/invites`, {
      headers: {
        'X-User-ID': userId,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.invites;
    }
  } catch {
    // Orchestrator unavailable, fall back to Supabase
  }

  // Fallback: Query Supabase directly
  const { data: invites, error } = await supabase
    .from('org_invites')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch invites');
  }

  return (invites || []).map((i) => ({
    id: i.id,
    org_id: i.org_id,
    email: i.email,
    role: i.role as Invite['role'],
    status: i.status as Invite['status'],
    invited_by: i.invited_by,
    expires_at: i.expires_at,
    created_at: i.created_at,
  }));
}

/**
 * Get all members of an organization
 * Falls back to direct Supabase query if orchestrator unavailable
 */
export async function getOrgMembers(
  orgId: string,
  userId: string
): Promise<OrgMember[]> {
  try {
    const response = await fetch(`${ORCHESTRATOR_URL}/api/orgs/${orgId}/members`, {
      headers: {
        'X-User-ID': userId,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.members;
    }
  } catch {
    // Orchestrator unavailable, fall back to Supabase
  }

  // Fallback: Query Supabase directly
  const { data: members, error } = await supabase
    .from('org_members')
    .select('id, user_id, role, created_at')
    .eq('org_id', orgId);

  if (error) {
    throw new Error('Failed to fetch members');
  }

  // Get user emails from auth (we can only see our own email via RLS)
  // For other members, we'll show a placeholder
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  return (members || []).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    email: m.user_id === currentUser?.id ? currentUser.email || 'Unknown' : 'Team Member',
    role: m.role as OrgMember['role'],
    created_at: m.created_at,
  }));
}

/**
 * Cancel a pending invite
 */
export async function cancelInvite(
  inviteId: string,
  userId: string
): Promise<void> {
  const response = await fetch(`${ORCHESTRATOR_URL}/api/invites/${inviteId}/cancel`, {
    method: 'POST',
    headers: {
      'X-User-ID': userId,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to cancel invite' }));
    throw new Error(error.detail || 'Failed to cancel invite');
  }
}

/**
 * Resend an invite email
 */
export async function resendInvite(
  inviteId: string,
  userId: string
): Promise<void> {
  const response = await fetch(`${ORCHESTRATOR_URL}/api/invites/${inviteId}/resend`, {
    method: 'POST',
    headers: {
      'X-User-ID': userId,
      'X-Redirect-URL': window.location.origin,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to resend invite' }));
    throw new Error(error.detail || 'Failed to resend invite');
  }
}
