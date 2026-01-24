/**
 * MembersTable - Data table with selection and inline actions
 */

import { Crown, Shield, User, Edit2, Trash2, Activity } from 'lucide-react';
import type { DetailedMember } from '../../types';

interface MembersTableProps {
  members: DetailedMember[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onEditRole: (member: DetailedMember) => void;
  onRemove: (member: DetailedMember) => void;
  currentUserId: string;
  isOwner: boolean;
}

export function MembersTable({
  members,
  selectedIds,
  onSelectionChange,
  onEditRole,
  onRemove,
  currentUserId,
  isOwner,
}: MembersTableProps) {
  const selectableMembers = members.filter(
    (m) => m.role !== 'owner' && m.user_id !== currentUserId
  );
  const allSelected =
    selectableMembers.length > 0 &&
    selectableMembers.every((m) => selectedIds.has(m.id));
  const someSelected =
    selectableMembers.some((m) => selectedIds.has(m.id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(selectableMembers.map((m) => m.id)));
    }
  };

  const toggleOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onSelectionChange(newSet);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-3 h-3" />;
      case 'admin':
        return <Shield className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/15 text-purple-400';
      case 'admin':
        return 'bg-amber-500/15 text-amber-400';
      default:
        return 'bg-slate-500/15 text-slate-400';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-glass-border">
            <th className="w-12 p-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={toggleAll}
                className="rounded border-glass-border bg-bg-tertiary"
                disabled={selectableMembers.length === 0}
              />
            </th>
            <th className="p-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Member
            </th>
            <th className="p-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Role
            </th>
            <th className="p-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Last Login
            </th>
            <th className="p-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Activity
            </th>
            <th className="p-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Joined
            </th>
            <th className="p-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-glass-border">
          {members.map((member) => {
            const isCurrentUser = member.user_id === currentUserId;
            const isOwnerRole = member.role === 'owner';
            const canSelect = !isOwnerRole && !isCurrentUser;
            const canEdit = isOwner && !isOwnerRole;
            const canRemove = !isOwnerRole && !isCurrentUser;

            return (
              <tr
                key={member.id}
                className={`hover:bg-bg-tertiary/30 transition-colors ${
                  selectedIds.has(member.id) ? 'bg-accent-primary/5' : ''
                }`}
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(member.id)}
                    onChange={() => toggleOne(member.id)}
                    disabled={!canSelect}
                    className="rounded border-glass-border bg-bg-tertiary disabled:opacity-30"
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-sm font-medium">
                      {member.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {member.email || 'Unknown'}
                        {isCurrentUser && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-accent-primary/20 text-accent-primary">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleStyle(
                      member.role
                    )}`}
                  >
                    {getRoleIcon(member.role)}
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                </td>
                <td className="p-3 text-sm text-text-secondary">
                  {formatRelativeTime(member.last_login_at)}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Activity className="w-3.5 h-3.5 text-text-muted" />
                    <span>{member.session_count} sessions</span>
                    <span className="text-text-muted">|</span>
                    <span>{member.run_count} runs</span>
                  </div>
                </td>
                <td className="p-3 text-sm text-text-secondary">
                  {formatDate(member.created_at)}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    {canEdit && (
                      <button
                        onClick={() => onEditRole(member)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                        title="Edit role"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canRemove && (
                      <button
                        onClick={() => onRemove(member)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
