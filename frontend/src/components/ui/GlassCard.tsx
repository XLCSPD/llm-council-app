import { ReactNode, memo } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'strong' | 'elevated';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const variantClasses = {
  default: 'glass',
  subtle: 'glass-subtle',
  strong: 'glass-strong',
  elevated: 'glass-elevated',
};

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

// Memoized to prevent unnecessary re-renders in list contexts
export const GlassCard = memo(function GlassCard({
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
});
