import { useMemo } from 'react';
import { useSessionStore } from '@/store';
import type { ModelOutput, Vote } from '@/types';

/**
 * Hook for accessing replay mode data with computed convenience values.
 * Use this in phase components to easily access historical data.
 */
export function useReplayMode() {
  const isReplayMode = useSessionStore((state) => state.isReplayMode);
  const replayData = useSessionStore((state) => state.replayData);
  const setCurrentPhase = useSessionStore((state) => state.setCurrentPhase);

  // Get reasoning outputs (phase 2) mapped to ModelOutput format
  const reasoningOutputs = useMemo(() => {
    if (!replayData?.runModels) return new Map<string, ModelOutput>();

    const outputs = new Map<string, ModelOutput>();
    for (const model of replayData.runModels) {
      const phase2Output = model.outputs.find((o) => o.phase === 2);
      if (phase2Output) {
        outputs.set(model.id, {
          id: phase2Output.id,
          member_id: model.id,
          model_id: model.model_key,
          role: model.role as ModelOutput['role'],
          content: phase2Output.content,
          token_count: (phase2Output.metadata?.token_count as number) || 0,
          latency_ms: model.latency_ms || 0,
          created_at: phase2Output.created_at,
        });
      }
    }
    return outputs;
  }, [replayData?.runModels]);

  // Get peer review votes mapped to Vote format
  const peerReviewVotes = useMemo((): Vote[] => {
    if (!replayData?.peerReviews || !replayData?.runModels) return [];

    // Group reviews by reviewer
    const reviewsByReviewer = new Map<string, typeof replayData.peerReviews>();
    for (const review of replayData.peerReviews) {
      const existing = reviewsByReviewer.get(review.reviewer_run_model_id) || [];
      existing.push(review);
      reviewsByReviewer.set(review.reviewer_run_model_id, existing);
    }

    // Convert to Vote format
    return Array.from(reviewsByReviewer.entries()).map(([reviewerId, reviews]) => ({
      id: reviewerId,
      voter_member_id: reviewerId,
      rankings: reviews
        .sort((a, b) => b.score - a.score)
        .map((review, index) => ({
          target_member_id: review.reviewed_run_model_id,
          rank: index + 1,
          score: review.score,
          reasoning: review.rationale,
        })),
      critique: null,
    }));
  }, [replayData?.peerReviews, replayData?.runModels]);

  // Get synthesis output (phase 4)
  const synthesisOutput = useMemo(() => {
    if (!replayData?.runModels) return null;

    // Find the model that has the phase 4 (synthesis) output
    // First try to find a model with chair/synthesizer role
    let chairmanModel = replayData.runModels.find(
      (m) => m.role === 'synthesizer' || m.role === 'chairman' || m.role === 'chair'
    );

    // If no chair role found, find any model that has a phase 4 output
    // (the orchestrator uses the first model as chairman when no chair is assigned)
    if (!chairmanModel) {
      chairmanModel = replayData.runModels.find(
        (m) => m.outputs.some((o) => o.phase === 4)
      );
    }

    if (!chairmanModel) return null;

    const phase4Output = chairmanModel.outputs.find((o) => o.phase === 4);
    if (!phase4Output) return null;

    return {
      id: phase4Output.id,
      member_id: chairmanModel.id,
      model_id: chairmanModel.model_key,
      role: 'synthesizer' as const,
      content: phase4Output.content,
      token_count: (phase4Output.metadata?.token_count as number) || 0,
      latency_ms: chairmanModel.latency_ms || 0,
      created_at: phase4Output.created_at,
      confidence_level: (phase4Output.metadata?.confidence_level as number) || 0,
      key_agreements: (phase4Output.metadata?.key_agreements as string[]) || [],
      key_disagreements: (phase4Output.metadata?.key_disagreements as string[]) || [],
      reasoning_summary: (phase4Output.metadata?.reasoning_summary as string) || '',
      minority_opinions: (phase4Output.metadata?.minority_opinions as string[]) || [],
    };
  }, [replayData?.runModels]);

  // Get model display info for UI
  const modelInfo = useMemo(() => {
    if (!replayData?.runModels) return [];
    return replayData.runModels.map((m) => ({
      id: m.id,
      model_key: m.model_key,
      display_name: m.display_name,
      role: m.role,
      status: m.status,
      cost_usd: m.cost_usd,
    }));
  }, [replayData?.runModels]);

  // Navigation helper to go to a specific phase
  const navigateToPhase = (phase: 'setup' | 'reasoning' | 'review' | 'synthesis') => {
    if (isReplayMode) {
      setCurrentPhase(phase);
    }
  };

  return {
    isReplayMode,
    replayData,
    // Computed data
    reasoningOutputs,
    peerReviewVotes,
    synthesisOutput,
    modelInfo,
    // Helpers
    navigateToPhase,
    // Convenience checks
    hasReasoningData: reasoningOutputs.size > 0,
    hasReviewData: peerReviewVotes.length > 0,
    hasSynthesisData: !!synthesisOutput,
    runStatus: replayData?.run?.status ?? null,
    totalCost: replayData?.run?.cost_usd ?? null,
  };
}
