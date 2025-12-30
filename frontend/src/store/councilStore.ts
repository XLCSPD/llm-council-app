import { create } from 'zustand';
import type { CouncilMember, CouncilPreset, ModelInfo, RoleType } from '@/types';

interface CouncilState {
  // Selected models for the council
  selectedModels: CouncilMember[];
  preset: CouncilPreset | null;
  availableModels: ModelInfo[];
  isLoading: boolean;

  // Actions
  addModel: (model: ModelInfo, role?: RoleType) => void;
  removeModel: (memberId: string) => void;
  updateModelConfig: (memberId: string, config: Partial<CouncilMember>) => void;
  setPreset: (preset: CouncilPreset | null) => void;
  setSelectedModels: (models: CouncilMember[]) => void;
  setAvailableModels: (models: ModelInfo[]) => void;
  setLoading: (loading: boolean) => void;
  resetCouncil: () => void;

  // Computed
  getChairman: () => CouncilMember | undefined;
  getTotalEstimatedCost: (inputTokens: number, outputTokens: number) => number;
  isValidCouncil: () => boolean;
}

export const useCouncilStore = create<CouncilState>((set, get) => ({
  selectedModels: [],
  preset: null,
  availableModels: [],
  isLoading: false,

  addModel: (model: ModelInfo, role: RoleType = 'thinker') => {
    const newMember: CouncilMember = {
      id: crypto.randomUUID(),
      model_id: model.id,
      role,
      weight: 1.0,
      token_limit: null,
      enabled: true,
      display_name: model.display_name,
    };
    set((state) => ({
      selectedModels: [...state.selectedModels, newMember],
    }));
  },

  removeModel: (memberId: string) => {
    set((state) => ({
      selectedModels: state.selectedModels.filter((m) => m.id !== memberId),
    }));
  },

  updateModelConfig: (memberId: string, config: Partial<CouncilMember>) => {
    set((state) => ({
      selectedModels: state.selectedModels.map((m) =>
        m.id === memberId ? { ...m, ...config } : m
      ),
    }));
  },

  setPreset: (preset: CouncilPreset | null) => set({ preset }),

  setSelectedModels: (models: CouncilMember[]) => set({ selectedModels: models }),

  setAvailableModels: (models: ModelInfo[]) => set({ availableModels: models }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  resetCouncil: () => set({ selectedModels: [], preset: null }),

  getChairman: () => {
    const { selectedModels } = get();
    // Find a synthesizer, or the last model
    return (
      selectedModels.find((m) => m.role === 'synthesizer') ||
      selectedModels[selectedModels.length - 1]
    );
  },

  getTotalEstimatedCost: (inputTokens: number, outputTokens: number) => {
    const { selectedModels, availableModels } = get();
    let total = 0;

    for (const member of selectedModels) {
      const modelInfo = availableModels.find((m) => m.id === member.model_id);
      if (modelInfo) {
        total += (inputTokens / 1000) * modelInfo.cost_per_1k_input;
        total += (outputTokens / 1000) * modelInfo.cost_per_1k_output;
      }
    }

    return total;
  },

  isValidCouncil: () => {
    const { selectedModels } = get();
    return selectedModels.length >= 2 && selectedModels.some((m) => m.enabled);
  },
}));
