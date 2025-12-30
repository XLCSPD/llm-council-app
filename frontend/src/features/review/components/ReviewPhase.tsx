import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  BarChart3,
  Table2,
  MessageSquare,
  X,
  Info,
  Users,
} from 'lucide-react';
import { useSessionStore, useCouncilStore } from '@/store';
import { orchestratorApi } from '@/api/orchestrator';
import { useRealtimeRunStatus, useReplayMode } from '@/hooks';
import { ReplayModeIndicator, ReplayPhaseNavigation } from '@/components/replay';
import { GlassCard, GradientButton, GlowBadge } from '@/components/ui';
import { RankingsMatrix } from './RankingsMatrix';
import { AgreementChart, ScoreDistribution } from './AgreementChart';

// Minimalist info tooltip component
function InfoTooltip({ text }: { text: string }) {
  return (
    <div className="relative group inline-flex">
      <Info className="w-3.5 h-3.5 text-text-muted cursor-help opacity-60 hover:opacity-100 transition-opacity" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2
                      bg-bg-tertiary border border-border rounded-lg shadow-lg
                      text-xs text-text-secondary max-w-[250px] w-max
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible
                      transition-all duration-200 z-50 pointer-events-none">
        {text}
        <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1
                        border-4 border-transparent border-t-border" />
      </div>
    </div>
  );
}

interface PeerReview {
  id: string;
  run_id: string;
  reviewer_run_model_id: string;
  reviewed_run_model_id: string;
  score: number;
  rationale?: string;
  created_at: string;
}

interface ModelOutput {
  id: string;
  run_model_id: string;
  phase: number;
  content: string;
  metadata?: Record<string, unknown>;
}

interface RunModel {
  id: string;
  model_key: string;
  display_name: string;
  role: string;
  status: string;
  outputs?: ModelOutput[];
}

interface RunData {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
  current_phase: number;
  models?: RunModel[];
  peer_reviews?: PeerReview[];
  error?: { message: string };
}

type ViewMode = 'matrix' | 'chart';

