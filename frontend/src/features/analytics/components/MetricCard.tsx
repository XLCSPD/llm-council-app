/**
 * MetricCard - Summary metric card for dashboard header
 */

import { Users, Play, CheckCircle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

type IconType = 'users' | 'play' | 'check' | 'dollar';
type ValueColor = 'default' | 'success' | 'warning' | 'error';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: IconType;
  change?: {
    value: number;
    isPositive: boolean;
  };
  valueColor?: ValueColor;
}

const ICON_MAP = {
  users: Users,
  play: Play,
  check: CheckCircle,
  dollar: DollarSign,
};

const VALUE_COLORS = {
  default: 'text-text-primary',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
};

export function MetricCard({
  title,
  value,
  icon,
  change,
  valueColor = 'default',
}: MetricCardProps) {
  const IconComponent = ICON_MAP[icon];

  return (
    <div className="p-4 rounded-xl bg-bg-secondary/50 border border-glass-border hover:border-glass-border-hover transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-accent-primary/10">
          <IconComponent className="w-4 h-4 text-accent-primary" />
        </div>
        {change && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              change.isPositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {change.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(change.value)}%
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold ${VALUE_COLORS[valueColor]}`}>
        {value}
      </div>
      <div className="text-sm text-text-tertiary mt-1">{title}</div>
    </div>
  );
}
