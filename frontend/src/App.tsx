import { useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout';
import { AuthGuard, ResetPasswordPage } from '@/components/auth';
import { TourOverlay } from '@/components/ui';
import { useSessionStore, useCouncilStore, useAuthStore, useUIStore, useHelpStore } from '@/store';
import { modelsApi } from '@/api';
import { supabase } from '@/lib/supabase';
import { SetupPhase } from '@/features/council-builder/components/SetupPhase';
import { ReasoningPhase } from '@/features/reasoning';
import { ReviewPhase } from '@/features/review';
import { SynthesisPhase } from '@/features/synthesis';
import { SettingsPage } from '@/features/settings';
import { HelpPage } from '@/features/help';
import { CommandPalette, useCommandPalette } from '@/features/decision-memory';
import type { SessionSummary, ModelInfo } from '@/types';

// Fallback models when backend API is unavailable - Updated Jan 2026
const FALLBACK_MODELS: ModelInfo[] = [
  // OpenAI - all GPT-4o/4.1/5 series support vision
  { id: 'openai/gpt-5.2', provider: 'openai', display_name: 'GPT-5.2', context_window: 400000, cost_per_1k_input: 0.00175, cost_per_1k_output: 0.014, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'], supports_vision: true, tier: 'balanced' },
  { id: 'openai/gpt-5.2-chat', provider: 'openai', display_name: 'GPT-5.2 Chat', context_window: 128000, cost_per_1k_input: 0.00175, cost_per_1k_output: 0.014, supports_streaming: true, recommended_roles: ['critic'], supports_vision: true, tier: 'deep' },
  { id: 'openai/gpt-5.2-pro', provider: 'openai', display_name: 'GPT-5.2 Pro', context_window: 400000, cost_per_1k_input: 0.021, cost_per_1k_output: 0.168, supports_streaming: true, recommended_roles: ['synthesizer'], supports_vision: true, tier: 'executive' },
  { id: 'openai/gpt-5', provider: 'openai', display_name: 'GPT-5', context_window: 400000, cost_per_1k_input: 0.00125, cost_per_1k_output: 0.010, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'], supports_vision: true, tier: 'balanced' },
  { id: 'openai/gpt-5.1', provider: 'openai', display_name: 'GPT-5.1', context_window: 400000, cost_per_1k_input: 0.00125, cost_per_1k_output: 0.010, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'], supports_vision: true, tier: 'balanced' },
  { id: 'openai/gpt-5.1-codex-max', provider: 'openai', display_name: 'GPT-5.1 Codex Max', context_window: 400000, cost_per_1k_input: 0.00125, cost_per_1k_output: 0.010, supports_streaming: true, recommended_roles: ['synthesizer'], supports_vision: true, tier: 'code' },
  { id: 'openai/gpt-5-mini', provider: 'openai', display_name: 'GPT-5 Mini', context_window: 400000, cost_per_1k_input: 0.00025, cost_per_1k_output: 0.002, supports_streaming: true, recommended_roles: ['thinker', 'synthesizer'], supports_vision: true, tier: 'fast' },
  { id: 'openai/gpt-5-nano', provider: 'openai', display_name: 'GPT-5 Nano', context_window: 400000, cost_per_1k_input: 0.00005, cost_per_1k_output: 0.0004, supports_streaming: true, recommended_roles: ['thinker', 'devils_advocate'], supports_vision: true, tier: 'fast' },
  { id: 'openai/gpt-4o-mini', provider: 'openai', display_name: 'GPT-4o Mini', context_window: 128000, cost_per_1k_input: 0.00015, cost_per_1k_output: 0.0006, supports_streaming: true, recommended_roles: ['thinker', 'critic'], supports_vision: true, tier: 'fast' },
  { id: 'openai/gpt-4.1', provider: 'openai', display_name: 'GPT-4.1', context_window: 1047576, cost_per_1k_input: 0.002, cost_per_1k_output: 0.008, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'], supports_vision: true, tier: 'balanced' },
  { id: 'openai/gpt-4.1-mini', provider: 'openai', display_name: 'GPT-4.1 Mini', context_window: 1047576, cost_per_1k_input: 0.0004, cost_per_1k_output: 0.0016, supports_streaming: true, recommended_roles: ['thinker', 'critic'], supports_vision: true, tier: 'fast' },
  { id: 'openai/gpt-4.1-nano', provider: 'openai', display_name: 'GPT-4.1 Nano', context_window: 1047576, cost_per_1k_input: 0.0001, cost_per_1k_output: 0.0004, supports_streaming: true, recommended_roles: ['thinker', 'critic'], supports_vision: true, tier: 'fast' },
  // Anthropic - Claude 3.5+ and 4+ support vision
  { id: 'anthropic/claude-opus-4.5', provider: 'anthropic', display_name: 'Claude Opus 4.5', context_window: 200000, cost_per_1k_input: 0.005, cost_per_1k_output: 0.025, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'], supports_vision: true, tier: 'executive' },
  { id: 'anthropic/claude-sonnet-4.5', provider: 'anthropic', display_name: 'Claude Sonnet 4.5', context_window: 1000000, cost_per_1k_input: 0.003, cost_per_1k_output: 0.015, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'], supports_vision: true, tier: 'deep' },
  { id: 'anthropic/claude-sonnet-4', provider: 'anthropic', display_name: 'Claude Sonnet 4', context_window: 1000000, cost_per_1k_input: 0.003, cost_per_1k_output: 0.015, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'], supports_vision: true, tier: 'deep' },
  { id: 'anthropic/claude-haiku-4.5', provider: 'anthropic', display_name: 'Claude Haiku 4.5', context_window: 200000, cost_per_1k_input: 0.001, cost_per_1k_output: 0.005, supports_streaming: true, recommended_roles: ['thinker', 'critic'], supports_vision: true, tier: 'critic' },
  { id: 'anthropic/claude-3.7-sonnet', provider: 'anthropic', display_name: 'Claude 3.7 Sonnet', context_window: 200000, cost_per_1k_input: 0.003, cost_per_1k_output: 0.015, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'], supports_vision: true, tier: 'deep' },
  { id: 'anthropic/claude-3.5-sonnet', provider: 'anthropic', display_name: 'Claude 3.5 Sonnet', context_window: 200000, cost_per_1k_input: 0.006, cost_per_1k_output: 0.030, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'], supports_vision: true, tier: 'deep' },
  { id: 'anthropic/claude-3.5-haiku', provider: 'anthropic', display_name: 'Claude 3.5 Haiku', context_window: 200000, cost_per_1k_input: 0.0008, cost_per_1k_output: 0.004, supports_streaming: true, recommended_roles: ['thinker', 'critic'], supports_vision: true, tier: 'critic' },
  // Google - Gemini 2.0+ supports vision
  { id: 'google/gemini-2.5-flash', provider: 'google', display_name: 'Gemini 2.5 Flash', context_window: 1048576, cost_per_1k_input: 0.0003, cost_per_1k_output: 0.0025, supports_streaming: true, recommended_roles: ['thinker', 'devils_advocate'], supports_vision: true, tier: 'balanced' },
  { id: 'google/gemini-2.0-flash-001', provider: 'google', display_name: 'Gemini 2.0 Flash', context_window: 1048576, cost_per_1k_input: 0.0001, cost_per_1k_output: 0.0004, supports_streaming: true, recommended_roles: ['thinker', 'devils_advocate'], supports_vision: true, tier: 'fast' },
  { id: 'google/gemini-2.5-pro', provider: 'google', display_name: 'Gemini 2.5 Pro', context_window: 1048576, cost_per_1k_input: 0.00125, cost_per_1k_output: 0.010, supports_streaming: true, recommended_roles: ['thinker', 'critic', 'synthesizer'], supports_vision: true, tier: 'balanced' },
  { id: 'google/gemini-3-pro-preview', provider: 'google', display_name: 'Gemini 3 Pro', context_window: 1048576, cost_per_1k_input: 0.002, cost_per_1k_output: 0.012, supports_streaming: true, recommended_roles: ['thinker', 'critic'], supports_vision: true, tier: 'balanced' },
  // xAI Grok - Grok 3+ supports vision
  { id: 'x-ai/grok-3-mini', provider: 'xai', display_name: 'Grok 3 Mini', context_window: 131072, cost_per_1k_input: 0.0003, cost_per_1k_output: 0.0005, supports_streaming: true, recommended_roles: ['thinker', 'devils_advocate'], supports_vision: true, tier: 'fast' },
  { id: 'x-ai/grok-4-fast', provider: 'xai', display_name: 'Grok 4 Fast', context_window: 2000000, cost_per_1k_input: 0.0002, cost_per_1k_output: 0.0005, supports_streaming: true, recommended_roles: ['thinker', 'critic'], supports_vision: true, tier: 'fast' },
  { id: 'x-ai/grok-4.1-fast', provider: 'xai', display_name: 'Grok 4.1 Fast', context_window: 2000000, cost_per_1k_input: 0.0002, cost_per_1k_output: 0.0005, supports_streaming: true, recommended_roles: ['thinker', 'devils_advocate'], supports_vision: true, tier: 'fast' },
  { id: 'x-ai/grok-code-fast-1', provider: 'xai', display_name: 'Grok Code Fast 1', context_window: 256000, cost_per_1k_input: 0.0002, cost_per_1k_output: 0.0015, supports_streaming: true, recommended_roles: ['thinker', 'critic'], supports_vision: false, tier: 'code' },
  // Meta - Llama 3.3 is text-only
  { id: 'meta-llama/llama-3.3-70b-instruct', provider: 'meta', display_name: 'Llama 3.3 70B', context_window: 128000, cost_per_1k_input: 0.00035, cost_per_1k_output: 0.0004, supports_streaming: true, recommended_roles: ['thinker', 'devils_advocate'], supports_vision: false, tier: 'fast' },
  // DeepSeek - text-only
  { id: 'deepseek/deepseek-v3.2', provider: 'deepseek', display_name: 'DeepSeek V3.2', context_window: 163840, cost_per_1k_input: 0.00025, cost_per_1k_output: 0.00038, supports_streaming: true, recommended_roles: ['thinker', 'critic'], supports_vision: false, tier: 'balanced' },
  { id: 'deepseek/deepseek-v3.2-exp', provider: 'deepseek', display_name: 'DeepSeek V3.2 Exp', context_window: 163840, cost_per_1k_input: 0.00021, cost_per_1k_output: 0.00032, supports_streaming: true, recommended_roles: ['thinker'], supports_vision: false, tier: 'fast' },
  { id: 'deepseek/deepseek-v3.1-terminus', provider: 'deepseek', display_name: 'DeepSeek V3.1 Terminus', context_window: 163840, cost_per_1k_input: 0.00021, cost_per_1k_output: 0.00079, supports_streaming: true, recommended_roles: ['critic'], supports_vision: false, tier: 'critic' },
];

function AppContent() {
  // Use explicit selector pattern for currentPhase to ensure re-renders
  const currentPhase = useSessionStore((state) => state.currentPhase);
  const setSessions = useSessionStore((state) => state.setSessions);
  const resetSession = useSessionStore((state) => state.resetSession);
  const { setAvailableModels, resetCouncil } = useCouncilStore();
  const { user } = useAuthStore();
  const currentView = useUIStore((state) => state.currentView);

  // Register command palette keyboard shortcut (⌘K / Ctrl+K)
  useCommandPalette();

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

  // First-time user tour detection - waits for localStorage hydration
  const hasHydrated = useHelpStore((state) => state._hasHydrated);
  const tourCompleted = useHelpStore((state) => state.tourCompleted);
  const tourDismissed = useHelpStore((state) => state.tourDismissed);
  const startTour = useHelpStore((state) => state.startTour);

  useEffect(() => {
    // Wait for hydration to complete before checking tour status
    if (!hasHydrated) return;

    // Show tour for first-time users after a short delay
    if (!tourCompleted && !tourDismissed && user) {
      const timer = setTimeout(() => {
        startTour();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, hasHydrated, tourCompleted, tourDismissed, startTour]);

  // Render the appropriate phase component or settings/help
  const renderPhase = () => {
    // Check for help view first
    if (currentView === 'help') {
      return <HelpPage />;
    }

    // Check for settings view
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
    <>
      <MainLayout onNewSession={handleNewSession} onSelectSession={handleSelectSession}>
        <div key={`${currentView}-${currentPhase}`}>
          {renderPhase()}
        </div>
      </MainLayout>
      <TourOverlay />
      <CommandPalette />
    </>
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
