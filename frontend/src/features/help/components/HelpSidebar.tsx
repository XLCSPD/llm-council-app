import { Play } from 'lucide-react';
import { useHelpStore } from '@/store/helpStore';
import { helpSections, type HelpSection } from '../content/helpContent';
import { useTour } from '../hooks/useTour';

interface HelpSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export function HelpSidebar({ activeSection, onSectionChange }: HelpSidebarProps) {
  const { tourCompleted } = useHelpStore();
  const { start: startTour } = useTour();

  return (
    <div className="w-64 flex-shrink-0 border-r border-border bg-bg-secondary/50 flex flex-col">
      {/* Section Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {helpSections.map((section: HelpSection) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{section.title}</div>
                <div className="text-xs text-text-muted truncate">{section.description}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Tour Button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={startTour}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-colors"
        >
          <Play className="w-4 h-4" />
          <span className="text-sm font-medium">
            {tourCompleted ? 'Restart Tour' : 'Start Guided Tour'}
          </span>
        </button>
      </div>
    </div>
  );
}
