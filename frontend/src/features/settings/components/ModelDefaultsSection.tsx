import { Thermometer, Hash } from 'lucide-react';
import { useSettingsStore } from '@/store';

export function ModelDefaultsSection() {
  const {
    defaultTemperature,
    defaultMaxTokens,
    setDefaultTemperature,
    setDefaultMaxTokens,
  } = useSettingsStore();

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium text-text-secondary">Model Defaults</h3>

      {/* Temperature slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <Thermometer className="w-4 h-4 text-text-muted" />
            Default Temperature
          </label>
          <span className="text-sm font-mono text-accent">
            {defaultTemperature.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={defaultTemperature}
          onChange={(e) => setDefaultTemperature(parseFloat(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer
                   bg-bg-tertiary accent-accent
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-accent
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:shadow-md"
        />
        <div className="flex justify-between text-xs text-text-muted">
          <span>Deterministic (0.0)</span>
          <span>Creative (2.0)</span>
        </div>
      </div>

      {/* Max tokens input */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <Hash className="w-4 h-4 text-text-muted" />
          Default Max Tokens
        </label>
        <input
          type="number"
          min="1"
          max="128000"
          value={defaultMaxTokens}
          onChange={(e) => setDefaultMaxTokens(parseInt(e.target.value) || 4096)}
          className="w-full px-4 py-3 rounded-xl glass-subtle
                   text-text-primary placeholder-text-muted
                   border border-glass-border focus:border-accent
                   focus:outline-none focus:ring-1 focus:ring-accent/50
                   transition-colors font-mono"
        />
        <p className="text-xs text-text-muted">
          Maximum number of tokens for model responses (1 - 128,000)
        </p>
      </div>
    </div>
  );
}
