import { apiClient } from './client';
import type { Council, CouncilPreset, RoleType } from '@/types';

export interface CreateCouncilRequest {
  name: string;
  description?: string;
  members: Array<{
    model_id: string;
    role: RoleType;
    weight?: number;
    token_limit?: number;
  }>;
  chairman_model_id?: string;
  preset?: CouncilPreset;
}

export interface CouncilSummary {
  id: string;
  name: string;
  member_count: number;
  preset: CouncilPreset | null;
}

export const councilsApi = {
  // List all councils
  list: async (templatesOnly = false): Promise<CouncilSummary[]> => {
    const params = templatesOnly ? '?templates_only=true' : '';
    const response = await apiClient.get<CouncilSummary[]>(`/councils${params}`);
    return response.data;
  },

  // Get a single council
  get: async (id: string): Promise<Council> => {
    const response = await apiClient.get<Council>(`/councils/${id}`);
    return response.data;
  },

  // Create a new council
  create: async (request: CreateCouncilRequest): Promise<Council> => {
    const response = await apiClient.post<Council>('/councils', request);
    return response.data;
  },

  // Delete a council
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/councils/${id}`);
  },

  // Get presets
  getPresets: async (): Promise<Council[]> => {
    const response = await apiClient.get<Council[]>('/councils/presets');
    return response.data;
  },

  // Add member
  addMember: async (
    councilId: string,
    member: { model_id: string; role: RoleType; weight?: number; token_limit?: number }
  ): Promise<Council> => {
    const response = await apiClient.post<Council>(`/councils/${councilId}/members`, member);
    return response.data;
  },

  // Update member
  updateMember: async (
    councilId: string,
    memberId: string,
    updates: Partial<{ role: RoleType; weight: number; token_limit: number; enabled: boolean }>
  ): Promise<Council> => {
    const response = await apiClient.put<Council>(
      `/councils/${councilId}/members/${memberId}`,
      updates
    );
    return response.data;
  },

  // Remove member
  removeMember: async (councilId: string, memberId: string): Promise<Council> => {
    const response = await apiClient.delete<Council>(
      `/councils/${councilId}/members/${memberId}`
    );
    return response.data;
  },

  // Set chairman
  setChairman: async (councilId: string, memberId: string): Promise<Council> => {
    const response = await apiClient.put<Council>(
      `/councils/${councilId}/chairman/${memberId}`
    );
    return response.data;
  },

  // Save as template
  saveAsTemplate: async (councilId: string, name: string): Promise<Council> => {
    const response = await apiClient.post<Council>(
      `/councils/${councilId}/save-as-template?name=${encodeURIComponent(name)}`
    );
    return response.data;
  },
};
