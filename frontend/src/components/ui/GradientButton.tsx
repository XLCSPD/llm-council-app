import { ReactNode, ButtonHTMLAttributes } from 'react';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function GradientButton({
  children,
  variant = 'primary',
  size = 'md',
  glow = true,
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: GradientButtonProps) {
  const baseClasses = 'font-display font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2';

  const variantClasses = {
    primary: `bg-gradient-accent text-white btn-shimmer ${glow ? 'shadow-glow-teal hover:shadow-glow-cyan' : ''} hover:brightness-110`,
    secondary: 'bg-bg-tertiary text-text-primary border border-glass-border hover:bg-bg-elevated',
    outline: 'bg-transparent border-2 border-accent text-accent hover:bg-accent/10',
  };

  const disabledClasses = disabled || loading
    ? 'opacity-50 cursor-not-allowed'
    : 'hover:-translate-y-0.5 active:translate-y-0';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="w-5 h-5">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
