import { useEffect, useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, CheckCircle2, XCircle, Clock, ChevronRight, Brain, Timer, Zap, TrendingUp } from 'lucide-react';
import { useSessionStore, useCouncilStore } from '@/store';
import { orchestratorApi } from '@/api/orchestrator';
import { useRealtimeRunStatus, useReplayMode } from '@/hooks';
import { ReplayModeIndicator, ReplayPhaseNavigation } from '@/components/replay';
import { GlassCard, GradientButton, GlowBadge } from '@/components/ui';

interface ModelOutput {
  id: string;
  phase: number;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface ModelResponse {
  id: string;
  model_key: string;
  display_name: string;
  role: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  outputs?: ModelOutput[];
  latency_ms?: number;
}

interface RunData {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
  current_phase: number;
  models: ModelResponse[];
  error?: { message: string };
}

const roleLabels: Record<string, string> = {
  thinker: 'Thinker',
  critic: 'Critic',
  devils_advocate: "Devil's Advocate",
  chair: 'Chair',
};

const statusIcons = {
  pending: Clock,
  running: Loader2,
  succeeded: CheckCircle2,
  failed: XCircle,
};

export function ReasoningPhase() {
  const { currentRunId, setCurrentPhase, addReasoningResponse } = useSessionStore();
  const { selectedModels } = useCouncilStore();
  const { isReplayMode, replayData, reasoningOutputs, modelInfo } = useReplayMode();
  const [runData, setRunData] = useState<RunData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  // Helper functions for role styling
  const getRoleGlow = (role: string) => {
    switch (role) {
      case 'thinker': return 'glow-role-thinker border-l-role-thinker';
      case 'critic': return 'glow-role-critic border-l-role-critic';
      case 'devils_advocate': return 'glow-role-devils-advocate border-l-role-devils-advocate';
      case 'chair': return 'glow-role-synthesizer border-l-role-synthesizer';
      default: return 'border-l-accent';
    }
  };

  const getRoleBadgeVariant = (role: string): 'thinker' | 'critic' | 'devils-advocate' | 'synthesizer' => {
    switch (role) {
      case 'thinker': return 'thinker';
      case 'critic': return 'critic';
      case 'devils_advocate': return 'devils-advocate';
      case 'chair': return 'synthesizer';
      default: return 'thinker';
    }
  };

  // Render replay mode view
  if (isReplayMode && replayData) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center glow-teal">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-gradient">Reasoning Phase</h1>
              <p className="text-text-secondary mt-1">
                Individual model responses from this session.
              </p>
            </div>
          </div>
          <ReplayModeIndicator />
        </div>

        {/* Replay Navigation - visible at top for mobile accessibility */}
        <div className="flex justify-center">
          <ReplayPhaseNavigation />
        </div>

        {/* Model Response Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {modelInfo.map((model) => {
            const output = reasoningOutputs.get(model.id);
            const isExpanded = expandedCard === model.id;

            return (
              <GlassCard
                key={model.id}
                variant="subtle"
                padding="none"
                className={`
                  overflow-hidden transition-all border-l-4
                  ${isExpanded ? 'lg:col-span-2 xl:col-span-3' : ''}
                  ${getRoleGlow(model.role)}
                `}
              >
                {/* Card Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-tertiary/30 transition-colors"
                  onClick={() => setExpandedCard(isExpanded ? null : model.id)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-text-primary">{model.display_name}</div>
                      <GlowBadge variant={getRoleBadgeVariant(model.role)} size="sm">
                        {roleLabels[model.role] || model.role}
                      </GlowBadge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {output ? (
                      <CheckCircle2 className="w-5 h-5 text-accent-success" />
                    ) : (
                      <XCircle className="w-5 h-5 text-text-muted" />
                    )}
                    <ChevronRight
                      className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>

                {/* Card Content */}
                {(isExpanded || output) && (
                  <div className="border-t border-glass-border">
                    {output ? (
                      <div className="p-4">
                        <div className={`prose prose-sm prose-invert max-w-none ${isExpanded ? '' : 'line-clamp-4'}`}>
                          <ReactMarkdown>{output.content}</ReactMarkdown>
                        </div>
                        {output.latency_ms > 0 && (
                          <div className="mt-4 pt-3 border-t border-glass-border flex items-center gap-4 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {(output.latency_ms / 1000).toFixed(2)}s
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-text-muted">
                        <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                          <XCircle className="w-6 h-6 opacity-50" />
                        </div>
                        <p>No response recorded</p>
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>

      </div>
    );
  }

  // Fetch run status from orchestrator
  const fetchRunStatus = useCallback(async () => {
    if (!currentRunId || isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      const data = await orchestratorApi.getRun(currentRunId);
      setRunData(data);

      // Store responses in session store
      data.models?.forEach((model: ModelResponse) => {
        const reasoningOutput = model.outputs?.find((o: ModelOutput) => o.phase === 2);
        if (model.status === 'succeeded' && reasoningOutput?.content) {
          addReasoningResponse(model.id, {
            id: model.id,
            member_id: model.id,
            model_id: model.model_key,
            role: model.role as 'thinker' | 'critic' | 'devils_advocate' | 'synthesizer',
            content: reasoningOutput.content,
            token_count: 0,
            latency_ms: model.latency_ms || 0,
            created_at: new Date().toISOString(),
          });
        }
      });
    } catch (err) {
      console.error('Failed to fetch run status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch run status');
    } finally {
      isFetchingRef.current = false;
    }
  }, [currentRunId, addReasoningResponse]);

  // Use Supabase Realtime to detect changes
  useRealtimeRunStatus({
    runId: currentRunId,
    onUpdate: fetchRunStatus,
    enabled: runData?.status === 'running' || runData?.status === 'queued' || !runData,
  });

  // Initial fetch and fallback polling (in case Realtime has issues)
  useEffect(() => {
    if (!currentRunId) return;

    // Initial fetch
    fetchRunStatus();

    // Fallback poll every 10 seconds (Realtime handles most updates)
    const interval = setInterval(() => {
      if (runData?.status === 'running' || runData?.status === 'queued' || !runData) {
        fetchRunStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [currentRunId, fetchRunStatus, runData?.status]);

  // Show loading if no run ID
  if (!currentRunId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-text-secondary">No active run. Please start a new deliberation.</p>
        </div>
      </div>
    );
  }

  // Get models from run data or fall back to selected models
  const models = runData?.models || selectedModels.map(m => ({
    id: m.id,
    model_key: m.model_id,
    display_name: m.display_name || m.model_id,
    role: m.role === 'synthesizer' ? 'chair' : m.role,
    status: 'pending' as const,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center glow-teal">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gradient">Reasoning Phase</h1>
            <p className="text-text-secondary mt-1">
              Models are analyzing your question and generating responses.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {runData?.status === 'running' && (
            <GlowBadge variant="teal" pulse>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              Processing...
            </GlowBadge>
          )}
          {runData?.status === 'succeeded' && (
            <GlowBadge variant="success">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Complete
            </GlowBadge>
          )}
          {runData?.status === 'failed' && (
            <GlowBadge variant="error">
              <XCircle className="w-4 h-4 mr-1.5" />
              Failed
            </GlowBadge>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <GlassCard variant="subtle" padding="md" className="border border-accent-error/30 bg-accent-error/10">
          <p className="text-sm text-accent-error">{error}</p>
        </GlassCard>
      )}

      {/* Timing Stats Section */}
      {(() => {
        const completedModels = runData?.models?.filter(m => m.status === 'succeeded' && m.latency_ms) || [];
        if (completedModels.length === 0) return null;

        const latencies = completedModels.map(m => m.latency_ms!);
        const totalTime = Math.max(...latencies); // Parallel execution = slowest determines total
        const avgTime = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        const fastest = completedModels.reduce((a, b) => (a.latency_ms! < b.latency_ms! ? a : b));
        const slowest = completedModels.reduce((a, b) => (a.latency_ms! > b.latency_ms! ? a : b));

        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlassCard variant="subtle" padding="md" className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Timer className="w-4 h-4 text-accent" />
                <span className="text-xs text-text-muted uppercase tracking-wide">Total Time</span>
              </div>
              <div className="text-2xl font-bold font-display text-gradient">
                {(totalTime / 1000).toFixed(1)}s
              </div>
            </GlassCard>
            <GlassCard variant="subtle" padding="md" className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-text-secondary" />
                <span className="text-xs text-text-muted uppercase tracking-wide">Avg Time</span>
              </div>
              <div className="text-2xl font-bold font-display text-text-primary">
                {(avgTime / 1000).toFixed(1)}s
              </div>
            </GlassCard>
            <GlassCard variant="subtle" padding="md" className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-accent-success" />
                <span className="text-xs text-text-muted uppercase tracking-wide">Fastest</span>
              </div>
              <div className="text-2xl font-bold font-display text-accent-success">
                {(fastest.latency_ms! / 1000).toFixed(1)}s
              </div>
              <div className="text-xs text-text-muted mt-1 truncate" title={fastest.display_name}>
                {fastest.display_name}
              </div>
            </GlassCard>
            <GlassCard variant="subtle" padding="md" className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-accent-secondary" />
                <span className="text-xs text-text-muted uppercase tracking-wide">Slowest</span>
              </div>
              <div className="text-2xl font-bold font-display text-accent-secondary">
                {(slowest.latency_ms! / 1000).toFixed(1)}s
              </div>
              <div className="text-xs text-text-muted mt-1 truncate" title={slowest.display_name}>
                {slowest.display_name}
              </div>
            </GlassCard>
          </div>
        );
      })()}

      {/* Model Response Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {models.map((model) => {
          const StatusIcon = statusIcons[model.status];
          const isExpanded = expandedCard === model.id;
          const modelData = runData?.models?.find(m => m.id === model.id);
          // Get phase 2 (reasoning) output content
          const reasoningOutput = modelData?.outputs?.find(o => o.phase === 2);
          const content = reasoningOutput?.content || '';
          const isRunning = model.status === 'running';

          return (
            <GlassCard
              key={model.id}
              variant={isRunning ? 'default' : 'subtle'}
              padding="none"
              className={`
                overflow-hidden transition-all border-l-4
                ${isExpanded ? 'lg:col-span-2 xl:col-span-3' : ''}
                ${getRoleGlow(model.role)}
                ${isRunning ? 'animate-glow-pulse' : ''}
              `}
            >
              {/* Card Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-tertiary/30 transition-colors"
                onClick={() => setExpandedCard(isExpanded ? null : model.id)}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium text-text-primary">{model.display_name}</div>
                    <GlowBadge variant={getRoleBadgeVariant(model.role)} size="sm">
                      {roleLabels[model.role] || model.role}
                    </GlowBadge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusIcon
                    className={`w-5 h-5 ${
                      model.status === 'running' ? 'animate-spin text-accent-secondary' :
                      model.status === 'succeeded' ? 'text-accent-success' :
                      model.status === 'failed' ? 'text-accent-error' :
                      'text-text-muted'
                    }`}
                  />
                  <ChevronRight
                    className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </div>
              </div>

              {/* Card Content */}
              {(isExpanded || model.status === 'succeeded') && (
                <div className="border-t border-glass-border">
                  {model.status === 'pending' && (
                    <div className="p-6 text-center text-text-muted">
                      <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-6 h-6 opacity-50" />
                      </div>
                      <p>Waiting to start...</p>
                    </div>
                  )}
                  {model.status === 'running' && (
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3 glow-teal">
                        <Loader2 className="w-6 h-6 animate-spin text-accent-secondary" />
                      </div>
                      <p className="text-accent-secondary">Generating response...</p>
                    </div>
                  )}
                  {model.status === 'succeeded' && content && (
                    <div className="p-4">
                      <div className={`prose prose-sm prose-invert max-w-none ${isExpanded ? '' : 'line-clamp-4'}`}>
                        <ReactMarkdown>{content}</ReactMarkdown>
                      </div>
                      {modelData?.latency_ms && (
                        <div className="mt-4 pt-3 border-t border-glass-border flex items-center gap-4 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {(modelData.latency_ms / 1000).toFixed(2)}s
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {model.status === 'failed' && (
                    <div className="p-6 text-center text-accent-error">
                      <div className="w-12 h-12 rounded-full bg-accent-error/20 flex items-center justify-center mx-auto mb-3">
                        <XCircle className="w-6 h-6" />
                      </div>
                      <p>Failed to generate response</p>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {/* Continue Button */}
      {runData?.status === 'succeeded' && runData.current_phase >= 2 && (
        <div className="flex justify-end">
          <GradientButton
            onClick={() => setCurrentPhase('review')}
            size="lg"
            glow={true}
            icon={<ChevronRight className="w-5 h-5" />}
          >
            Continue to Peer Review
          </GradientButton>
        </div>
      )}
    </div>
  );
}
