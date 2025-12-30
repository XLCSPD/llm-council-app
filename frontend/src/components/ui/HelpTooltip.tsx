import { HelpCircle } from 'lucide-react';
import { getTooltip } from '@/features/help/content/tooltipContent';
import { useUIStore } from '@/store';
import { useHelpStore } from '@/store/helpStore';

interface HelpTooltipProps {
  /** Tooltip ID that maps to tooltipContent */
  id: string;
  /** Position of the tooltip relative to the icon */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Size of the help icon */
  size?: 'sm' | 'md';
  /** Custom className for the container */
  className?: string;
}

export function HelpTooltip({
  id,
  position = 'top',
  size = 'sm',
  className = '',
}: HelpTooltipProps) {
  const tooltip = getTooltip(id);
  const { setCurrentView } = useUIStore();
  const { setActiveSection } = useHelpStore();

  if (!tooltip) {
    console.warn(`HelpTooltip: No tooltip found for id "${id}"`);
    return null;
  }

  const handleLearnMore = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (tooltip.learnMoreSection) {
      setActiveSection(tooltip.learnMoreSection);
      setCurrentView('help');
    }
  };

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

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
    <div className={`relative group inline-flex ${className}`}>
      <HelpCircle
        className={`${iconSize} text-text-muted cursor-help opacity-60 hover:opacity-100 transition-opacity`}
      />
      <div
        className={`absolute ${positionClasses[position]} px-3 py-2
                    bg-bg-tertiary border border-border rounded-lg shadow-lg
                    text-xs max-w-[280px] w-max
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible
                    transition-all duration-200 z-50`}
      >
        <div className="font-medium text-text-primary mb-1">{tooltip.title}</div>
        <div className="text-text-secondary leading-relaxed">{tooltip.content}</div>
        {tooltip.learnMoreSection && (
          <button
            onClick={handleLearnMore}
            className="mt-2 text-accent-primary hover:text-accent-secondary text-xs font-medium transition-colors"
          >
            Learn more &rarr;
          </button>
        )}
        <div className={`absolute border-4 ${arrowClasses[position]}`} />
      </div>
    </div>
  );
}
