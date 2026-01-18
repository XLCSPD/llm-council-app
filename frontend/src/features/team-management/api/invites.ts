/**
 * Team Management Invite API
 * Handles invite creation, listing, and management via orchestrator
 */

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
 */
export async function getOrgInvites(
  orgId: string,
  userId: string
): Promise<Invite[]> {
  const response = await fetch(`${ORCHESTRATOR_URL}/api/orgs/${orgId}/invites`, {
    headers: {
      'X-User-ID': userId,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch invites');
  }

  const data = await response.json();
  return data.invites;
}

/**
 * Get all members of an organization
 */
export async function getOrgMembers(
  orgId: string,
  userId: string
): Promise<OrgMember[]> {
  const response = await fetch(`${ORCHESTRATOR_URL}/api/orgs/${orgId}/members`, {
    headers: {
      'X-User-ID': userId,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch members');
  }

  const data = await response.json();
  return data.members;
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
