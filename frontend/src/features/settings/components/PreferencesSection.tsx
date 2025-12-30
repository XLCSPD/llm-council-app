import { Sun, Moon, DollarSign, Hash } from 'lucide-react';
import { useUIStore, useSettingsStore } from '@/store';

export function PreferencesSection() {
  const { theme, toggleTheme } = useUIStore();
  const {
    showCostEstimates,
    showTokenCounts,
    setShowCostEstimates,
    setShowTokenCounts,
  } = useSettingsStore();

  return (
    <div className="space-y-6">
      {/* Theme toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {theme === 'dark' ? (
            <Moon className="w-5 h-5 text-text-muted" />
          ) : (
            <Sun className="w-5 h-5 text-text-muted" />
          )}
          <div>
            <div className="text-sm font-medium text-text-primary">Theme</div>
            <div className="text-xs text-text-muted">
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </div>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className={`relative w-14 h-7 rounded-full transition-colors
            ${theme === 'dark' ? 'bg-accent' : 'bg-bg-tertiary'}`}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span
            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md
              transition-transform duration-200
              ${theme === 'dark' ? 'left-8' : 'left-1'}`}
          />
        </button>
      </div>

      {/* Display preferences */}
      <div className="space-y-4 pt-4 border-t border-glass-border">
        <h3 className="text-sm font-medium text-text-secondary">Display Options</h3>

        {/* Show cost estimates toggle */}
        <ToggleOption
          icon={<DollarSign className="w-5 h-5 text-text-muted" />}
          label="Show Cost Estimates"
          description="Display estimated costs for model responses"
          enabled={showCostEstimates}
          onToggle={() => setShowCostEstimates(!showCostEstimates)}
        />

        {/* Show token counts toggle */}
        <ToggleOption
          icon={<Hash className="w-5 h-5 text-text-muted" />}
          label="Show Token Counts"
          description="Display token counts for inputs and outputs"
          enabled={showTokenCounts}
          onToggle={() => setShowTokenCounts(!showTokenCounts)}
        />
      </div>
    </div>
  );
}

interface ToggleOptionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function ToggleOption({ icon, label, description, enabled, onToggle }: ToggleOptionProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-sm font-medium text-text-primary">{label}</div>
          <div className="text-xs text-text-muted">{description}</div>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-14 h-7 rounded-full transition-colors
          ${enabled ? 'bg-accent' : 'bg-bg-tertiary'}`}
        aria-label={`${enabled ? 'Disable' : 'Enable'} ${label}`}
      >
        <span
          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md
            transition-transform duration-200
            ${enabled ? 'left-8' : 'left-1'}`}
        />
      </button>
    </div>
  );
}
