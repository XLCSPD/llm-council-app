import { apiClient } from './client';
import { supabase } from '@/lib/supabase';
import type { Session, SessionSummary, PromptConfig, FullSessionData } from '@/types';

// Database types for Supabase queries
interface DbSession {
  id: string;
  title: string | null;
  project_id: string;
  created_by: string;
  created_at: string;
}

interface DbPrompt {
  id: string;
  content: string;
  objective: string | null;
  constraints: string[] | null;
  audience: string | null;
  context: string | null;
  attachments: Array<{
    id: string;
    type: 'image' | 'pdf';
    filename: string;
    storage_path: string;
    public_url: string;
    mime_type: string;
    size_bytes: number;
    extracted_text?: string;
  }> | null;
}

interface DbRun {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
  current_phase: number;
  phase_status: Record<string, { started_at?: string; completed_at?: string }> | null;
  council_config: FullSessionData['run'] extends null ? never : NonNullable<FullSessionData['run']>['council_config'];
  started_at: string | null;
  ended_at: string | null;
  cost_usd: number | null;
  run_models?: DbRunModel[];
}

interface DbRunModel {
  id: string;
  model_key: string;
  display_name: string;
  role: string;
  status: string;
  latency_ms: number | null;
  cost_usd: number | null;
  model_outputs?: DbModelOutput[];
}

interface DbModelOutput {
  id: string;
  phase: number;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface DbPeerReview {
  id: string;
  reviewer_run_model_id: string;
  reviewed_run_model_id: string;
  score: number;
  rationale: string | null;
  created_at: string;
}

export interface CreateSessionRequest {
  prompt: PromptConfig;
  council_id?: string;
  council?: {
    name: string;
    description?: string;
    members: Array<{
      model_id: string;
      role: string;
      weight: number;
      token_limit?: number;
    }>;
    chairman_model_id?: string;
    preset?: string;
  };
}

export const sessionsApi = {
  // List all sessions
  list: async (status?: string, limit = 50, offset = 0): Promise<SessionSummary[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await apiClient.get<SessionSummary[]>(`/sessions?${params}`);
    return response.data;
  },

  // Get a single session
  get: async (id: string): Promise<Session> => {
    const response = await apiClient.get<Session>(`/sessions/${id}`);
    return response.data;
  },

  // Create a new session
  create: async (request: CreateSessionRequest): Promise<Session> => {
    const response = await apiClient.post<Session>('/sessions', request);
    return response.data;
  },

  // Delete a session
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/sessions/${id}`);
  },

  // Get full session data for replay mode (fetches directly from Supabase)
  getFullSession: async (sessionId: string): Promise<FullSessionData> => {
    // Fetch session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw new Error(`Failed to load session: ${sessionError.message}`);
    const session = sessionData as unknown as DbSession;

    // Fetch prompt for this session
    const { data: promptsData, error: promptError } = await supabase
      .from('prompts')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (promptError) throw new Error(`Failed to load prompt: ${promptError.message}`);
    const prompts = promptsData as unknown as DbPrompt[] | null;
    const promptData = prompts?.[0] || null;

    // Fetch most recent run with all related data
    const { data: runsData, error: runError } = await supabase
      .from('runs')
      .select(`
        *,
        run_models (
          *,
          model_outputs (*)
        )
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (runError) throw new Error(`Failed to load run: ${runError.message}`);
    const runs = runsData as unknown as DbRun[] | null;
    const run = runs?.[0] || null;

    // Fetch peer reviews separately if run exists
    let peerReviews: FullSessionData['peerReviews'] = [];
    if (run) {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('peer_reviews')
        .select('*')
        .eq('run_id', run.id);

      if (!reviewsError && reviewsData) {
        peerReviews = (reviewsData as unknown as DbPeerReview[]).map(r => ({
          id: r.id,
          reviewer_run_model_id: r.reviewer_run_model_id,
          reviewed_run_model_id: r.reviewed_run_model_id,
          score: r.score,
          rationale: r.rationale,
          created_at: r.created_at,
        }));
      }
    }

    return {
      session: {
        id: session.id,
        title: session.title,
        project_id: session.project_id,
        created_by: session.created_by,
        created_at: session.created_at,
      },
      prompt: promptData ? {
        id: promptData.id,
        content: promptData.content,
        objective: promptData.objective,
        constraints: promptData.constraints || [],
        audience: promptData.audience,
        context: promptData.context,
        attachments: promptData.attachments || [],
      } : null,
      run: run ? {
        id: run.id,
        status: run.status,
        current_phase: run.current_phase,
        phase_status: run.phase_status || {},
        council_config: run.council_config,
        started_at: run.started_at,
        ended_at: run.ended_at,
        cost_usd: run.cost_usd,
      } : null,
      runModels: run?.run_models?.map((rm: DbRunModel) => ({
        id: rm.id,
        model_key: rm.model_key,
        display_name: rm.display_name,
        role: rm.role,
        status: rm.status,
        latency_ms: rm.latency_ms,
        cost_usd: rm.cost_usd,
        outputs: (rm.model_outputs || []).map((o: DbModelOutput) => ({
          id: o.id,
          phase: o.phase,
          content: o.content,
          metadata: o.metadata || {},
          created_at: o.created_at,
        })),
      })) || [],
      peerReviews,
    };
  },
};
