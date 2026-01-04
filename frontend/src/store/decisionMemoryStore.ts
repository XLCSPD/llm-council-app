/**
 * Decision Memory Store
 *
 * Manages state for:
 * - Command Palette (⌘K/Ctrl+K)
 * - Session search and filtering
 * - Council templates
 * - Re-run actions
 */

import { create } from 'zustand';
import {
  quickSearch,
  searchSessions,
  getCouncilTemplates,
  getProjectTags,
  getSessionAnnotation,
  upsertSessionAnnotation,
  recordTemplateUsage,
} from '@/features/decision-memory/api';
import { sessionsApi } from '@/api';
import type {
  SearchResult,
  QuickSearchResult,
  SearchFilters,
  SearchFilterType,
  CouncilTemplate,
  Tag,
  SessionAnnotation,
  RerunAction,
} from '@/features/decision-memory/types';
import type { CouncilMember, PromptConfig, RoleType } from '@/types';

interface DecisionMemoryState {
  // Command Palette
  commandPaletteOpen: boolean;
  commandQuery: string;
  commandResults: QuickSearchResult[];
  commandLoading: boolean;
  activeFilter: SearchFilterType;

  // Full Search (sidebar)
  searchQuery: string;
  searchResults: SearchResult[];
  searchLoading: boolean;
  searchFilters: SearchFilters;

  // Tags
  projectTags: Tag[];
  tagsLoading: boolean;

  // Council Templates
  templates: CouncilTemplate[];
  templatesLoading: boolean;

  // Current annotation (for active session)
  currentAnnotation: SessionAnnotation | null;

  // Actions - Command Palette
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  setCommandQuery: (query: string) => void;
  setActiveFilter: (filter: SearchFilterType) => void;
  executeQuickSearch: (query: string) => Promise<void>;

  // Actions - Full Search
  setSearchQuery: (query: string) => void;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  executeSearch: () => Promise<void>;
  clearSearch: () => void;

  // Actions - Tags
  loadProjectTags: (projectId: string) => Promise<void>;

  // Actions - Templates
  loadTemplates: (projectId: string) => Promise<void>;
  useTemplate: (template: CouncilTemplate) => CouncilMember[];

  // Actions - Annotations
  loadAnnotation: (sessionId: string) => Promise<void>;
  saveAnnotation: (
    sessionId: string,
    data: { rating?: number | null; notes?: string | null }
  ) => Promise<void>;

  // Actions - Re-run
  prepareRerun: (
    action: RerunAction,
    sessionId: string
  ) => Promise<{
    prompt: PromptConfig | null;
    council: CouncilMember[] | null;
    templateId?: string;
  }>;

  // Reset
  reset: () => void;
}

const defaultFilters: SearchFilters = {
  type: 'all',
  tagIds: [],
  status: [],
  dateFrom: null,
  dateTo: null,
  ratingMin: null,
};

