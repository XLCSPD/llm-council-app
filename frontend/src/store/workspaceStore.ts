import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface WorkspaceState {
  orgId: string | null;
  projectId: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  fetchWorkspace: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  orgId: null,
  projectId: null,
  isLoading: false,
  isInitialized: false,

  fetchWorkspace: async (userId: string) => {
    const { isInitialized, isLoading } = get();
    if (isInitialized || isLoading) return;

    set({ isLoading: true });

    try {
      const { data: workspace, error } = await supabase.rpc('setup_user_workspace', {
        user_uuid: userId,
      } as unknown as undefined) as {
        data: Array<{ out_org_id: string; out_project_id: string }> | null;
        error: { message: string } | null;
      };

      if (error) {
        console.error('Failed to setup workspace:', error);
        set({ isLoading: false });
        return;
      }

      const result = workspace?.[0];
      if (result) {
        set({
          orgId: result.out_org_id,
          projectId: result.out_project_id,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error('Workspace fetch failed:', err);
      set({ isLoading: false });
    }
  },

  reset: () => set({
    orgId: null,
    projectId: null,
    isLoading: false,
    isInitialized: false,
  }),
}));
