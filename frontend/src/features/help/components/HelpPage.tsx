import { ArrowLeft } from 'lucide-react';
import { useHelpStore } from '@/store/helpStore';
import { useUIStore } from '@/store/uiStore';
import { GlassCard } from '@/components/ui';
import { helpSections } from '../content/helpContent';
import { HelpSidebar } from './HelpSidebar';
import { HelpSection } from './HelpSection';

export function HelpPage() {
  const { activeSection, setActiveSection } = useHelpStore();
  const { setCurrentView } = useUIStore();

  const currentSection = helpSections.find((s) => s.id === activeSection) || helpSections[0];

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 md:px-6 py-4 border-b border-border bg-bg-secondary/50">
        <button
          onClick={() => setCurrentView('deliberation')}
          className="p-2 -ml-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors touch-target"
          aria-label="Back to deliberation"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-text-primary">Help & Guide</h1>
          <p className="text-sm text-text-muted">Learn how to use LLM Council</p>
        </div>
      </div>

      {/* Mobile Section Tabs - Outside flex container for proper mobile layout */}
      <div className="md:hidden border-b border-border bg-bg-secondary/50 overflow-x-auto hide-scrollbar-mobile">
        <div className="flex px-4 py-2 gap-2">
          {helpSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors touch-target-sm ${
                  isActive
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {section.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden md:block">
          <HelpSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <GlassCard className="max-w-3xl mx-auto">
            <div className="p-4 md:p-6">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                {currentSection && (
                  <>
                    <div className="p-2 rounded-lg bg-accent-primary/10 flex-shrink-0">
                      <currentSection.icon className="w-5 h-5 text-accent-primary" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg md:text-xl font-semibold text-text-primary">
                        {currentSection.title}
                      </h2>
                      <p className="text-sm text-text-muted">{currentSection.description}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Section Content */}
              {currentSection && <HelpSection content={currentSection.content} />}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
