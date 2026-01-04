/**
 * Decision Memory Types
 * Types for session annotations, tags, search, and council templates
 */

import type { RoleType, FullSessionData } from '@/types';

// =============================================================================
// SESSION ANNOTATIONS
// =============================================================================

export interface SessionAnnotation {
  id: string;
  session_id: string;
  rating: number | null; // 1-5 stars
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionAnnotationInput {
  rating?: number | null;
  notes?: string | null;
}

// =============================================================================
// TAGS
// =============================================================================

export interface Tag {
  id: string;
  project_id: string;
  name: string;
  color: string;
  created_by: string;
  created_at: string;
}

export interface TagInput {
  name: string;
  color?: string;
}

export interface SessionTag {
  session_id: string;
  tag_id: string;
  created_at: string;
}

// =============================================================================
// COUNCIL TEMPLATES
// =============================================================================

export interface CouncilTemplate {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  members: CouncilTemplateMember[];
  chairman_id: string | null;
  preset: string | null;
  icon: string | null;
  is_favorite: boolean;
  is_template: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
}

export interface CouncilTemplateMember {
  model_id: string;
  role: RoleType;
  weight: number;
  token_limit: number | null;
  display_name: string | null;
}

export interface CouncilTemplateInput {
  name: string;
  description?: string;
  members: CouncilTemplateMember[];
  chairman_id?: string;
  preset?: string;
  icon?: string;
  is_favorite?: boolean;
}

// =============================================================================
// SEARCH
// =============================================================================

export type SearchFilterType = 'all' | 'prompts' | 'councils' | 'tags';

export interface SearchFilters {
  type: SearchFilterType;
  tagIds: string[];
  status: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
  ratingMin: number | null;
}

export interface SearchResult {
  session_id: string;
  title: string | null;
  prompt_content: string | null;
  prompt_objective: string | null;
  council_config: {
    members: Array<{
      model_key: string;
      display_name: string;
      role: string;
      weight: number;
    }>;
  } | null;
  run_status: string | null;
  run_phase: number | null;
  cost_usd: number | null;
  created_at: string;
  rating: number | null;
  notes: string | null;
  tags: TagSummary[];
  rank: number;
}

export interface TagSummary {
  id: string;
  name: string;
  color: string;
}

export interface QuickSearchResult {
  session_id: string;
  title: string | null;
  prompt_preview: string | null;
  council_members: Array<{
    model_key: string;
    display_name: string;
    role: string;
  }> | null;
  run_status: string | null;
  created_at: string;
  rating: number | null;
}

// =============================================================================
// DECISION CARD
// =============================================================================

export type ConsensusTier = 'high' | 'medium' | 'low' | 'unknown';
export type CostTier = 'low' | 'medium' | 'high';
export type DepthLevel = 1 | 2 | 3 | 4; // Phases completed

export interface DecisionCardData {
  sessionId: string;
  title: string | null;
  promptPreview: string;
  councilMembers: CouncilFingerprint[];
  runStatus: string;
  phaseDepth: DepthLevel;
  consensusTier: ConsensusTier;
  costTier: CostTier;
  createdAt: string;
  rating: number | null;
  tags: TagSummary[];
}

export interface CouncilFingerprint {
  modelKey: string;
  displayName: string;
  role: RoleType;
}

// =============================================================================
// RE-RUN ACTIONS
// =============================================================================

export type RerunAction = 'exact' | 'reuse-council' | 'reuse-prompt';

export interface RerunPayload {
  action: RerunAction;
  sessionId: string;
  sessionData?: FullSessionData;
}

// =============================================================================
// SMART HISTORY
// =============================================================================

export type TimeGroup = 'pinned' | 'today' | 'yesterday' | 'this_week' | string; // string for 'Nov_2024' etc.

export type ViewMode = 'list' | 'cards' | 'timeline';

export type HistoryFilter = 'rated' | 'tagged' | 'completed' | 'running';

export interface SmartHistorySession {
  id: string;
  title: string | null;
  status: string;
  current_phase: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  pin_order: number | null;
  is_archived: boolean;
  last_accessed_at: string;
  rating: number | null;
  has_tags: boolean;
  council_name: string | null;
  time_group: TimeGroup;
}

export interface GroupedSessions {
  pinned: SmartHistorySession[];
  today: SmartHistorySession[];
  yesterday: SmartHistorySession[];
  thisWeek: SmartHistorySession[];
  earlier: Map<string, SmartHistorySession[]>; // 'Nov 2024' -> sessions
}

export interface SmartHistoryState {
  // View state
  viewMode: ViewMode;
  activeFilters: Set<HistoryFilter>;
  expandedGroups: Set<string>;
  showArchived: boolean;

  // Data
  sessions: SmartHistorySession[];
  groupedSessions: GroupedSessions;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSessions: (projectId: string) => Promise<void>;
  pinSession: (sessionId: string) => Promise<void>;
  unpinSession: (sessionId: string) => Promise<void>;
  reorderPinned: (sessionIds: string[]) => Promise<void>;
  archiveSession: (sessionId: string) => Promise<void>;
  restoreSession: (sessionId: string) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  toggleFilter: (filter: HistoryFilter) => void;
  toggleGroup: (groupId: string) => void;
  toggleArchived: () => void;
}