export function ReviewPhase() {
  const { currentRunId, setCurrentPhase } = useSessionStore();
  const { selectedModels } = useCouncilStore();
  const { isReplayMode, replayData, modelInfo } = useReplayMode();
  const [runData, setRunData] = useState<RunData | null>(null);
  const [peerReviews, setPeerReviews] = useState<PeerReview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [selectedRationale, setSelectedRationale] = useState<{
    reviewer: string;
    reviewed: string;
    rationale: string;
    score: number;
  } | null>(null);
  const isFetchingRef = useRef(false);

  // Render replay mode view
  if (isReplayMode && replayData) {
    // Convert null rationale to undefined and add run_id to match PeerReview interface
    const replayPeerReviews: PeerReview[] = replayData.peerReviews.map(r => ({
      id: r.id,
      run_id: replayData.run?.id || '',
      reviewer_run_model_id: r.reviewer_run_model_id,
      reviewed_run_model_id: r.reviewed_run_model_id,
      score: r.score,
      rationale: r.rationale ?? undefined,
      created_at: r.created_at,
    }));
    const models = modelInfo.map(m => ({
      id: m.id,
      display_name: m.display_name,
      role: m.role === 'chair' ? 'synthesizer' : m.role,
    }));

    // Handle cell click to show rationale in replay mode
    const handleReplayCellClick = (reviewerId: string, reviewedId: string) => {
      const review = replayPeerReviews.find(
        r => r.reviewer_run_model_id === reviewerId && r.reviewed_run_model_id === reviewedId
      );
      if (review?.rationale) {
        const reviewer = models.find(m => m.id === reviewerId);
        const reviewed = models.find(m => m.id === reviewedId);
        setSelectedRationale({
          reviewer: reviewer?.display_name || 'Unknown',
          reviewed: reviewed?.display_name || 'Unknown',
          rationale: review.rationale,
          score: review.score,
        });
      }
    };

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Peer Review Phase</h2>
            <p className="text-sm text-text-secondary mt-1">
              Model evaluation scores from this session.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex items-center bg-bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'matrix'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Table2 className="w-4 h-4" />
                Matrix
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'chart'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Charts
              </button>
            </div>
            <ReplayModeIndicator />
          </div>
        </div>

        {/* No reviews message */}
        {replayPeerReviews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-bg-secondary rounded-lg border border-border">
            <XCircle className="w-12 h-12 text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No peer reviews recorded</h3>
            <p className="text-text-secondary text-sm">
              This session does not have peer review data available.
            </p>
          </div>
        )}

        {/* Main content */}
        {replayPeerReviews.length > 0 && (
          <>
            {viewMode === 'matrix' ? (
              <div className="bg-bg-secondary rounded-lg border border-border p-4">
                <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
                  <Table2 className="w-4 h-4" />
                  Rankings Matrix
                  <InfoTooltip text="Cross-reference of all peer reviews. Rows show responses being reviewed; columns show reviewers. Click any score to see the reviewer's detailed rationale." />
                </h3>
                <RankingsMatrix
                  peerReviews={replayPeerReviews}
                  models={models}
                  onCellClick={handleReplayCellClick}
                />
                <p className="text-xs text-text-muted mt-4">
                  Click on a score to view the reviewer's rationale
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-bg-secondary rounded-lg border border-border p-4">
                  <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Average Scores by Response
                    <InfoTooltip text="Mean score each response received from all peer reviewers." />
                  </h3>
                  <AgreementChart peerReviews={replayPeerReviews} models={models} chartType="bar" />
                </div>
                <div className="bg-bg-secondary rounded-lg border border-border p-4">
                  <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Score Distribution
                    <InfoTooltip text="Histogram showing how scores were distributed across all reviews." />
                  </h3>
                  <ScoreDistribution peerReviews={replayPeerReviews} />
                </div>
                <div className="bg-bg-secondary rounded-lg border border-border p-4 lg:col-span-2">
                  <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Response Comparison
                    <InfoTooltip text="Radar plot comparing all responses on a 0-10 scale." />
                  </h3>
                  <AgreementChart peerReviews={replayPeerReviews} models={models} chartType="radar" />
                </div>
              </div>
            )}

            {/* Review Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-bg-secondary rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-text-primary">{replayPeerReviews.length}</div>
                <div className="text-sm text-text-muted">Total Reviews</div>
              </div>
              <div className="bg-bg-secondary rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-text-primary">
                  {models.filter(m => m.role !== 'synthesizer' && m.role !== 'chair').length}
                </div>
                <div className="text-sm text-text-muted">Reviewers</div>
              </div>
              <div className="bg-bg-secondary rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-green-500">
                  {replayPeerReviews.length > 0
                    ? (replayPeerReviews.reduce((sum, r) => sum + r.score, 0) / replayPeerReviews.length).toFixed(1)
                    : '-'}
                </div>
                <div className="text-sm text-text-muted">Avg Score</div>
              </div>
              <div className="bg-bg-secondary rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-accent">
                  {replayPeerReviews.filter(r => r.rationale).length}
                </div>
                <div className="text-sm text-text-muted">With Rationale</div>
              </div>
            </div>
          </>
        )}

        {/* Replay Navigation */}
        <div className="flex justify-center pt-4">
          <ReplayPhaseNavigation />
        </div>

        {/* Rationale Modal */}
        {selectedRationale && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedRationale(null)}
          >
            <div
              className="bg-bg-secondary rounded-lg border border-border max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  <h3 className="font-medium text-text-primary">Review Rationale</h3>
                </div>
                <button
                  onClick={() => setSelectedRationale(null)}
                  className="p-1 hover:bg-bg-tertiary rounded-md transition-colors"
                >
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">
                    <span className="font-medium text-text-primary">{selectedRationale.reviewer}</span>
                    {' reviewed '}
                    <span className="font-medium text-text-primary">{selectedRationale.reviewed}</span>
                  </span>
                  <span className="px-2 py-1 bg-accent/10 text-accent rounded font-mono font-medium">
                    {selectedRationale.score}/10
                  </span>
                </div>
                <div className="bg-bg-tertiary rounded-lg p-4">
                  <p className="text-text-primary whitespace-pre-wrap">
                    {selectedRationale.rationale}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
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

      // Extract peer reviews from the response
      if (data.peer_reviews) {
        setPeerReviews(data.peer_reviews);
      }
    } catch (err) {
      console.error('Failed to fetch run status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch run status');
    } finally {
      isFetchingRef.current = false;
    }
  }, [currentRunId]);

  // Use Supabase Realtime to detect changes
  useRealtimeRunStatus({
    runId: currentRunId,
    onUpdate: fetchRunStatus,
    enabled: runData?.current_phase === 3 && runData?.status === 'running',
  });

  // Initial fetch and fallback polling
  useEffect(() => {
    if (!currentRunId) return;

    // Initial fetch
    fetchRunStatus();

    // Fallback poll every 10 seconds (Realtime handles most updates)
    const interval = setInterval(() => {
      if (runData?.current_phase === 3 && runData?.status === 'running') {
        fetchRunStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [currentRunId, fetchRunStatus, runData?.current_phase, runData?.status]);

  // Get models from run data
  const models = runData?.models?.map(rm => ({
    id: rm.id,
    display_name: rm.display_name,
    role: rm.role === 'chair' ? 'synthesizer' : rm.role,
  })) || selectedModels.map(m => ({
    id: m.id,
    display_name: m.display_name || m.model_id,
    role: m.role,
  }));

  // Get phase 3 review outputs (raw review text from each model)
  const reviewOutputs = runData?.models
    ?.filter(rm => rm.role !== 'chair')
    .map(rm => {
      const phase3Output = rm.outputs?.find(o => o.phase === 3);
      return phase3Output ? {
        model_id: rm.id,
        display_name: rm.display_name,
        role: rm.role,
        content: phase3Output.content,
      } : null;
    })
    .filter(Boolean) || [];

  // Handle cell click to show rationale
  const handleCellClick = (reviewerId: string, reviewedId: string) => {
    const review = peerReviews.find(
      r => r.reviewer_run_model_id === reviewerId && r.reviewed_run_model_id === reviewedId
    );
    if (review?.rationale) {
      const reviewer = models.find(m => m.id === reviewerId);
      const reviewed = models.find(m => m.id === reviewedId);
      setSelectedRationale({
        reviewer: reviewer?.display_name || 'Unknown',
        reviewed: reviewed?.display_name || 'Unknown',
        rationale: review.rationale,
        score: review.score,
      });
    }
  };

  // Check if review phase is complete
  const isReviewComplete = runData?.current_phase && runData.current_phase >= 4;
  const isReviewInProgress = runData?.current_phase === 3 && runData?.status === 'running';

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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center glow-teal">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gradient">Peer Review Phase</h1>
            <p className="text-text-secondary mt-1">
              Models are evaluating and scoring each other's responses.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center glass-subtle rounded-xl p-1">
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'matrix'
                  ? 'bg-gradient-accent text-white shadow-glow-teal'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Table2 className="w-4 h-4" />
              Matrix
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'chart'
                  ? 'bg-gradient-accent text-white shadow-glow-teal'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Charts
            </button>
          </div>

          {/* Status badge */}
          {isReviewInProgress && (
            <GlowBadge variant="teal" pulse>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              Reviewing...
            </GlowBadge>
          )}
          {isReviewComplete && (
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

      {/* Loading state */}
      {isReviewInProgress && peerReviews.length === 0 && reviewOutputs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-bg-secondary rounded-lg border border-border">
          <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">Models are reviewing responses</h3>
          <p className="text-text-secondary text-sm">
            Each model is evaluating and scoring the other responses...
          </p>
        </div>
      )}

      {/* Fallback: Show raw review outputs when no peer reviews were parsed */}
      {peerReviews.length === 0 && reviewOutputs.length > 0 && !isReviewInProgress && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-500">
              Review scores could not be automatically parsed. Raw review outputs are shown below.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {reviewOutputs.map((output) => output && (
              <div key={output.model_id} className="bg-bg-secondary rounded-lg border border-border overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <div className={`w-3 h-3 rounded-full ${
                    output.role === 'thinker' ? 'bg-role-thinker' :
                    output.role === 'critic' ? 'bg-role-critic' :
                    output.role === 'devils_advocate' ? 'bg-role-devils-advocate' :
                    'bg-gray-500'
                  }`} />
                  <span className="font-medium text-text-primary">{output.display_name}</span>
                  <span className="text-xs text-text-muted">Review Output</span>
                </div>
                <div className="p-4">
                  <pre className="whitespace-pre-wrap text-sm text-text-primary font-sans">
                    {output.content}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      {peerReviews.length > 0 && (
        <>
          {viewMode === 'matrix' ? (
            <div className="bg-bg-secondary rounded-lg border border-border p-4">
              <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
                <Table2 className="w-4 h-4" />
                Rankings Matrix
                <InfoTooltip text="Cross-reference of all peer reviews. Rows show responses being reviewed; columns show reviewers. Click any score to see the reviewer's detailed rationale." />
              </h3>
              <RankingsMatrix
                peerReviews={peerReviews}
                models={models}
                onCellClick={handleCellClick}
              />
              <p className="text-xs text-text-muted mt-4">
                Click on a score to view the reviewer's rationale
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Average Scores Chart */}
              <div className="bg-bg-secondary rounded-lg border border-border p-4">
                <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Average Scores by Response
                  <InfoTooltip text="Mean score each response received from all peer reviewers. Higher scores indicate stronger responses as judged by the council." />
                </h3>
                <AgreementChart peerReviews={peerReviews} models={models} chartType="bar" />
              </div>

              {/* Score Distribution */}
              <div className="bg-bg-secondary rounded-lg border border-border p-4">
                <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Score Distribution
                  <InfoTooltip text="Histogram showing how scores were distributed across all reviews. A spread indicates diverse opinions; clustering suggests consensus." />
                </h3>
                <ScoreDistribution peerReviews={peerReviews} />
              </div>

              {/* Radar Chart */}
              <div className="bg-bg-secondary rounded-lg border border-border p-4 lg:col-span-2">
                <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Response Comparison
                  <InfoTooltip text="Radar plot comparing all responses on a 0-10 scale. Each axis represents a response; further from center indicates higher scores." />
                </h3>
                <AgreementChart peerReviews={peerReviews} models={models} chartType="radar" />
              </div>
            </div>
          )}

          {/* Review Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlassCard variant="subtle" padding="md" className="text-center">
              <div className="text-3xl font-bold font-display text-gradient">{peerReviews.length}</div>
              <div className="text-sm text-text-muted mt-1">Total Reviews</div>
            </GlassCard>
            <GlassCard variant="subtle" padding="md" className="text-center">
              <div className="text-3xl font-bold font-display text-text-primary">
                {models.filter(m => m.role !== 'synthesizer' && m.role !== 'chair').length}
              </div>
              <div className="text-sm text-text-muted mt-1">Reviewers</div>
            </GlassCard>
            <GlassCard variant="subtle" padding="md" className="text-center glow-teal">
              <div className="text-3xl font-bold font-display text-accent-success">
                {peerReviews.length > 0
                  ? (peerReviews.reduce((sum, r) => sum + r.score, 0) / peerReviews.length).toFixed(1)
                  : '-'}
              </div>
              <div className="text-sm text-text-muted mt-1">Avg Score</div>
            </GlassCard>
            <GlassCard variant="subtle" padding="md" className="text-center">
              <div className="text-3xl font-bold font-display text-accent-secondary">
                {peerReviews.filter(r => r.rationale).length}
              </div>
              <div className="text-sm text-text-muted mt-1">With Rationale</div>
            </GlassCard>
          </div>
        </>
      )}

      {/* Continue Button */}
      {isReviewComplete && (
        <div className="flex justify-end">
          <GradientButton
            onClick={() => setCurrentPhase('synthesis')}
            size="lg"
            glow={true}
            icon={<ChevronRight className="w-5 h-5" />}
          >
            Continue to Synthesis
          </GradientButton>
        </div>
      )}

      {/* Rationale Modal */}
      {selectedRationale && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedRationale(null)}
        >
          <div
            className="glass-strong rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-glass-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-semibold text-text-primary">Review Rationale</h3>
              </div>
              <button
                onClick={() => setSelectedRationale(null)}
                className="p-2 hover:bg-bg-tertiary/50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-sm">
                  <span className="font-medium text-text-primary">{selectedRationale.reviewer}</span>
                  {' reviewed '}
                  <span className="font-medium text-text-primary">{selectedRationale.reviewed}</span>
                </span>
                <GlowBadge variant="teal" size="lg">
                  {selectedRationale.score}/10
                </GlowBadge>
              </div>
              <div className="glass-subtle rounded-xl p-4">
                <p className="text-text-primary whitespace-pre-wrap leading-relaxed">
                  {selectedRationale.rationale}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
