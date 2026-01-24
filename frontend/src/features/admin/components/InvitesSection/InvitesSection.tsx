/**
 * InvitesSection - Container for invite management
 */

import { useState, useEffect, useCallback } from 'react';
import { Mail, Search, RefreshCw, Loader2, AlertCircle, Trash2, RotateCcw, XCircle } from 'lucide-react';
import { getAllInvites, deleteInvite } from '../../api';
import { cancelInvite, resendInvite } from '@/features/team-management/api/invites';
import type { FullInvite, InviteStatus, InvitesFilter } from '../../types';
import { ConfirmDialog } from '../shared';

interface InvitesSectionProps {
  orgId: string;
  userId: string;
}

export function InvitesSection({ orgId, userId }: InvitesSectionProps) {
  const [invites, setInvites] = useState<FullInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filter, setFilter] = useState<InvitesFilter>({ search: '', status: 'all' });

  // Action states
  const [deletingInvite, setDeletingInvite] = useState<FullInvite | null>(null);
  const [cancelingInvite, setCancelingInvite] = useState<FullInvite | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Fetch invites
  const fetchInvites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllInvites(orgId, userId);
      setInvites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invites');
    } finally {
      setLoading(false);
    }
  }, [orgId, userId]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  // Filter invites
  const filteredInvites = invites.filter((invite) => {
    // Search filter
    if (filter.search) {
      const search = filter.search.toLowerCase();
      const matchesEmail = invite.email.toLowerCase().includes(search);
      const matchesName = invite.name?.toLowerCase().includes(search);
      if (!matchesEmail && !matchesName) return false;
    }

    // Status filter
    if (filter.status !== 'all' && invite.status !== filter.status) {
      return false;
    }

    return true;
  });

  // Handle delete
  const handleDelete = async () => {
    if (!deletingInvite) return;
    setActionLoading(true);
    try {
      await deleteInvite(deletingInvite.id, userId);
      await fetchInvites();
      setDeletingInvite(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete invite');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!cancelingInvite) return;
    setActionLoading(true);
    try {
      await cancelInvite(cancelingInvite.id, userId);
      await fetchInvites();
      setCancelingInvite(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invite');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle resend
  const handleResend = async (invite: FullInvite) => {
    setResendingId(invite.id);
    try {
      await resendInvite(invite.id, userId);
      await fetchInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend invite');
    } finally {
      setResendingId(null);
    }
  };

  const getStatusStyle = (status: InviteStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/15 text-amber-400';
      case 'accepted':
        return 'bg-green-500/15 text-green-400';
      case 'expired':
        return 'bg-slate-500/15 text-slate-400';
      case 'canceled':
        return 'bg-red-500/15 text-red-400';
      default:
        return 'bg-slate-500/15 text-slate-400';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) return 'Expired';
    if (diffDays > 0) return `${diffDays}d left`;
    if (diffHours > 0) return `${diffHours}h left`;
    return `${diffMins}m left`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-primary">
            Invitations
          </h2>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-bg-tertiary text-text-secondary">
            {invites.length}
          </span>
        </div>

        <button
          onClick={fetchInvites}
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
            placeholder="Search by email..."
            value={filter.search}
            onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-bg-tertiary/50 border border-glass-border text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          />
        </div>

        <select
          value={filter.status}
          onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value as InviteStatus | 'all' }))}
          className="px-4 py-2 rounded-lg bg-bg-tertiary/50 border border-glass-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="expired">Expired</option>
          <option value="canceled">Canceled</option>
        </select>
      </div>

      {/* Table */}
      {loading && invites.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
        </div>
      ) : filteredInvites.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          {filter.search || filter.status !== 'all'
            ? 'No invites match your filters'
            : 'No invites found'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="p-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Email
                </th>
                <th className="p-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Role
                </th>
                <th className="p-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="p-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Expires
                </th>
                <th className="p-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Sent
                </th>
                <th className="p-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {filteredInvites.map((invite) => (
                <tr key={invite.id} className="hover:bg-bg-tertiary/30 transition-colors">
                  <td className="p-3">
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {invite.email}
                      </div>
                      {invite.name && (
                        <div className="text-xs text-text-muted">{invite.name}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-500/15 text-slate-400">
                      {invite.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(
                        invite.status
                      )}`}
                    >
                      {invite.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-text-secondary">
                    {invite.status === 'pending'
                      ? formatRelativeTime(invite.expires_at)
                      : '-'}
                  </td>
                  <td className="p-3 text-sm text-text-secondary">
                    {formatDate(invite.created_at)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      {invite.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleResend(invite)}
                            disabled={resendingId === invite.id}
                            className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors disabled:opacity-50"
                            title="Resend invite"
                          >
                            {resendingId === invite.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setCancelingInvite(invite)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            title="Cancel invite"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setDeletingInvite(invite)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete invite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingInvite}
        onClose={() => setDeletingInvite(null)}
        onConfirm={handleDelete}
        title="Delete Invite"
        message={`Are you sure you want to permanently delete the invite for ${deletingInvite?.email}? This will remove all record of this invitation.`}
        confirmText="Delete"
        variant="danger"
        loading={actionLoading}
      />

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={!!cancelingInvite}
        onClose={() => setCancelingInvite(null)}
        onConfirm={handleCancel}
        title="Cancel Invite"
        message={`Are you sure you want to cancel the invite for ${cancelingInvite?.email}? They will no longer be able to join using this invitation.`}
        confirmText="Cancel Invite"
        variant="warning"
        loading={actionLoading}
      />
    </div>
  );
}
