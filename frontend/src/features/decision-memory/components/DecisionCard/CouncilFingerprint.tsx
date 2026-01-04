/**
 * CouncilFingerprint - Compact visual representation of council members
 * Displays role-colored chips for models with overflow indicator
 */

import type { RoleType } from '@/types';
import type { CouncilFingerprint as CouncilFingerprintType } from '../../types';

interface CouncilFingerprintProps {
  members: CouncilFingerprintType[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

// Role colors matching the app theme
const ROLE_COLORS: Record<RoleType, { bg: string; text: string; ring: string }> = {
  thinker: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    ring: 'ring-blue-500/30',
  },
  critic: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    ring: 'ring-amber-500/30',
  },
  devils_advocate: {
    bg: 'bg-rose-500/20',
    text: 'text-rose-400',
    ring: 'ring-rose-500/30',
  },
  synthesizer: {
    bg: 'bg-teal-500/20',
    text: 'text-teal-400',
    ring: 'ring-teal-500/30',
  },
};

const ROLE_LABELS: Record<RoleType, string> = {
  thinker: 'T',
  critic: 'C',
  devils_advocate: 'D',
  synthesizer: 'S',
};

const SIZE_CLASSES = {
  sm: {
    chip: 'h-5 min-w-5 px-1.5 text-[10px]',
    dot: 'w-2 h-2',
    spacing: '-space-x-1',
  },
  md: {
    chip: 'h-6 min-w-6 px-2 text-xs',
    dot: 'w-2.5 h-2.5',
    spacing: '-space-x-1.5',
  },
  lg: {
    chip: 'h-7 min-w-7 px-2.5 text-xs',
    dot: 'w-3 h-3',
    spacing: '-space-x-2',
  },
};

export function CouncilFingerprint({
  members,
  maxVisible = 4,
  size = 'md',
  showLabels = true,
  className = '',
}: CouncilFingerprintProps) {
  const visibleMembers = members.slice(0, maxVisible);
  const overflowCount = members.length - maxVisible;
  const sizeClasses = SIZE_CLASSES[size];

  if (members.length === 0) {
    return (
      <span className="text-xs text-slate-500 italic">No council</span>
    );
  }

  return (
    <div className={`flex items-center ${sizeClasses.spacing} ${className}`}>
      {visibleMembers.map((member, idx) => {
        const colors = ROLE_COLORS[member.role] || ROLE_COLORS.thinker;

        return (
          <div
            key={`${member.modelKey}-${idx}`}
            className={`
              ${sizeClasses.chip} rounded-full
              ${colors.bg} ${colors.text}
              ring-1 ${colors.ring}
              flex items-center justify-center font-medium
              relative z-${10 - idx}
            `}
            title={`${member.displayName} (${member.role.replace('_', ' ')})`}
          >
            {showLabels ? (
              <span>{ROLE_LABELS[member.role]}</span>
            ) : (
              <div className={`${sizeClasses.dot} rounded-full bg-current`} />
            )}
          </div>
        );
      })}

      {overflowCount > 0 && (
        <div
          className={`
            ${sizeClasses.chip} rounded-full
            bg-slate-600/50 text-slate-300
            ring-1 ring-slate-500/30
            flex items-center justify-center font-medium
          `}
          title={`+${overflowCount} more members`}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
}

/**
 * Simple dot-based fingerprint for very compact displays
 */
export function CouncilDots({
  members,
  maxVisible = 5,
  className = '',
}: {
  members: CouncilFingerprintType[];
  maxVisible?: number;
  className?: string;
}) {
  const visibleMembers = members.slice(0, maxVisible);
  const overflowCount = members.length - maxVisible;

  const DOT_COLORS: Record<RoleType, string> = {
    thinker: 'bg-blue-400',
    critic: 'bg-amber-400',
    devils_advocate: 'bg-rose-400',
    synthesizer: 'bg-teal-400',
  };

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {visibleMembers.map((member, idx) => (
        <div
          key={`${member.modelKey}-${idx}`}
          className={`w-2 h-2 rounded-full ${DOT_COLORS[member.role] || 'bg-slate-400'}`}
          title={`${member.displayName} (${member.role})`}
        />
      ))}
      {overflowCount > 0 && (
        <span className="text-[10px] text-slate-500 ml-0.5">+{overflowCount}</span>
      )}
    </div>
  );
}
