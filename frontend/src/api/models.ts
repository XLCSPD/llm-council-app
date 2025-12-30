import { apiClient } from './client';
import type { ModelInfo, RoleType } from '@/types';

export interface CostEstimate {
  total_estimated_cost: number;
  breakdown: Array<{
    model_id: string;
    input_cost: number;
    output_cost: number;
    total: number;
  }>;
  input_tokens: number;
  output_tokens: number;
}

export const modelsApi = {
  // List all available models
  list: async (): Promise<ModelInfo[]> => {
    const response = await apiClient.get<ModelInfo[]>('/models');
    return response.data;
  },

  // Get a specific model
  get: async (modelId: string): Promise<ModelInfo> => {
    const response = await apiClient.get<ModelInfo>(`/models/${encodeURIComponent(modelId)}`);
    return response.data;
  },

  // Get models by role
  getByRole: async (role: RoleType): Promise<ModelInfo[]> => {
    const response = await apiClient.get<ModelInfo[]>(`/models/by-role/${role}`);
    return response.data;
  },

  // Estimate cost
  estimateCost: async (
    modelIds: string[],
    inputTokens = 1000,
    outputTokens = 2000
  ): Promise<CostEstimate> => {
    const response = await apiClient.post<CostEstimate>('/models/estimate-cost', {
      model_ids: modelIds,
      estimated_input_tokens: inputTokens,
      estimated_output_tokens: outputTokens,
    });
    return response.data;
  },
};
