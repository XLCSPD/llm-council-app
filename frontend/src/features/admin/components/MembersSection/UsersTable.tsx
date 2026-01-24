/**
 * UsersTable - Data table for all system users
 */

import { Crown, Shield, User, Trash2, UserX } from 'lucide-react';
import type { SystemUser } from '../../types';

interface UsersTableProps {
  users: SystemUser[];
  onRemove: (user: SystemUser) => void;
  currentUserId: string;
  isOwner: boolean;
}

export function UsersTable({
  users,
  onRemove,
  currentUserId,
  isOwner,
}: UsersTableProps) {
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

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-3 h-3" />;
      case 'admin':
        return <Shield className="w-3 h-3" />;
      case 'member':
        return <User className="w-3 h-3" />;
      default:
        return <UserX className="w-3 h-3" />;
    }
  };

  const getRoleStyle = (role: string | null) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/15 text-purple-400';
      case 'admin':
        return 'bg-amber-500/15 text-amber-400';
      case 'member':
        return 'bg-slate-500/15 text-slate-400';
      default:
        return 'bg-red-500/10 text-red-400';
    }
  };

  const getRoleLabel = (role: string | null) => {
    if (!role) return 'Not a member';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-glass-border">
            <th className="p-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              User
            </th>
            <th className="p-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Status
            </th>
            <th className="p-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Last Sign In
            </th>
            <th className="p-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Created
            </th>
            <th className="p-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-glass-border">
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId;
            const isOwnerRole = user.role === 'owner';
            const canRemove = isOwner && !isOwnerRole && !isCurrentUser;

            return (
              <tr
                key={user.id}
                className="hover:bg-bg-tertiary/30 transition-colors"
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-sm font-medium">
                      {user.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {user.display_name || user.email || 'Unknown'}
                        {isCurrentUser && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-accent-primary/20 text-accent-primary">
                            You
                          </span>
                        )}
                      </div>
                      {user.display_name && user.email && (
                        <div className="text-xs text-text-muted">{user.email}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleStyle(
                      user.role
                    )}`}
                  >
                    {getRoleIcon(user.role)}
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="p-3 text-sm text-text-secondary">
                  {formatRelativeTime(user.last_sign_in_at)}
                </td>
                <td className="p-3 text-sm text-text-secondary">
                  {formatDate(user.created_at)}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    {canRemove && (
                      <button
                        onClick={() => onRemove(user)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {!canRemove && !isCurrentUser && !isOwnerRole && (
                      <span className="text-xs text-text-muted">Admin only</span>
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
