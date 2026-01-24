/**
 * AuditSection - Container for audit log viewing
 */

import { useState, useEffect, useCallback } from 'react';
import { History, RefreshCw, Loader2, AlertCircle, ChevronLeft, ChevronRight, UserCog, UserMinus, Mail, MailX, RotateCcw, Trash2 } from 'lucide-react';
import { getAuditLogs } from '../../api';
import type { AuditLog, AuditAction } from '../../types';

interface AuditSectionProps {
  orgId: string;
  userId: string;
}

const PAGE_SIZE = 20;

export function AuditSection({ orgId, userId }: AuditSectionProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);

  // Filter
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAuditLogs(orgId, userId, {
        action: actionFilter === 'all' ? undefined : actionFilter,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setLogs(result.logs);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [orgId, userId, actionFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [actionFilter]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'member_role_change':
        return <UserCog className="w-4 h-4" />;
      case 'member_removed':
        return <UserMinus className="w-4 h-4" />;
      case 'invite_created':
        return <Mail className="w-4 h-4" />;
      case 'invite_canceled':
        return <MailX className="w-4 h-4" />;
      case 'invite_resent':
        return <RotateCcw className="w-4 h-4" />;
      case 'invite_deleted':
        return <Trash2 className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getActionStyle = (action: AuditAction) => {
    switch (action) {
      case 'member_role_change':
        return 'bg-blue-500/15 text-blue-400';
      case 'member_removed':
        return 'bg-red-500/15 text-red-400';
      case 'invite_created':
        return 'bg-green-500/15 text-green-400';
      case 'invite_canceled':
        return 'bg-amber-500/15 text-amber-400';
      case 'invite_resent':
        return 'bg-cyan-500/15 text-cyan-400';
      case 'invite_deleted':
        return 'bg-red-500/15 text-red-400';
      default:
        return 'bg-slate-500/15 text-slate-400';
    }
  };

  const formatActionLabel = (action: AuditAction) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionDescription = (log: AuditLog) => {
    const oldVal = log.old_value as Record<string, string> | null;
    const newVal = log.new_value as Record<string, string> | null;

    switch (log.action) {
      case 'member_role_change':
        return `Changed role from ${oldVal?.role || 'unknown'} to ${newVal?.role || 'unknown'}`;
      case 'member_removed':
        return `Removed member ${oldVal?.email || 'unknown'}`;
      case 'invite_created':
        return `Created invite for ${newVal?.email || 'unknown'}`;
      case 'invite_canceled':
        return `Canceled invite for ${oldVal?.email || 'unknown'}`;
      case 'invite_resent':
        return `Resent invite to ${oldVal?.email || 'unknown'}`;
      case 'invite_deleted':
        return `Deleted invite for ${oldVal?.email || 'unknown'}`;
      default:
        return log.action;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-primary">
            Audit Log
          </h2>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-bg-tertiary text-text-secondary">
            {totalCount}
          </span>
        </div>

        <button
          onClick={fetchLogs}
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

      {/* Filter */}
      <div className="flex gap-4">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value as AuditAction | 'all')}
          className="px-4 py-2 rounded-lg bg-bg-tertiary/50 border border-glass-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
        >
          <option value="all">All Actions</option>
          <option value="member_role_change">Role Changes</option>
          <option value="member_removed">Member Removals</option>
          <option value="invite_created">Invites Created</option>
          <option value="invite_canceled">Invites Canceled</option>
          <option value="invite_resent">Invites Resent</option>
          <option value="invite_deleted">Invites Deleted</option>
        </select>
      </div>

      {/* Log entries */}
      {loading && logs.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          {actionFilter !== 'all'
            ? 'No audit logs match your filter'
            : 'No audit logs yet'}
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-xl bg-bg-tertiary/30 border border-glass-border"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-2 rounded-lg ${getActionStyle(log.action)}`}
                >
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${getActionStyle(
                        log.action
                      )}`}
                    >
                      {formatActionLabel(log.action)}
                    </span>
                    <span className="text-xs text-text-muted">
                      by {log.actor_email}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    {getActionDescription(log)}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {formatDate(log.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-glass-border">
          <span className="text-sm text-text-muted">
            Showing {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-text-secondary">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
