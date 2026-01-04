import { useState, useMemo } from 'react';
import { Play, Plus, Trash2, ChevronDown, Brain } from 'lucide-react';
import { useSessionStore, useCouncilStore, useAuthStore } from '@/store';
import { useReplayMode } from '@/hooks';
import { supabase } from '@/lib/supabase';
import { orchestratorApi } from '@/api/orchestrator';
import { ReplayModeIndicator, ReplayPhaseNavigation } from '@/components/replay';
import { GlassCard, GradientButton, GlowBadge, AIOrb, ModelTooltip } from '@/components/ui';
import { PromptCreator } from './PromptCreator';
import { getModelDescription } from '@/features/help/content/modelDescriptions';
import type { RoleType, ModelInfo, ModelTier } from '@/types';

const roleLabels: Record<RoleType, string> = {
  thinker: 'Thinker',
  critic: 'Critic',
  devils_advocate: "Devil's Advocate",
  synthesizer: 'Synthesizer',
};

const tierOrder: ModelTier[] = ['fast', 'balanced', 'deep', 'executive', 'code', 'critic'];
const tierLabels: Record<ModelTier, string> = {
  fast: 'Fast',
  balanced: 'Balanced',
  deep: 'Deep Analysis',
  executive: 'Executive',
  code: 'Code Specialist',
  critic: 'Critical Analysis',
};
const tierBadgeVariants: Record<ModelTier, 'tier-fast' | 'tier-balanced' | 'tier-deep' | 'tier-executive' | 'tier-code' | 'tier-critic'> = {
  fast: 'tier-fast',
  balanced: 'tier-balanced',
  deep: 'tier-deep',
  executive: 'tier-executive',
  code: 'tier-code',
  critic: 'tier-critic',
};

