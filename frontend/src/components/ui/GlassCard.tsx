import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'strong';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const variantClasses = {
  default: 'glass',
  subtle: 'glass-subtle',
  strong: 'glass-strong',
};

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export function GlassCard({
  children,
  className = '',
  variant = 'default',
  hover = false,
  padding = 'md',
  onClick,
}: GlassCardProps) {
  const baseClasses = 'rounded-2xl';
  const hoverClasses = hover ? 'card-interactive cursor-pointer' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
