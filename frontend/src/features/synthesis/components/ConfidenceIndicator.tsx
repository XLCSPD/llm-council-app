import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface ConfidenceIndicatorProps {
  level: number; // 0-1 or 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

function normalizeLevel(level: number): number {
  // Handle both 0-1 and 0-100 scales
  return level > 1 ? level / 100 : level;
}

function getConfidenceLabel(level: number): string {
  const normalized = normalizeLevel(level);
  if (normalized >= 0.8) return 'High';
  if (normalized >= 0.5) return 'Medium';
  return 'Low';
}

function getConfidenceColor(level: number): {
  bg: string;
  text: string;
  fill: string;
  icon: string;
} {
  const normalized = normalizeLevel(level);
  if (normalized >= 0.8) {
    return {
      bg: 'bg-green-500/10',
      text: 'text-green-500',
      fill: 'bg-green-500',
      icon: 'text-green-500',
    };
  }
  if (normalized >= 0.5) {
    return {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-500',
      fill: 'bg-yellow-500',
      icon: 'text-yellow-500',
    };
  }
  return {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    fill: 'bg-red-500',
    icon: 'text-red-500',
  };
}

const sizeClasses = {
  sm: {
    container: 'px-2 py-1',
    icon: 'w-4 h-4',
    text: 'text-xs',
    bar: 'h-1.5 w-16',
  },
  md: {
    container: 'px-3 py-2',
    icon: 'w-5 h-5',
    text: 'text-sm',
    bar: 'h-2 w-24',
  },
  lg: {
    container: 'px-4 py-3',
    icon: 'w-6 h-6',
    text: 'text-base',
    bar: 'h-3 w-32',
  },
};

export function ConfidenceIndicator({
  level,
  size = 'md',
  showLabel = true,
}: ConfidenceIndicatorProps) {
  const normalized = normalizeLevel(level);
  const label = getConfidenceLabel(level);
  const colors = getConfidenceColor(level);
  const classes = sizeClasses[size];

  const Icon = normalized >= 0.8 ? ShieldCheck : normalized >= 0.5 ? Shield : ShieldAlert;

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg ${colors.bg} ${classes.container}`}>
      <Icon className={`${classes.icon} ${colors.icon}`} />
      <div className="flex flex-col gap-1">
        {showLabel && (
          <span className={`font-medium ${colors.text} ${classes.text}`}>
            {label} Confidence
          </span>
        )}
        <div className="flex items-center gap-2">
          <div className={`${classes.bar} bg-bg-tertiary rounded-full overflow-hidden`}>
            <div
              className={`h-full ${colors.fill} rounded-full transition-all duration-500`}
              style={{ width: `${normalized * 100}%` }}
            />
          </div>
          <span className={`font-mono ${colors.text} ${classes.text}`}>
            {Math.round(normalized * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}

interface ConfidenceBadgeProps {
  level: number;
}

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const label = getConfidenceLabel(level);
  const colors = getConfidenceColor(level);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${colors.bg}`}>
      <span className={`w-2 h-2 rounded-full ${colors.fill}`} />
      <span className={`text-sm font-medium ${colors.text}`}>{label}</span>
    </span>
  );
}