export function SetupPhase() {
  const { prompt, setCurrentPhase, setCurrentRunId, addSession } = useSessionStore();
  const { selectedModels, availableModels, addModel, removeModel, updateModelConfig, isValidCouncil } =
    useCouncilStore();
  const { user } = useAuthStore();
  const { isReplayMode, replayData, modelInfo } = useReplayMode();
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group models by tier for organized display
  const groupedModels = useMemo(() => {
    const groups: Partial<Record<ModelTier, ModelInfo[]>> = {};
    availableModels.forEach(model => {
      const tier = model.tier || 'balanced';
      if (!groups[tier]) groups[tier] = [];
      groups[tier]!.push(model);
    });
    return groups;
  }, [availableModels]);

  // Render read-only view for replay mode
  if (isReplayMode && replayData) {
    const replayPrompt = replayData.prompt;
    const councilMembers = modelInfo;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Replay Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Session Prompt</h2>
            <p className="text-sm text-text-secondary mt-1">
              {replayData.session.title || 'Untitled Session'}
            </p>
          </div>
          <ReplayModeIndicator />
        </div>

        {/* Replay Navigation - visible at top for mobile accessibility */}
        <div className="flex justify-center">
          <ReplayPhaseNavigation />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Prompt (read-only) */}
          <div className="space-y-4">
            <div className="bg-bg-secondary rounded-lg border border-border p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Question / Task
                </label>
                <div className="text-text-primary whitespace-pre-wrap">
                  {replayPrompt?.content || 'No prompt content'}
                </div>
              </div>

              {replayPrompt?.objective && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Objective
                  </label>
                  <div className="text-text-primary">{replayPrompt.objective}</div>
                </div>
              )}

              {replayPrompt?.audience && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Target Audience
                  </label>
                  <div className="text-text-primary">{replayPrompt.audience}</div>
                </div>
              )}

              {replayPrompt?.context && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Context
                  </label>
                  <div className="text-text-primary whitespace-pre-wrap">{replayPrompt.context}</div>
                </div>
              )}

              {replayPrompt?.constraints && replayPrompt.constraints.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Constraints
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {replayPrompt.constraints.map((constraint, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-bg-tertiary text-text-primary text-sm"
                      >
                        {constraint}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Council (read-only) */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-text-secondary">Council Members</h3>
            <div className="space-y-3">
              {councilMembers.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed border-border text-center">
                  <p className="text-text-muted">No council data available</p>
                </div>
              ) : (
                councilMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-lg border border-border bg-bg-secondary"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          member.role === 'thinker' ? 'bg-role-thinker' :
                          member.role === 'critic' ? 'bg-role-critic' :
                          member.role === 'devils_advocate' ? 'bg-role-devils-advocate' :
                          'bg-role-synthesizer'
                        }`}
                      />
                      <span className="font-medium text-text-primary">{member.display_name}</span>
                      <span className="text-xs text-text-muted px-2 py-0.5 bg-bg-tertiary rounded">
                        {roleLabels[member.role as RoleType] || member.role}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    );
  }

  const handleStartDeliberation = async () => {
    if (!user) {
      setError('You must be logged in to start a deliberation');
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      // Step 1: Setup user workspace (org + project) using RPC function
      const { data: workspace, error: workspaceError } = await supabase.rpc('setup_user_workspace', {
        user_uuid: user.id,
      } as unknown as undefined) as { data: Array<{ out_org_id: string; out_project_id: string }> | null; error: { message: string } | null };

      if (workspaceError) {
        throw new Error(`Failed to setup workspace: ${workspaceError.message}`);
      }

      if (!workspace || workspace.length === 0) {
        throw new Error('No workspace returned from setup');
      }

      const workspaceResult = workspace[0];
      if (!workspaceResult) {
        throw new Error('No workspace data returned');
      }
      const projectId = workspaceResult.out_project_id;

      // Step 3: Create session
      const sessionTitle = prompt.content.substring(0, 100) + (prompt.content.length > 100 ? '...' : '');
      const { data: session, error: sessionError } = await (supabase
        .from('sessions') as ReturnType<typeof supabase.from>)
        .insert({
          project_id: projectId,
          title: sessionTitle,
          created_by: user.id,
        })
        .select()
        .single() as unknown as { data: { id: string; title: string; created_at: string } | null; error: { message: string } | null };

      if (sessionError || !session) throw new Error(`Failed to create session: ${sessionError?.message || 'No session returned'}`);

      // Add session to sidebar
      addSession({
        id: session.id,
        title: session.title,
        status: 'running',
        current_phase: 'reasoning',
        created_at: session.created_at,
        council_name: `${selectedModels.length} models`,
      });

      // Step 4: Call orchestrator to start run
      const runResponse = await orchestratorApi.createRun(
        {
          session_id: session.id,
          prompt: {
            content: prompt.content,
            objective: prompt.objective,
            constraints: prompt.constraints || [],
            audience: prompt.audience,
            context: prompt.context,
            attachments: prompt.attachments.map((att) => ({
              id: att.id,
              type: att.type,
              filename: att.filename,
              storage_path: att.storage_path,
              public_url: att.public_url,
              mime_type: att.mime_type,
              size_bytes: att.size_bytes,
              extracted_text: att.extracted_text,
            })),
          },
          council: {
            members: selectedModels.map((m) => ({
              model_key: m.model_id,
              display_name: m.display_name || m.model_id,
              role: m.role === 'synthesizer' ? 'chair' : m.role,
              weight: m.weight,
            })),
          },
        },
        user.id
      );

      console.log('Run started:', runResponse);

      // Store the run ID and move to reasoning phase
      setCurrentRunId(runResponse.id);
      setCurrentPhase('reasoning');
    } catch (err) {
      console.error('Failed to start deliberation:', err);
      setError(err instanceof Error ? err.message : 'Failed to start deliberation');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section with AI Orb */}
      <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
        <div className="flex-1 space-y-4">
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-gradient">
            Configure Your Council
          </h1>
          <p className="text-text-secondary text-lg max-w-xl">
            Assemble a diverse council of AI models to deliberate on your question.
            Each model brings unique perspectives and reasoning styles.
          </p>
        </div>
        <div className="hidden lg:block">
          <AIOrb size={180} isActive={true} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Prompt Creator */}
        <PromptCreator />

        {/* Right: Council Builder */}
        <div className="space-y-6">
          <GlassCard padding="lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-text-primary">Council</h2>
                  <p className="text-sm text-text-muted">{selectedModels.length} models selected</p>
                </div>
              </div>
              <GradientButton
                data-tour="model-selector"
                variant="secondary"
                size="sm"
                onClick={() => setShowModelSelector(!showModelSelector)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Model
              </GradientButton>
            </div>

            {/* Model Selector Dropdown - Grouped by Tier */}
            {showModelSelector && (
              <GlassCard variant="subtle" padding="md" className="mb-4 animate-fade-in">
                <div className="text-sm font-medium text-text-secondary mb-3">Select a model to add:</div>
                <div className="max-h-80 overflow-y-auto pr-1 space-y-4">
                  {tierOrder.map((tier) => {
                    const models = groupedModels[tier];
                    if (!models?.length) return null;

                    return (
                      <div key={tier}>
                        {/* Tier Section Header */}
                        <div className="flex items-center gap-2 mb-2 sticky top-0 bg-bg-secondary/95 backdrop-blur-sm py-1.5 -mx-1 px-1 z-10">
                          <GlowBadge variant={tierBadgeVariants[tier]} size="sm">
                            {tierLabels[tier]}
                          </GlowBadge>
                          <span className="text-xs text-text-muted">
                            {models.length} model{models.length > 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Models in this tier */}
                        <div className="grid grid-cols-1 gap-2">
                          {models.map((model) => {
                            const description = getModelDescription(model.id);
                            return (
                              <button
                                key={model.id}
                                onClick={() => {
                                  addModel(model);
                                  setShowModelSelector(false);
                                }}
                                className="flex flex-col p-3 rounded-xl glass-subtle
                                         hover:bg-accent/10 hover:border-accent transition-all text-left group w-full"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div>
                                    <div className="text-sm font-medium text-text-primary group-hover:text-accent-secondary transition-colors">
                                      {model.display_name}
                                    </div>
                                    <div className="text-xs text-text-muted">{model.provider}</div>
                                  </div>
                                  <div className="text-xs text-text-muted">
                                    ${model.cost_per_1k_output.toFixed(4)}/1k
                                  </div>
                                </div>
                                {description && (
                                  <div className="mt-2 text-xs text-text-secondary leading-relaxed">
                                    {description.tagline}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}

            {/* Selected Models */}
            <div className="space-y-3">
              {selectedModels.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-glass-border text-center">
                  <p className="text-text-muted">No models selected. Add at least 2 models to your council.</p>
                </div>
              ) : (
                selectedModels.map((member, index) => (
                  <GlassCard
                    key={member.id}
                    variant="subtle"
                    padding="md"
                    className={`border-l-4 ${
                      member.role === 'thinker' ? 'border-l-role-thinker glow-role-thinker' :
                      member.role === 'critic' ? 'border-l-role-critic glow-role-critic' :
                      member.role === 'devils_advocate' ? 'border-l-role-devils-advocate glow-role-devils-advocate' :
                      'border-l-role-synthesizer glow-role-synthesizer'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <ModelTooltip modelId={member.model_id} position="top">
                          <span className="font-medium text-text-primary cursor-help">
                            {member.display_name || member.model_id}
                          </span>
                        </ModelTooltip>
                        <GlowBadge
                          variant={
                            member.role === 'thinker' ? 'thinker' :
                            member.role === 'critic' ? 'critic' :
                            member.role === 'devils_advocate' ? 'devils-advocate' :
                            'synthesizer'
                          }
                          size="sm"
                        >
                          {roleLabels[member.role]}
                        </GlowBadge>
                      </div>
                      <button
                        onClick={() => removeModel(member.id)}
                        className="p-2 rounded-lg hover:bg-accent-error/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-accent-error" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1" {...(index === 0 ? { 'data-tour': 'role-selector' } : {})}>
                        <label className="block text-xs text-text-muted mb-1.5">Role</label>
                        <div className="relative">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              updateModelConfig(member.id, { role: e.target.value as RoleType })
                            }
                            className="w-full px-3 py-2.5 rounded-xl glass-subtle
                                     text-sm text-text-primary appearance-none cursor-pointer
                                     focus:ring-2 focus:ring-accent/50 transition-all"
                          >
                            {Object.entries(roleLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        </div>
                      </div>

                      <div className="w-24" {...(index === 0 ? { 'data-tour': 'model-weight' } : {})}>
                        <label className="block text-xs text-text-muted mb-1.5">Weight</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={member.weight}
                          onChange={(e) =>
                            updateModelConfig(member.id, { weight: parseFloat(e.target.value) || 1 })
                          }
                          className="w-full px-3 py-2.5 rounded-xl glass-subtle
                                   text-sm text-text-primary focus:ring-2 focus:ring-accent/50 transition-all"
                        />
                      </div>
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          </GlassCard>

          {/* Error Message */}
          {error && (
            <GlassCard variant="subtle" padding="sm" className="border border-accent-error/30 bg-accent-error/10">
              <p className="text-sm text-accent-error">{error}</p>
            </GlassCard>
          )}

          {/* Start Button */}
          <GradientButton
            data-tour="start-button"
            onClick={handleStartDeliberation}
            disabled={!isValidCouncil() || !prompt.content.trim() || isStarting}
            size="lg"
            glow={true}
            loading={isStarting}
            icon={isStarting ? undefined : <Play className="w-5 h-5" />}
            className="w-full"
          >
            {isStarting ? 'Starting Deliberation...' : 'Start Deliberation'}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
