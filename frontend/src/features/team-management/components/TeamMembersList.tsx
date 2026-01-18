/**
 * TeamMembersList - Displays current organization members
 * Shows email, role badge, and highlights the current user
 */

import { User, Crown, Shield, Users } from 'lucide-react';
import type { OrgMember } from '../types';

interface TeamMembersListProps {
  members: OrgMember[];
  currentUserId: string;
  canManage?: boolean;
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'owner':
      return <Crown className="w-3 h-3" />;
    case 'admin':
      return <Shield className="w-3 h-3" />;
    default:
      return <Users className="w-3 h-3" />;
  }
}

function getRoleColor(role: string) {
  switch (role) {
    case 'owner':
      return 'bg-purple-500/15 text-purple-400';
    case 'admin':
      return 'bg-amber-500/15 text-amber-400';
    default:
      return 'bg-slate-600/50 text-slate-400';
  }
}

export function TeamMembersList({
  members,
  currentUserId,
}: TeamMembersListProps) {
  if (members.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-500">
        No team members found
      </div>
    );
  }

  // Sort: owners first, then admins, then members
  const sortedMembers = [...members].sort((a, b) => {
    const order = { owner: 0, admin: 1, member: 2 };
    return (order[a.role] ?? 3) - (order[b.role] ?? 3);
  });

  return (
    <div className="space-y-2">
      {sortedMembers.map((member) => {
        const isCurrentUser = member.user_id === currentUserId;

        return (
          <div
            key={member.id}
            className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
              isCurrentUser
                ? 'bg-teal-500/10 border border-teal-500/20'
                : 'bg-slate-800/30 border border-transparent hover:border-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCurrentUser ? 'bg-teal-500/20' : 'bg-slate-700'
                }`}
              >
                <User
                  className={`w-4 h-4 ${isCurrentUser ? 'text-teal-400' : 'text-slate-400'}`}
                />
              </div>

              {/* Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200 truncate">
                    {member.email || 'Unknown user'}
                  </span>
                  {isCurrentUser && (
                    <span className="text-xs text-teal-400 px-1.5 py-0.5 rounded bg-teal-500/15">
                      You
                    </span>
                  )}
                </div>
                {/* Show join date for non-current users */}
                {!isCurrentUser && member.created_at && (
                  <div className="text-xs text-slate-500">
                    Joined {new Date(member.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Role Badge */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${getRoleColor(
                member.role
              )}`}
            >
              {getRoleIcon(member.role)}
              <span className="capitalize">{member.role}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
