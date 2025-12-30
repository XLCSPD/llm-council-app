import { useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout';
import { AuthGuard, ResetPasswordPage } from '@/components/auth';
import { useSessionStore, useCouncilStore, useAuthStore, useUIStore } from '@/store';
import { modelsApi } from '@/api';
import { supabase } from '@/lib/supabase';
import { SetupPhase } from '@/features/council-builder/components/SetupPhase';
import { ReasoningPhase } from '@/features/reasoning';
import { ReviewPhase } from '@/features/review';
import { SynthesisPhase } from '@/features/synthesis';
import { SettingsPage } from '@/features/settings';
import type { SessionSummary, ModelInfo } from '@/types';

// Fallback models when backend API is unavailable - Updated Dec 2025
const FALLBACK_MODELS: ModelInfo[] = [
  // OpenAI
  { id: 'openai/gpt-5.2', provider: 'openai', display_name: 'GPT-5.2', context_window: 400000, cost_per_1k_input: 0.00175, cost_per_1k_output: 0.014, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'] },
  { id: 'openai/gpt-5', provider: 'openai', display_name: 'GPT-5', context_window: 400000, cost_per_1k_input: 0.00125, cost_per_1k_output: 0.010, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'] },
  { id: 'openai/gpt-5.1', provider: 'openai', display_name: 'GPT-5.1', context_window: 400000, cost_per_1k_input: 0.00125, cost_per_1k_output: 0.010, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'] },
  { id: 'openai/gpt-5-mini', provider: 'openai', display_name: 'GPT-5 Mini', context_window: 400000, cost_per_1k_input: 0.00025, cost_per_1k_output: 0.002, supports_streaming: true, recommended_roles: ['thinker', 'synthesizer'] },
  { id: 'openai/gpt-5-nano', provider: 'openai', display_name: 'GPT-5 Nano', context_window: 400000, cost_per_1k_input: 0.00005, cost_per_1k_output: 0.0004, supports_streaming: true, recommended_roles: ['thinker', 'devils_advocate'] },
  { id: 'openai/gpt-4o-mini', provider: 'openai', display_name: 'GPT-4o Mini', context_window: 128000, cost_per_1k_input: 0.00015, cost_per_1k_output: 0.0006, supports_streaming: true, recommended_roles: ['thinker', 'critic'] },
  { id: 'openai/gpt-4.1', provider: 'openai', display_name: 'GPT-4.1', context_window: 1047576, cost_per_1k_input: 0.002, cost_per_1k_output: 0.008, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'] },
  { id: 'openai/gpt-4.1-mini', provider: 'openai', display_name: 'GPT-4.1 Mini', context_window: 1047576, cost_per_1k_input: 0.0004, cost_per_1k_output: 0.0016, supports_streaming: true, recommended_roles: ['thinker', 'critic'] },
  { id: 'openai/gpt-4.1-nano', provider: 'openai', display_name: 'GPT-4.1 Nano', context_window: 1047576, cost_per_1k_input: 0.0001, cost_per_1k_output: 0.0004, supports_streaming: true, recommended_roles: ['thinker', 'critic'] },
  // Anthropic
  { id: 'anthropic/claude-opus-4.5', provider: 'anthropic', display_name: 'Claude Opus 4.5', context_window: 200000, cost_per_1k_input: 0.005, cost_per_1k_output: 0.025, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'] },
  { id: 'anthropic/claude-sonnet-4.5', provider: 'anthropic', display_name: 'Claude Sonnet 4.5', context_window: 1000000, cost_per_1k_input: 0.003, cost_per_1k_output: 0.015, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'] },
  { id: 'anthropic/claude-sonnet-4', provider: 'anthropic', display_name: 'Claude Sonnet 4', context_window: 1000000, cost_per_1k_input: 0.003, cost_per_1k_output: 0.015, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'] },
  { id: 'anthropic/claude-haiku-4.5', provider: 'anthropic', display_name: 'Claude Haiku 4.5', context_window: 200000, cost_per_1k_input: 0.001, cost_per_1k_output: 0.005, supports_streaming: true, recommended_roles: ['thinker', 'critic'] },
  { id: 'anthropic/claude-3.7-sonnet', provider: 'anthropic', display_name: 'Claude 3.7 Sonnet', context_window: 200000, cost_per_1k_input: 0.003, cost_per_1k_output: 0.015, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'] },
  { id: 'anthropic/claude-3.5-sonnet', provider: 'anthropic', display_name: 'Claude 3.5 Sonnet', context_window: 200000, cost_per_1k_input: 0.006, cost_per_1k_output: 0.030, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'] },
  { id: 'anthropic/claude-3.5-haiku', provider: 'anthropic', display_name: 'Claude 3.5 Haiku', context_window: 200000, cost_per_1k_input: 0.0008, cost_per_1k_output: 0.004, supports_streaming: true, recommended_roles: ['thinker', 'critic'] },
  // Google
  { id: 'google/gemini-2.5-flash', provider: 'google', display_name: 'Gemini 2.5 Flash', context_window: 1048576, cost_per_1k_input: 0.0003, cost_per_1k_output: 0.0025, supports_streaming: true, recommended_roles: ['thinker', 'devils_advocate'] },
  { id: 'google/gemini-2.0-flash-001', provider: 'google', display_name: 'Gemini 2.0 Flash', context_window: 1048576, cost_per_1k_input: 0.0001, cost_per_1k_output: 0.0004, supports_streaming: true, recommended_roles: ['thinker', 'devils_advocate'] },
  { id: 'google/gemini-2.5-pro', provider: 'google', display_name: 'Gemini 2.5 Pro', context_window: 1048576, cost_per_1k_input: 0.00125, cost_per_1k_output: 0.010, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'] },
  // xAI Grok
  { id: 'x-ai/grok-3-mini', provider: 'xai', display_name: 'Grok 3 Mini', context_window: 131072, cost_per_1k_input: 0.0003, cost_per_1k_output: 0.0005, supports_streaming: true, recommended_roles: ['thinker', 'devils_advocate'] },
  { id: 'x-ai/grok-4-fast', provider: 'xai', display_name: 'Grok 4 Fast', context_window: 2000000, cost_per_1k_input: 0.0002, cost_per_1k_output: 0.0005, supports_streaming: true, recommended_roles: ['thinker', 'critic'] },
  // Meta
  { id: 'meta-llama/llama-3.3-70b-instruct', provider: 'meta', display_name: 'Llama 3.3 70B', context_window: 128000, cost_per_1k_input: 0.00035, cost_per_1k_output: 0.0004, supports_streaming: true, recommended_roles: ['thinker', 'devils_advocate'] },
  // DeepSeek
  { id: 'deepseek/deepseek-v3.2', provider: 'deepseek', display_name: 'DeepSeek V3.2', context_window: 163840, cost_per_1k_input: 0.000224, cost_per_1k_output: 0.00032, supports_streaming: true, recommended_roles: ['thinker', 'devils_advocate'] },
];

function AppContent() {
  // Use explicit selector pattern for currentPhase to ensure re-renders
  const currentPhase = useSessionStore((state) => state.currentPhase);
  const setSessions = useSessionStore((state) => state.setSessions);
  const resetSession = useSessionStore((state) => state.resetSession);
  const { setAvailableModels, resetCouncil } = useCouncilStore();
  const { user } = useAuthStore();
  const currentView = useUIStore((state) => state.currentView);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load sessions from Supabase (only if user is logged in)
        if (user) {
          const { data: sessions, error: sessionsError } = await supabase
            .from('sessions')
            .select('id, title, created_at, project_id')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false })
            .limit(50) as { data: Array<{ id: string; title: string; created_at: string; project_id: string }> | null; error: unknown };

          if (!sessionsError && sessions) {
            setSessions(
              sessions.map((s) => ({
                id: s.id,
                title: s.title,
                status: 'completed' as const,
                current_phase: 'synthesis' as const,
                created_at: s.created_at,
                council_name: 'Council',
              }))
            );
          }
        }

        // Load available models
        const models = await modelsApi.list();
        setAvailableModels(models);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // Use fallback models when backend API is unavailable
        setAvailableModels(FALLBACK_MODELS);
      }
    };

    loadInitialData();
  }, [setSessions, setAvailableModels, user]);

  const handleNewSession = useCallback(() => {
    resetSession();
    resetCouncil();
  }, [resetSession, resetCouncil]);

  const loadSessionForReplay = useSessionStore((state) => state.loadSessionForReplay);

  const handleSelectSession = useCallback(
    async (session: SessionSummary) => {
      try {
        // Load session in replay mode
        await loadSessionForReplay(session.id);
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    },
    [loadSessionForReplay]
  );

  // Render the appropriate phase component or settings
  const renderPhase = () => {
    // Check for settings view first
    if (currentView === 'settings') {
      return <SettingsPage />;
    }

    console.log('[App] renderPhase called with currentPhase:', currentPhase);
    switch (currentPhase) {
      case 'setup':
        return <SetupPhase />;
      case 'reasoning':
        return <ReasoningPhase />;
      case 'review':
        return <ReviewPhase />;
      case 'synthesis':
        return <SynthesisPhase />;
      default:
        return <SetupPhase />;
    }
  };

  // Add key to force React to remount phase components when switching
  return (
    <MainLayout onNewSession={handleNewSession} onSelectSession={handleSelectSession}>
      <div key={`${currentView}-${currentPhase}`}>
        {renderPhase()}
      </div>
    </MainLayout>
  );
}

// Main App component with authentication guard
function App() {
  // Check if we're on the password reset page
  const isResetPasswordPage = window.location.pathname === '/auth/reset-password';

  if (isResetPasswordPage) {
    return <ResetPasswordPage />;
  }

  return (
    <AuthGuard>
      <AppContent />
    </AuthGuard>
  );
}

export default App;
