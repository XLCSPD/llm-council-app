/**
 * MembersSection - Container for member management
 * Shows all system users from Supabase auth
 */

import { useState, useEffect, useCallback } from 'react';
import { Users, Search, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { getAllSystemUsers, removeMember } from '../../api';
import type { SystemUser } from '../../types';
import { UsersTable } from './UsersTable';
import { RemoveMemberDialog } from '../shared';

interface MembersSectionProps {
  orgId: string;
  userId: string;
  isOwner: boolean;
}

type UserFilter = {
  search: string;
  membership: 'all' | 'members' | 'non-members';
};

export function MembersSection({ orgId, userId, isOwner }: MembersSectionProps) {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filter, setFilter] = useState<UserFilter>({ search: '', membership: 'all' });

  // Modal states
  const [removingUser, setRemovingUser] = useState<SystemUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all system users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSystemUsers(userId);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users
  const filteredUsers = users.filter((user) => {
    // Search filter
    if (filter.search) {
      const search = filter.search.toLowerCase();
      const matchesEmail = user.email?.toLowerCase().includes(search);
      const matchesName = user.display_name?.toLowerCase().includes(search);
      if (!matchesEmail && !matchesName) return false;
    }

    // Membership filter
    if (filter.membership === 'members' && !user.role) {
      return false;
    }
    if (filter.membership === 'non-members' && user.role) {
      return false;
    }

    return true;
  });

  // Handle user deletion (account delete)
  const handleRemove = async (deleteAccount: boolean = false) => {
    if (!removingUser) return;
    setActionLoading(true);
    try {
      // For system users, we use their id directly
      // If they're an org member, use removeMember; otherwise need direct deletion
      if (removingUser.role) {
        // User is an org member - need to find their member_id
        // For now, just delete the account directly
        await removeMember(orgId, removingUser.id, userId, deleteAccount);
      } else if (deleteAccount) {
        // User is not an org member but wants to delete account
        // This requires a direct auth.users delete which needs orchestrator
        await removeMember(orgId, removingUser.id, userId, true);
      }
      await fetchUsers();
      setRemovingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-primary">
            All Users
          </h2>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-bg-tertiary text-text-secondary">
            {users.length}
          </span>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={filter.search}
            onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-bg-tertiary/50 border border-glass-border text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          />
        </div>

        <select
          value={filter.membership}
          onChange={(e) => setFilter((f) => ({ ...f, membership: e.target.value as 'all' | 'members' | 'non-members' }))}
          className="px-4 py-2 rounded-lg bg-bg-tertiary/50 border border-glass-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
        >
          <option value="all">All Users</option>
          <option value="members">Org Members</option>
          <option value="non-members">Not Members</option>
        </select>
      </div>

      {/* Table */}
      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          {filter.search || filter.membership !== 'all'
            ? 'No users match your filters'
            : 'No users found'}
        </div>
      ) : (
        <UsersTable
          users={filteredUsers}
          onRemove={setRemovingUser}
          currentUserId={userId}
          isOwner={isOwner}
        />
      )}

      {/* Remove Confirmation */}
      <RemoveMemberDialog
        isOpen={!!removingUser}
        onClose={() => setRemovingUser(null)}
        onRemove={handleRemove}
        memberEmail={removingUser?.email || null}
        loading={actionLoading}
      />
    </div>
  );
}
