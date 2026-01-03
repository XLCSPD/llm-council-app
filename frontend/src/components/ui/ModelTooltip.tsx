import { getModelDescription } from '@/features/help/content/modelDescriptions';

interface ModelTooltipProps {
  /** Model ID to display description for */
  modelId: string;
  /** Content to wrap with tooltip trigger */
  children: React.ReactNode;
  /** Position of the tooltip relative to the content */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Custom className for the container */
  className?: string;
}

/**
 * Displays a tooltip with model description on hover.
 * Shows tagline, description, and best-use-cases for the model.
 */
export function ModelTooltip({
  modelId,
  children,
  position = 'top',
  className = '',
}: ModelTooltipProps) {
  const description = getModelDescription(modelId);

  // If no description found, just render children without tooltip
  if (!description) {
    return <>{children}</>;
  }

  // Position classes for the tooltip
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Arrow classes based on position
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-bg-tertiary border-x-transparent border-b-transparent',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-bg-tertiary border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-bg-tertiary border-y-transparent border-r-transparent',
    right:
      'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-bg-tertiary border-y-transparent border-l-transparent',
  };

  return (
    <div className={`relative group ${className}`}>
      {children}
      <div
        className={`absolute ${positionClasses[position]} px-3 py-2.5
                    bg-bg-tertiary border border-border rounded-lg shadow-lg
                    text-xs max-w-[300px] w-max
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible
                    transition-all duration-200 z-50 pointer-events-none`}
      >
        {/* Tagline */}
        <div className="font-medium text-text-primary mb-1">
          {description.tagline}
        </div>

        {/* Description */}
        <div className="text-text-secondary leading-relaxed mb-2">
          {description.description}
        </div>

        {/* Best For */}
        {description.bestFor.length > 0 && (
          <div>
            <div className="text-text-muted text-[10px] uppercase tracking-wide mb-1">
              Best for
            </div>
            <div className="flex flex-wrap gap-1">
              {description.bestFor.map((use, index) => (
                <span
                  key={index}
                  className="px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[10px]"
                >
                  {use}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Arrow */}
        <div className={`absolute border-4 ${arrowClasses[position]}`} />
      </div>
    </div>
  );
}
