// Role types
export type RoleType = 'thinker' | 'critic' | 'devils_advocate' | 'synthesizer';

// Preset types
export type CouncilPreset = 'fast' | 'balanced' | 'deep_analysis' | 'executive';

// Phase types
export type PhaseType = 'setup' | 'reasoning' | 'review' | 'synthesis';
export type PhaseStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type SessionStatus = 'draft' | 'running' | 'completed' | 'failed';

// Council member
export interface CouncilMember {
  id: string;
  model_id: string;
  role: RoleType;
  weight: number;
  token_limit: number | null;
  enabled: boolean;
  display_name: string | null;
}

// Council
export interface Council {
  id: string;
  name: string;
  description: string | null;
  members: CouncilMember[];
  chairman_id: string | null;
  preset: CouncilPreset | null;
  created_at: string;
  is_template: boolean;
}

// Prompt attachment
export interface PromptAttachment {
  id: string;
  type: 'image' | 'pdf' | 'text';
  filename: string;
  storage_path: string;
  public_url: string;
  mime_type: string;
  size_bytes: number;
  /** For PDFs and text files: extracted/read text content */
  extracted_text?: string;
}

// Prompt configuration
export interface PromptConfig {
  content: string;
  objective: string | null;
  constraints: string[];
  audience: string | null;
  context: string | null;
  attachments: PromptAttachment[];
}

// Phase record
export interface PhaseRecord {
  phase: PhaseType;
  status: PhaseStatus;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
}

// Session
export interface Session {
  id: string;
  title: string | null;
  status: SessionStatus;
  current_phase: PhaseType;
  created_at: string;
  updated_at: string;
  prompt: PromptConfig;
  council: Council;
  phase_history: PhaseRecord[];
  metadata: Record<string, unknown>;
}

// Session summary for listing
export interface SessionSummary {
  id: string;
  title: string | null;
  status: SessionStatus;
  current_phase: PhaseType;
  created_at: string;
  council_name: string;
}

// Model tier categories
export type ModelTier = 'fast' | 'balanced' | 'deep' | 'executive' | 'code' | 'critic';

// Model info
export interface ModelInfo {
  id: string;
  provider: string;
  display_name: string;
  context_window: number;
  cost_per_1k_input: number;
  cost_per_1k_output: number;
  supports_streaming: boolean;
  recommended_roles: RoleType[];
  /** Whether this model supports vision/image inputs */
  supports_vision?: boolean;
  /** Model tier category for grouping/filtering */
  tier?: ModelTier;
}

// Model output
export interface ModelOutput {
  id: string;
  member_id: string;
  model_id: string;
  role: RoleType;
  content: string;
  token_count: number;
  latency_ms: number;
  created_at: string;
}

// Ranking
export interface Ranking {
  target_member_id: string;
  rank: number;
  score: number | null;
  reasoning: string | null;
}

// Vote
export interface Vote {
  id: string;
  voter_member_id: string;
  rankings: Ranking[];
  critique: string | null;
}

// Synthesis output
export interface SynthesisOutput extends ModelOutput {
  confidence_level: number;
  key_agreements: string[];
  key_disagreements: string[];
  reasoning_summary: string;
  minority_opinions: string[];
}

// Analytics
export interface Analytics {
  rankings_matrix: number[][];
  aggregate_rankings: Array<{
    member_id: string;
    model_id: string;
    average_rank: number;
    vote_count: number;
    consensus_score: number;
  }>;
  agreement_score: number;
  consensus_breakdown: Record<string, number>;
}

// Full session data for replay mode
export interface FullSessionData {
  session: {
    id: string;
    title: string | null;
    project_id: string;
    created_by: string;
    created_at: string;
  };
  prompt: (PromptConfig & { id: string }) | null;
  run: {
    id: string;
    status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
    current_phase: number;
    phase_status: Record<string, { started_at?: string; completed_at?: string }>;
    council_config: {
      members: Array<{
        model_key: string;
        display_name: string;
        role: string;
        weight: number;
      }>;
    };
    started_at: string | null;
    ended_at: string | null;
    cost_usd: number | null;
  } | null;
  runModels: Array<{
    id: string;
    model_key: string;
    display_name: string;
    role: string;
    status: string;
    latency_ms: number | null;
    cost_usd: number | null;
    outputs: Array<{
      id: string;
      phase: number;
      content: string;
      metadata: Record<string, unknown>;
      created_at: string;
    }>;
  }>;
  peerReviews: Array<{
    id: string;
    reviewer_run_model_id: string;
    reviewed_run_model_id: string;
    score: number;
    rationale: string | null;
    created_at: string;
  }>;
}
