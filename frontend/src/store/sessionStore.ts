import { create } from 'zustand';
import { sessionsApi } from '@/api';
import { touchSession } from '@/features/decision-memory/api/smartHistory';
import type {
  Analytics,
  FullSessionData,
  ModelOutput,
  PhaseType,
  PromptConfig,
  Session,
  SessionSummary,
  SynthesisOutput,
  Vote,
} from '@/types';

interface SessionState {
  // Current session
  currentSession: Session | null;
  currentPhase: PhaseType;
  currentRunId: string | null;

  // Prompt data
  prompt: PromptConfig;

  // Phase-specific data
  reasoningResponses: Map<string, ModelOutput>;
  peerReviewVotes: Vote[];
  synthesisResult: SynthesisOutput | null;
  analytics: Analytics | null;

  // Session history
  sessions: SessionSummary[];
  isLoading: boolean;

  // Replay mode
  isReplayMode: boolean;
  replayData: FullSessionData | null;

  // Actions
  setCurrentSession: (session: Session | null) => void;
  setCurrentPhase: (phase: PhaseType) => void;
  setCurrentRunId: (runId: string | null) => void;
  updatePrompt: (data: Partial<PromptConfig>) => void;
  resetPrompt: () => void;

  // Phase data actions
  addReasoningResponse: (memberId: string, response: ModelOutput) => void;
  updateReasoningResponse: (memberId: string, content: string) => void;
  clearReasoningResponses: () => void;
  setPeerReviewVotes: (votes: Vote[]) => void;
  setSynthesisResult: (result: SynthesisOutput | null) => void;
  setAnalytics: (analytics: Analytics | null) => void;

  // Session management
  setSessions: (sessions: SessionSummary[]) => void;
  addSession: (session: SessionSummary) => void;
  removeSession: (id: string) => void;
  setLoading: (loading: boolean) => void;

  // Replay mode actions
  setReplayMode: (enabled: boolean) => void;
  setReplayData: (data: FullSessionData | null) => void;
  loadSessionForReplay: (sessionId: string) => Promise<void>;

  // Reset
  resetSession: () => void;
}

const defaultPrompt: PromptConfig = {
  content: '',
  objective: null,
  constraints: [],
  audience: null,
  context: null,
  attachments: [],
};

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  currentPhase: 'setup',
  currentRunId: null,
  prompt: { ...defaultPrompt },
  reasoningResponses: new Map(),
  peerReviewVotes: [],
  synthesisResult: null,
  analytics: null,
  sessions: [],
  isLoading: false,
  isReplayMode: false,
  replayData: null,

  setCurrentSession: (session) => {
    set({
      currentSession: session,
      currentPhase: session?.current_phase ?? 'setup',
      prompt: session?.prompt ?? { ...defaultPrompt },
    });
  },

  setCurrentPhase: (phase) => {
    console.log('[Store] setCurrentPhase called with:', phase);
    set({ currentPhase: phase });
  },

  setCurrentRunId: (runId) => set({ currentRunId: runId }),

  updatePrompt: (data) => {
    set((state) => ({
      prompt: { ...state.prompt, ...data },
    }));
  },

  resetPrompt: () => set({ prompt: { ...defaultPrompt } }),

  addReasoningResponse: (memberId, response) => {
    set((state) => {
      const newMap = new Map(state.reasoningResponses);
      newMap.set(memberId, response);
      return { reasoningResponses: newMap };
    });
  },

  updateReasoningResponse: (memberId, content) => {
    set((state) => {
      const existing = state.reasoningResponses.get(memberId);
      if (existing) {
        const newMap = new Map(state.reasoningResponses);
        newMap.set(memberId, { ...existing, content });
        return { reasoningResponses: newMap };
      }
      return state;
    });
  },

  clearReasoningResponses: () => set({ reasoningResponses: new Map() }),

  setPeerReviewVotes: (votes) => set({ peerReviewVotes: votes }),

  setSynthesisResult: (result) => set({ synthesisResult: result }),

  setAnalytics: (analytics) => set({ analytics }),

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) => {
    set((state) => ({
      sessions: [session, ...state.sessions],
    }));
  },

  removeSession: (id) => {
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
    }));
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setReplayMode: (enabled) => set({ isReplayMode: enabled }),

  setReplayData: (data) => set({
    replayData: data,
    // When setting replay data, also update prompt from the data
    prompt: data?.prompt ?? { ...defaultPrompt },
  }),

  loadSessionForReplay: async (sessionId) => {
    try {
      set({ isLoading: true });
      const data = await sessionsApi.getFullSession(sessionId);

      // Update last_accessed_at to prevent auto-archiving (fire-and-forget)
      touchSession(sessionId).catch(() => {});

      // Map database phase (1-4) to UI phase
      const phaseMap: Record<number, PhaseType> = {
        1: 'setup',
        2: 'reasoning',
        3: 'review',
        4: 'synthesis',
      };

      // Determine which phase to show
      let targetPhase: PhaseType = 'setup';
      if (data.run?.status === 'succeeded') {
        targetPhase = 'synthesis';
      } else if (data.run?.current_phase) {
        targetPhase = phaseMap[data.run.current_phase] || 'setup';
      }

      set({
        isReplayMode: true,
        replayData: data,
        currentRunId: data.run?.id ?? null,
        prompt: data.prompt ?? { ...defaultPrompt },
        currentPhase: targetPhase,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load session for replay:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  resetSession: () =>
    set({
      currentSession: null,
      currentPhase: 'setup',
      currentRunId: null,
      prompt: { ...defaultPrompt },
      reasoningResponses: new Map(),
      peerReviewVotes: [],
      synthesisResult: null,
      analytics: null,
      isReplayMode: false,
      replayData: null,
    }),
}));
