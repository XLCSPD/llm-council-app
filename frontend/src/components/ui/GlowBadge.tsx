import { ReactNode } from 'react';

type BadgeVariant = 'teal' | 'cyan' | 'success' | 'warning' | 'error' | 'thinker' | 'critic' | 'devils-advocate' | 'synthesizer' | 'tier-fast' | 'tier-balanced' | 'tier-deep' | 'tier-executive' | 'tier-code' | 'tier-critic';

interface GlowBadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; glow: string }> = {
  teal: {
    bg: 'bg-accent/20',
    text: 'text-accent-secondary',
    glow: 'shadow-[0_0_12px_rgba(13,148,136,0.4)]',
  },
  cyan: {
    bg: 'bg-accent-secondary/20',
    text: 'text-accent-secondary',
    glow: 'shadow-[0_0_12px_rgba(94,234,212,0.4)]',
  },
  success: {
    bg: 'bg-accent-success/20',
    text: 'text-accent-success',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]',
  },
  warning: {
    bg: 'bg-accent-warning/20',
    text: 'text-accent-warning',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]',
  },
  error: {
    bg: 'bg-accent-error/20',
    text: 'text-accent-error',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]',
  },
  thinker: {
    bg: 'bg-role-thinker/20',
    text: 'text-role-thinker',
    glow: 'shadow-[0_0_12px_rgba(99,102,241,0.4)]',
  },
  critic: {
    bg: 'bg-role-critic/20',
    text: 'text-role-critic',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]',
  },
  'devils-advocate': {
    bg: 'bg-role-devils-advocate/20',
    text: 'text-role-devils-advocate',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]',
  },
  synthesizer: {
    bg: 'bg-role-synthesizer/20',
    text: 'text-role-synthesizer',
    glow: 'shadow-[0_0_12px_rgba(13,148,136,0.4)]',
  },
  // Tier badges
  'tier-fast': {
    bg: 'bg-accent-success/20',
    text: 'text-accent-success',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]',
  },
  'tier-balanced': {
    bg: 'bg-accent/20',
    text: 'text-accent-secondary',
    glow: 'shadow-[0_0_12px_rgba(13,148,136,0.4)]',
  },
  'tier-deep': {
    bg: 'bg-role-thinker/20',
    text: 'text-role-thinker',
    glow: 'shadow-[0_0_12px_rgba(99,102,241,0.4)]',
  },
  'tier-executive': {
    bg: 'bg-accent-secondary/20',
    text: 'text-accent-secondary',
    glow: 'shadow-[0_0_12px_rgba(94,234,212,0.4)]',
  },
  'tier-code': {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.4)]',
  },
  'tier-critic': {
    bg: 'bg-accent-warning/20',
    text: 'text-accent-warning',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function GlowBadge({
  children,
  variant = 'teal',
  size = 'md',
  pulse = false,
  className = '',
}: GlowBadgeProps) {
  const styles = variantStyles[variant];
  const pulseClass = pulse ? 'animate-pulse' : '';

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${styles.bg} ${styles.text} ${styles.glow}
        ${sizeClasses[size]}
        ${pulseClass}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