export const useDecisionMemoryStore = create<DecisionMemoryState>((set, get) => ({
  // Initial state
  commandPaletteOpen: false,
  commandQuery: '',
  commandResults: [],
  commandLoading: false,
  activeFilter: 'all',

  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  searchFilters: { ...defaultFilters },

  projectTags: [],
  tagsLoading: false,

  templates: [],
  templatesLoading: false,

  currentAnnotation: null,

  // Command Palette actions
  openCommandPalette: () => {
    set({ commandPaletteOpen: true, commandQuery: '', commandResults: [] });
    // Load recent sessions when opening
    get().executeQuickSearch('');
  },

  closeCommandPalette: () => {
    set({ commandPaletteOpen: false, commandQuery: '', commandResults: [] });
  },

  toggleCommandPalette: () => {
    const { commandPaletteOpen } = get();
    if (commandPaletteOpen) {
      get().closeCommandPalette();
    } else {
      get().openCommandPalette();
    }
  },

  setCommandQuery: (query) => {
    set({ commandQuery: query });
    get().executeQuickSearch(query);
  },

  setActiveFilter: (filter) => {
    set({ activeFilter: filter });
    // Re-run search with new filter
    get().executeQuickSearch(get().commandQuery);
  },

  executeQuickSearch: async (query) => {
    set({ commandLoading: true });
    try {
      const results = await quickSearch(query, 10);
      set({ commandResults: results, commandLoading: false });
    } catch (error) {
      console.error('Quick search failed:', error);
      set({ commandResults: [], commandLoading: false });
    }
  },

  // Full Search actions
  setSearchQuery: (query) => set({ searchQuery: query }),

  setSearchFilters: (filters) => {
    set((state) => ({
      searchFilters: { ...state.searchFilters, ...filters },
    }));
  },

  executeSearch: async () => {
    const { searchQuery, searchFilters } = get();
    set({ searchLoading: true });

    try {
      const results = await searchSessions({
        query: searchQuery,
        filters: searchFilters,
        limit: 50,
      });
      set({ searchResults: results, searchLoading: false });
    } catch (error) {
      console.error('Search failed:', error);
      set({ searchResults: [], searchLoading: false });
    }
  },

  clearSearch: () => {
    set({
      searchQuery: '',
      searchFilters: { ...defaultFilters },
      searchResults: [],
    });
  },

  // Tags actions
  loadProjectTags: async (projectId) => {
    set({ tagsLoading: true });
    try {
      const tags = await getProjectTags(projectId);
      set({ projectTags: tags, tagsLoading: false });
    } catch (error) {
      console.error('Failed to load tags:', error);
      set({ projectTags: [], tagsLoading: false });
    }
  },

  // Templates actions
  loadTemplates: async (projectId) => {
    set({ templatesLoading: true });
    try {
      const templates = await getCouncilTemplates(projectId);
      set({ templates, templatesLoading: false });
    } catch (error) {
      console.error('Failed to load templates:', error);
      set({ templates: [], templatesLoading: false });
    }
  },

  useTemplate: (template) => {
    // Record usage
    recordTemplateUsage(template.id).catch(console.error);

    // Convert template members to CouncilMember format
    return template.members.map((m) => ({
      id: crypto.randomUUID(),
      model_id: m.model_id,
      role: m.role,
      weight: m.weight,
      token_limit: m.token_limit,
      enabled: true,
      display_name: m.display_name,
    }));
  },

  // Annotations actions
  loadAnnotation: async (sessionId) => {
    try {
      const annotation = await getSessionAnnotation(sessionId);
      set({ currentAnnotation: annotation });
    } catch (error) {
      console.error('Failed to load annotation:', error);
      set({ currentAnnotation: null });
    }
  },

  saveAnnotation: async (sessionId, data) => {
    try {
      const annotation = await upsertSessionAnnotation(sessionId, data);
      set({ currentAnnotation: annotation });
    } catch (error) {
      console.error('Failed to save annotation:', error);
      throw error;
    }
  },

  // Re-run actions
  prepareRerun: async (action, sessionId) => {
    // Fetch full session data
    const sessionData = await sessionsApi.getFullSession(sessionId);

    switch (action) {
      case 'exact':
        // Return both prompt and council for exact re-run
        return {
          prompt: sessionData.prompt
            ? {
                content: sessionData.prompt.content,
                objective: sessionData.prompt.objective,
                constraints: sessionData.prompt.constraints,
                audience: sessionData.prompt.audience,
                context: sessionData.prompt.context,
                attachments: sessionData.prompt.attachments,
              }
            : null,
          council: sessionData.run?.council_config?.members
            ? convertToCouncilMembers(sessionData.run.council_config.members)
            : null,
        };

      case 'reuse-council':
        // Return only council configuration
        return {
          prompt: null,
          council: sessionData.run?.council_config?.members
            ? convertToCouncilMembers(sessionData.run.council_config.members)
            : null,
        };

      case 'reuse-prompt':
        // Return only prompt
        return {
          prompt: sessionData.prompt
            ? {
                content: sessionData.prompt.content,
                objective: sessionData.prompt.objective,
                constraints: sessionData.prompt.constraints,
                audience: sessionData.prompt.audience,
                context: sessionData.prompt.context,
                attachments: sessionData.prompt.attachments,
              }
            : null,
          council: null,
        };

      default:
        return { prompt: null, council: null };
    }
  },

  // Reset
  reset: () => {
    set({
      commandPaletteOpen: false,
      commandQuery: '',
      commandResults: [],
      commandLoading: false,
      activeFilter: 'all',
      searchQuery: '',
      searchResults: [],
      searchLoading: false,
      searchFilters: { ...defaultFilters },
      currentAnnotation: null,
    });
  },
}));

// =============================================================================
// HELPERS
// =============================================================================

function convertToCouncilMembers(
  members: Array<{
    model_key: string;
    display_name: string;
    role: string;
    weight: number;
  }>
): CouncilMember[] {
  return members.map((m) => ({
    id: crypto.randomUUID(),
    model_id: m.model_key,
    role: m.role as RoleType,
    weight: m.weight,
    token_limit: null,
    enabled: true,
    display_name: m.display_name,
  }));
}

// =============================================================================
// KEYBOARD SHORTCUT HOOK
// =============================================================================

/**
 * Hook to register ⌘K/Ctrl+K keyboard shortcut
 * Should be called once in App.tsx
 */
export function useCommandPaletteShortcut() {
  const { toggleCommandPalette } = useDecisionMemoryStore();

  // Register keyboard shortcut
  if (typeof window !== 'undefined') {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K on Mac, Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };

    // Note: This should be used with useEffect in the component
    return handleKeyDown;
  }

  return null;
}
