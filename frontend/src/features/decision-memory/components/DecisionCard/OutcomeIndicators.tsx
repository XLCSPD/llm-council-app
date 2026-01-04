/**
 * OutcomeIndicators - Visual badges for consensus, cost, and phase depth
 * Provides at-a-glance understanding of session outcomes
 */

import { Target, Layers } from 'lucide-react';
import type { ConsensusTier, CostTier, DepthLevel } from '../../types';

interface OutcomeIndicatorsProps {
  consensus?: ConsensusTier;
  cost?: CostTier;
  depth?: DepthLevel;
  variant?: 'default' | 'compact';
  className?: string;
}

// Consensus tier styling
const CONSENSUS_STYLES: Record<ConsensusTier, { color: string; label: string }> = {
  high: { color: 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/30', label: 'High' },
  medium: { color: 'text-amber-400 bg-amber-400/10 ring-amber-400/30', label: 'Med' },
  low: { color: 'text-red-400 bg-red-400/10 ring-red-400/30', label: 'Low' },
  unknown: { color: 'text-slate-400 bg-slate-400/10 ring-slate-400/30', label: '—' },
};

// Cost tier styling
const COST_STYLES: Record<CostTier, { color: string; label: string; symbols: string }> = {
  low: { color: 'text-emerald-400', label: 'Low cost', symbols: '$' },
  medium: { color: 'text-amber-400', label: 'Medium cost', symbols: '$$' },
  high: { color: 'text-red-400', label: 'High cost', symbols: '$$$' },
};

export function OutcomeIndicators({
  consensus,
  cost,
  depth,
  variant = 'default',
  className = '',
}: OutcomeIndicatorsProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {consensus && (
          <ConsensusBadge tier={consensus} compact />
        )}
        {cost && (
          <CostBadge tier={cost} compact />
        )}
        {depth && (
          <DepthIndicator level={depth} compact />
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {consensus && (
        <ConsensusBadge tier={consensus} />
      )}
      {cost && (
        <CostBadge tier={cost} />
      )}
      {depth && (
        <DepthIndicator level={depth} />
      )}
    </div>
  );
}

/**
 * Consensus Badge - Shows agreement level among council members
 */
function ConsensusBadge({
  tier,
  compact = false,
}: {
  tier: ConsensusTier;
  compact?: boolean;
}) {
  const style = CONSENSUS_STYLES[tier];

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ring-1 ${style.color}`}
        title={`${style.label} consensus`}
      >
        <Target className="w-2.5 h-2.5" />
        {style.label}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ring-1 ${style.color}`}
      title="Consensus level"
    >
      <Target className="w-3 h-3" />
      <span>{style.label}</span>
    </div>
  );
}

/**
 * Cost Badge - Shows API cost tier
 */
function CostBadge({
  tier,
  compact = false,
}: {
  tier: CostTier;
  compact?: boolean;
}) {
  const style = COST_STYLES[tier];

  if (compact) {
    return (
      <span
        className={`text-[10px] font-mono font-bold ${style.color}`}
        title={style.label}
      >
        {style.symbols}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 text-xs ${style.color}`}
      title={style.label}
    >
      <span className="font-mono font-bold">{style.symbols}</span>
    </div>
  );
}

/**
 * Depth Indicator - Shows phases completed (1-4)
 */
function DepthIndicator({
  level,
  compact = false,
}: {
  level: DepthLevel;
  compact?: boolean;
}) {
  const maxLevel = 4;

  if (compact) {
    return (
      <div
        className="flex items-center gap-0.5"
        title={`Phase ${level} of ${maxLevel}`}
      >
        {Array.from({ length: maxLevel }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i < level ? 'bg-teal-400' : 'bg-slate-600'
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1 text-xs text-slate-400"
      title={`Completed ${level} of ${maxLevel} phases`}
    >
      <Layers className="w-3 h-3" />
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxLevel }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < level ? 'bg-teal-400' : 'bg-slate-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Star Rating Display - Shows user rating (1-5 stars)
 */
export function StarRatingDisplay({
  rating,
  size = 'sm',
  className = '',
}: {
  rating: number | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (rating === null) return null;

  const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className={`flex items-center gap-0.5 ${className}`} title={`Rating: ${rating}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`${starSize} ${
            i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
