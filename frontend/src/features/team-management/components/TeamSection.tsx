/**
 * TeamSection - Main team management section for Settings page
 * Displays org members, pending invites, and invite button
 */

import { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore, useWorkspaceStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { InviteModal } from './InviteModal';
import { PendingInvitesList } from './PendingInvitesList';
import { TeamMembersList } from './TeamMembersList';
import { getOrgInvites, getOrgMembers } from '../api/invites';
import type { Invite, OrgMember, OrgData, MemberRole } from '../types';

export function TeamSection() {
  const { user } = useAuthStore();
  const { fetchWorkspace } = useWorkspaceStore();
  const [org, setOrg] = useState<OrgData | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<MemberRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Fetch org, members, and invites
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Ensure user has a workspace set up (cached — no-op if already initialized)
        await fetchWorkspace(user.id);

        // Get user's org membership (use limit(1) in case user has multiple orgs)
        const { data: membershipData, error: membershipError } = await supabase
          .from('org_members')
          .select('org_id, role')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (membershipError || !membershipData || membershipData.length === 0) {
          console.error('Org membership query failed:', membershipError);
          setError('Could not find your organization');
          setIsLoading(false);
          return;
        }

        const membership = membershipData[0] as unknown as { org_id: string; role: MemberRole };
        setCurrentUserRole(membership.role);

        // Get org details
        const { data: orgResult, error: orgError } = await supabase
          .from('orgs')
          .select('id, name')
          .eq('id', membership.org_id)
          .single();

        if (orgError || !orgResult) {
          setError('Could not load organization details');
          setIsLoading(false);
          return;
        }

        setOrg(orgResult as OrgData);

        // Get all members
        const membersData = await getOrgMembers(membership.org_id, user.id);
        setMembers(membersData);

        // Get pending invites (all members can view)
        try {
          const invitesData = await getOrgInvites(membership.org_id, user.id);
          setInvites(invitesData.filter((i) => i.status === 'pending'));
        } catch {
          // Silently fail if invites can't be fetched - might not have the table yet
          setInvites([]);
        }
      } catch (err) {
        console.error('Failed to fetch team data:', err);
        setError('Failed to load team data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Only owners can manage members (remove, change roles)
  const canManageMembers = currentUserRole === 'owner';

  const handleInviteCreated = (invite: Invite) => {
    setInvites((prev) => [invite, ...prev]);
  };

  const handleInviteCanceled = (inviteId: string) => {
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with org name and invite button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-medium text-text-primary">
              {org?.name || 'My Organization'}
            </h3>
            <p className="text-xs text-text-muted">
              {members.length} member{members.length !== 1 ? 's' : ''}
              {invites.length > 0 && ` · ${invites.length} pending`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
            bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500
            text-white shadow-lg shadow-teal-500/20
            transition-all duration-200 hover:-translate-y-0.5"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Current Members */}
      <div>
        <h4 className="text-sm font-medium text-text-secondary mb-3">Team Members</h4>
        <TeamMembersList
          members={members}
          currentUserId={user?.id || ''}
          canManage={canManageMembers}
        />
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="pt-4 border-t border-glass-border">
          <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            Pending Invites
          </h4>
          <PendingInvitesList
            invites={invites}
            onCancel={handleInviteCanceled}
            userId={user?.id || ''}
          />
        </div>
      )}

      {/* Empty state for no pending invites */}
      {invites.length === 0 && members.length === 1 && (
        <div className="pt-4 border-t border-glass-border">
          <div className="text-center py-6 px-4 rounded-xl bg-slate-800/30 border border-dashed border-slate-700">
            <UserPlus className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400 mb-1">No team members yet</p>
            <p className="text-xs text-slate-500">
              Invite colleagues to collaborate on AI deliberations
            </p>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {org && user && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          orgId={org.id}
          userId={user.id}
          onInviteCreated={handleInviteCreated}
        />
      )}
    </div>
  );
}
