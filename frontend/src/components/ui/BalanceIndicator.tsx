/**
 * BalanceIndicator - Shows the balance status of a council configuration.
 *
 * Displays different states based on whether the council has adversarial roles:
 * - Balanced (green): Council has critic/devils_advocate
 * - Will Auto-Balance (yellow): Missing adversarial, but auto-balance is ON
 * - Needs Critic (yellow + button): Missing adversarial, auto-balance is OFF
 * - Invalid (red): Council has structural issues (<2 members or >1 chair)
 */

import { memo } from 'react';
import { ShieldCheck, ShieldAlert, Shield, Plus } from 'lucide-react';
import { GlowBadge } from './GlowBadge';
import type { BalanceStatus } from '@/utils/councilValidation';

interface BalanceIndicatorProps {
  /** Balance status from getBalanceStatus() */
  status: BalanceStatus;
  /** Whether auto-balance is enabled (affects messaging) */
  autoBalanceEnabled?: boolean;
  /** Whether to show additional details */
  showDetails?: boolean;
  /** Callback for one-click fix when auto-balance is OFF */
  onAddCritic?: () => void;
}

export const BalanceIndicator = memo(function BalanceIndicator({
  status,
  autoBalanceEnabled = true,
  showDetails = false,
  onAddCritic,
}: BalanceIndicatorProps) {
  // Don't show indicator for incomplete councils (less than 2 members)
  if (status.memberCount < 2) {
    return null;
  }

  // Invalid council (too many chairs)
  if (status.chairCount > 1) {
    return (
      <div className="flex items-center gap-2">
        <GlowBadge variant="error" size="sm">
          <Shield className="w-3.5 h-3.5 mr-1" />
          Invalid
        </GlowBadge>
        {showDetails && (
          <span className="text-xs text-accent-error">
            Maximum 1 chair allowed
          </span>
        )}
      </div>
    );
  }

  // Balanced council
  if (status.isBalanced) {
    return (
      <GlowBadge variant="success" size="sm">
        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
        Balanced
      </GlowBadge>
    );
  }

  // Unbalanced but will auto-balance
  if (status.willAutoBalance && autoBalanceEnabled) {
    return (
      <div className="flex items-center gap-2">
        <GlowBadge variant="warning" size="sm">
          <ShieldAlert className="w-3.5 h-3.5 mr-1" />
          Will Auto-Balance
        </GlowBadge>
        {showDetails && (
          <span className="text-xs text-text-muted">
            A critic will be assigned on start
          </span>
        )}
      </div>
    );
  }

  // Unbalanced and auto-balance is OFF - show one-click fix
  if (!status.hasAdversarialRole) {
    return (
      <div className="flex items-center gap-2">
        <GlowBadge variant="warning" size="sm">
          <ShieldAlert className="w-3.5 h-3.5 mr-1" />
          Needs Critic
        </GlowBadge>
        {onAddCritic && (
          <button
            onClick={onAddCritic}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-accent-warning hover:text-accent-warning/80 bg-accent-warning/10 hover:bg-accent-warning/20 rounded-full transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Critic
          </button>
        )}
        {showDetails && !onAddCritic && (
          <span className="text-xs text-text-muted">
            Add a critic or devil&apos;s advocate
          </span>
        )}
      </div>
    );
  }

  // Fallback for other invalid states
  return (
    <GlowBadge variant="error" size="sm">
      <Shield className="w-3.5 h-3.5 mr-1" />
      {status.issues[0] || 'Invalid'}
    </GlowBadge>
  );
});
