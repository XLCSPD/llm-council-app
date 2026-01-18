import { ArrowLeft, Settings } from 'lucide-react';
import { useUIStore } from '@/store';
import { GlassCard } from '@/components/ui/GlassCard';
import { APISettingsSection } from './APISettingsSection';
import { ModelDefaultsSection } from './ModelDefaultsSection';
import { PreferencesSection } from './PreferencesSection';
import { AccountSection } from './AccountSection';
import { TeamSection } from '@/features/team-management';

export function SettingsPage() {
  const setCurrentView = useUIStore((state) => state.setCurrentView);

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setCurrentView('deliberation')}
          className="p-2 rounded-xl hover:bg-bg-tertiary/50 transition-colors"
          aria-label="Back to deliberation"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-accent">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-display font-semibold text-text-primary">
            Settings
          </h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-3xl mx-auto space-y-6">
        {/* API & Model Configuration */}
        <GlassCard variant="default" padding="lg">
          <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-accent rounded-full" />
            API & Model Configuration
          </h2>
          <div className="space-y-6">
            <APISettingsSection />
            <div className="border-t border-glass-border pt-6">
              <ModelDefaultsSection />
            </div>
          </div>
        </GlassCard>

        {/* User Preferences */}
        <GlassCard variant="default" padding="lg">
          <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-accent rounded-full" />
            User Preferences
          </h2>
          <PreferencesSection />
        </GlassCard>

        {/* Account */}
        <GlassCard variant="default" padding="lg">
          <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-accent rounded-full" />
            Account
          </h2>
          <AccountSection />
        </GlassCard>

        {/* Team Management */}
        <GlassCard variant="default" padding="lg">
          <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-accent rounded-full" />
            Team
          </h2>
          <TeamSection />
        </GlassCard>
      </div>
    </div>
  );
}
