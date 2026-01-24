import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // API Settings (stored in localStorage only - never sync to backend)
  openRouterApiKey: string | null;

  // Model Defaults
  defaultTemperature: number;
  defaultMaxTokens: number;

  // Display Preferences
  showCostEstimates: boolean;
  showTokenCounts: boolean;

  // Council Settings
  /** Whether to auto-balance councils by adding critic when missing (default: true) */
  autoBalanceCouncils: boolean;

  // Actions
  setOpenRouterApiKey: (key: string | null) => void;
  setDefaultTemperature: (temp: number) => void;
  setDefaultMaxTokens: (tokens: number) => void;
  setShowCostEstimates: (show: boolean) => void;
  setShowTokenCounts: (show: boolean) => void;
  setAutoBalanceCouncils: (enabled: boolean) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS = {
  openRouterApiKey: null,
  defaultTemperature: 0.7,
  defaultMaxTokens: 4096,
  showCostEstimates: true,
  showTokenCounts: true,
  autoBalanceCouncils: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setOpenRouterApiKey: (key: string | null) => set({ openRouterApiKey: key }),

      setDefaultTemperature: (temp: number) => {
        // Clamp between 0 and 2
        const clampedTemp = Math.max(0, Math.min(2, temp));
        set({ defaultTemperature: clampedTemp });
      },

      setDefaultMaxTokens: (tokens: number) => {
        // Minimum of 1, maximum of 128000
        const clampedTokens = Math.max(1, Math.min(128000, tokens));
        set({ defaultMaxTokens: clampedTokens });
      },

      setShowCostEstimates: (show: boolean) => set({ showCostEstimates: show }),

      setShowTokenCounts: (show: boolean) => set({ showTokenCounts: show }),

      setAutoBalanceCouncils: (enabled: boolean) => set({ autoBalanceCouncils: enabled }),

      resetToDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'settings-store',
      // Store everything in localStorage
      partialize: (state) => ({
        openRouterApiKey: state.openRouterApiKey,
        defaultTemperature: state.defaultTemperature,
        defaultMaxTokens: state.defaultMaxTokens,
        showCostEstimates: state.showCostEstimates,
        showTokenCounts: state.showTokenCounts,
        autoBalanceCouncils: state.autoBalanceCouncils,
      }),
    }
  )
);
