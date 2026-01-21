/**
 * PendingInvitesList - Shows pending invites with cancel/resend actions
 * Features expiry countdown and loading states for each action
 */

import { useState } from 'react';
import { Mail, X, RefreshCw, Loader2, Clock, Shield, AlertCircle } from 'lucide-react';
import { cancelInvite, resendInvite } from '../api/invites';
import type { Invite } from '../types';

interface PendingInvitesListProps {
  invites: Invite[];
  onCancel: (inviteId: string) => void;
  userId: string;
}

function formatTimeUntil(dateString: string): string {
  const now = new Date();
  const target = new Date(dateString);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) return 'Expired';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;

  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m`;
}

export function PendingInvitesList({ invites, onCancel, userId }: PendingInvitesListProps) {
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resentIds, setResentIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCancel = async (invite: Invite) => {
    setCancelingId(invite.id);
    try {
      await cancelInvite(invite.id, userId);
      onCancel(invite.id);
    } catch (err) {
      console.error('Failed to cancel invite:', err);
    } finally {
      setCancelingId(null);
    }
  };

  const handleResend = async (invite: Invite) => {
    setResendingId(invite.id);
    setErrorMessage(null);
    try {
      await resendInvite(invite.id, userId);
      // Show brief success state
      setResentIds((prev) => new Set(prev).add(invite.id));
      setTimeout(() => {
        setResentIds((prev) => {
          const next = new Set(prev);
          next.delete(invite.id);
          return next;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to resend invite:', err);
      const message = err instanceof Error ? err.message : 'Failed to resend invite';
      setErrorMessage(message);
      // Clear error after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setResendingId(null);
    }
  };

  if (invites.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Error message */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}
      {invites.map((invite) => {
        const isExpiringSoon =
          new Date(invite.expires_at).getTime() < Date.now() + 24 * 60 * 60 * 1000;
        const wasResent = resentIds.has(invite.id);

        return (
          <div
            key={invite.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-200 truncate">
                  {invite.email}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {/* Role Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                      invite.role === 'admin'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-slate-600/50 text-slate-400'
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    {invite.role}
                  </span>
                  {/* Expiry */}
                  <span
                    className={`flex items-center gap-1 ${
                      isExpiringSoon ? 'text-yellow-500' : 'text-slate-500'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {formatTimeUntil(invite.expires_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Resend button */}
              <button
                onClick={() => handleResend(invite)}
                disabled={resendingId === invite.id || wasResent}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                  wasResent
                    ? 'text-green-400 bg-green-400/10'
                    : 'text-slate-400 hover:text-teal-400 hover:bg-teal-400/10'
                }`}
                title={wasResent ? 'Invite resent!' : 'Resend invite'}
              >
                {resendingId === invite.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className={`w-4 h-4 ${wasResent ? 'text-green-400' : ''}`} />
                )}
              </button>

              {/* Cancel button */}
              <button
                onClick={() => handleCancel(invite)}
                disabled={cancelingId === invite.id}
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                title="Cancel invite"
              >
                {cancelingId === invite.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
