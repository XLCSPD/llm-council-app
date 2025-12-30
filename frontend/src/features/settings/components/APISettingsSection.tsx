import { useState } from 'react';
import { Eye, EyeOff, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { useSettingsStore } from '@/store';

export function APISettingsSection() {
  const { openRouterApiKey, setOpenRouterApiKey } = useSettingsStore();
  const [showKey, setShowKey] = useState(false);
  const [inputValue, setInputValue] = useState(openRouterApiKey || '');

  const handleSave = () => {
    setOpenRouterApiKey(inputValue.trim() || null);
  };

  const handleClear = () => {
    setInputValue('');
    setOpenRouterApiKey(null);
  };

  const hasKey = !!openRouterApiKey;
  const hasChanges = inputValue !== (openRouterApiKey || '');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          OpenRouter API Key
        </label>
        <p className="text-xs text-text-muted mb-3">
          Your API key is stored locally in your browser and never sent to our servers.
        </p>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Key className="w-4 h-4 text-text-muted" />
          </div>
          <input
            type={showKey ? 'text' : 'password'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="sk-or-v1-..."
            className="w-full pl-10 pr-12 py-3 rounded-xl glass-subtle
                     text-text-primary placeholder-text-muted
                     border border-glass-border focus:border-accent
                     focus:outline-none focus:ring-1 focus:ring-accent/50
                     transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1
                     text-text-muted hover:text-text-secondary transition-colors"
            aria-label={showKey ? 'Hide API key' : 'Show API key'}
          >
            {showKey ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-sm">
        {hasKey ? (
          <>
            <CheckCircle className="w-4 h-4 text-accent-success" />
            <span className="text-accent-success">API key configured</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4 text-text-muted" />
            <span className="text-text-muted">No API key configured</span>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
            ${hasChanges
              ? 'bg-gradient-accent text-white hover:shadow-glow-cyan'
              : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
            }`}
        >
          Save Key
        </button>
        {hasKey && (
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-xl text-sm font-medium
                     text-accent-error hover:bg-accent-error/10 transition-colors"
          >
            Clear Key
          </button>
        )}
      </div>
    </div>
  );
}
