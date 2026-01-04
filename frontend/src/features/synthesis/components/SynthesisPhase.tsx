import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Crown,
  FileText,
  Copy,
  Check,
  Download,
  RefreshCw,
  Clock,
  Sparkles,
  Trophy,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSessionStore } from '@/store';
import { orchestratorApi } from '@/api/orchestrator';
import { useRealtimeRunStatus, useReplayMode } from '@/hooks';
import { ReplayModeIndicator, ReplayPhaseNavigation } from '@/components/replay';
import { GlassCard, GradientButton, GlowBadge } from '@/components/ui';
import { ConfidenceIndicator, ConfidenceBadge } from './ConfidenceIndicator';
import { KeyPoints } from './KeyPoints';
import { DownloadReportButton } from '@/features/pdf-export';

interface ModelOutput {
  id: string;
  phase: number;
  content: string;
  metadata?: {
    is_synthesis?: boolean;
    latency_ms?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  created_at: string;
}

interface RunModel {
  id: string;
  model_key: string;
  display_name: string;
  role: string;
  status: string;
  outputs?: ModelOutput[];
  latency_ms?: number;
  cost_usd?: number;
}

interface RunData {
  id: string;
  session_id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
  current_phase: number;
  models?: RunModel[];
  error?: { message: string };
}

interface ParsedSynthesis {
  summary: string;
  keyAgreements: string[];
  keyDisagreements: string[];
  confidenceLevel: string;
  confidenceScore: number;
  recommendations: string[];
  minorityOpinions: string[];
  rawContent: string;
}

function parseSynthesisContent(content: string): ParsedSynthesis {
  const result: ParsedSynthesis = {
    summary: '',
    keyAgreements: [],
    keyDisagreements: [],
    confidenceLevel: 'Medium',
    confidenceScore: 0.5,
    recommendations: [],
    minorityOpinions: [],
    rawContent: content,
  };

  // Try to parse JSON if content looks like JSON
  if (content.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.summary) result.summary = parsed.summary;
      if (parsed.key_agreements) result.keyAgreements = parsed.key_agreements;
      if (parsed.keyAgreements) result.keyAgreements = parsed.keyAgreements;
      if (parsed.key_disagreements) result.keyDisagreements = parsed.key_disagreements;
      if (parsed.keyDisagreements) result.keyDisagreements = parsed.keyDisagreements;
      if (parsed.confidence_level) result.confidenceLevel = parsed.confidence_level;
      if (parsed.confidenceLevel) result.confidenceLevel = parsed.confidenceLevel;
      if (parsed.confidence_score) result.confidenceScore = parsed.confidence_score;
      if (parsed.confidenceScore) result.confidenceScore = parsed.confidenceScore;
      if (parsed.recommendations) result.recommendations = parsed.recommendations;
      if (parsed.minority_opinions) result.minorityOpinions = parsed.minority_opinions;
      if (parsed.minorityOpinions) result.minorityOpinions = parsed.minorityOpinions;
      return result;
    } catch {
      // Not valid JSON, continue with text parsing
    }
  }

  // Try to parse structured sections with flexible header matching
  const sections = content.split(/(?=#{1,3}\s+)/);

  for (const section of sections) {
    const lowerSection = section.toLowerCase();
    const headerMatch = section.match(/^#{1,3}\s*(.+)/);
    const headerText = headerMatch?.[1]?.toLowerCase() || lowerSection.slice(0, 50);

    // Summary/Answer/Conclusion section
    if (headerText.match(/\b(summary|answer|conclusion|final|synthesis|response)\b/)) {
      const lines = section.split('\n').slice(1).join('\n').trim();
      result.summary = lines || section;
    }
    // Agreement section
    else if (headerText.match(/\b(agreement|consensus|points\s+of\s+agreement|shared)\b/)) {
      result.keyAgreements = extractBulletPoints(section);
    }
    // Disagreement section
    else if (headerText.match(/\b(disagreement|contention|conflict|difference|dispute|points\s+of\s+disagreement)\b/)) {
      result.keyDisagreements = extractBulletPoints(section);
    }
    // Confidence section
    else if (headerText.match(/\b(confidence|certainty|reliability)\b/)) {
      result.confidenceScore = parseConfidenceScore(section);
      result.confidenceLevel = scoreToLevel(result.confidenceScore);
    }
    // Recommendations section
    else if (headerText.match(/\b(recommendation|suggestion|next\s+step|action|advice)\b/)) {
      result.recommendations = extractBulletPoints(section);
    }
    // Minority opinions section
    else if (headerText.match(/\b(minority|dissent|alternative|outlier|caveat|concern)\b/)) {
      result.minorityOpinions = extractBulletPoints(section);
    }
  }

  // Try to extract confidence from anywhere in the content if not found
  if (result.confidenceScore === 0.5) {
    result.confidenceScore = parseConfidenceScore(content);
    result.confidenceLevel = scoreToLevel(result.confidenceScore);
  }

  // If no summary was parsed, try to extract first paragraph or use whole content
  if (!result.summary) {
    // Try to get first substantial paragraph
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 50);
    result.summary = paragraphs[0] || content;
  }

  return result;
}

function parseConfidenceScore(text: string): number {
  const lowerText = text.toLowerCase();

  // Try percentage match first (e.g., "85%", "0.85")
  const percentMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch?.[1]) {
    const percent = parseFloat(percentMatch[1]);
    return percent > 1 ? percent / 100 : percent;
  }

  // Try decimal match (e.g., "confidence: 0.85")
  const decimalMatch = lowerText.match(/confidence[:\s]+(\d+\.\d+)/);
  if (decimalMatch?.[1]) {
    return parseFloat(decimalMatch[1]);
  }

  // Try fraction match (e.g., "8/10", "8 out of 10")
  const fractionMatch = lowerText.match(/(\d+)\s*(?:\/|out\s+of)\s*10/);
  if (fractionMatch?.[1]) {
    return parseInt(fractionMatch[1], 10) / 10;
  }

  // Try word-based confidence levels
  if (lowerText.match(/\b(very\s+high|extremely\s+high|strong)\b/)) return 0.9;
  if (lowerText.match(/\bhigh\b/)) return 0.8;
  if (lowerText.match(/\b(moderate|medium)\b/)) return 0.6;
  if (lowerText.match(/\blow\b/)) return 0.35;
  if (lowerText.match(/\b(very\s+low|uncertain)\b/)) return 0.2;

  return 0.5; // Default to medium
}

function scoreToLevel(score: number): string {
  if (score >= 0.75) return 'High';
  if (score <= 0.35) return 'Low';
  return 'Medium';
}

function extractBulletPoints(text: string): string[] {
  const lines = text.split('\n');
  const points: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match bullet points: -, *, •, or numbered lists
    const bulletMatch = trimmed.match(/^(?:[-*•]|\d+[.)]\s*)\s*(.+)/);
    if (bulletMatch && bulletMatch[1]) {
      points.push(bulletMatch[1].trim());
    }
  }

  return points;
}

export function SynthesisPhase() {
  const { currentRunId, setCurrentPhase } = useSessionStore();
  const { isReplayMode, replayData, synthesisOutput: replaySynthesis, modelInfo, totalCost: replayTotalCost } = useReplayMode();
  const [runData, setRunData] = useState<RunData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const isFetchingRef = useRef(false);

  // Replay mode copy handler
  const handleReplayCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Replay mode export handler
  const handleReplayExport = (content: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synthesis-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render replay mode view
  if (isReplayMode && replayData) {
    const chairmanModel = modelInfo.find(m => m.role === 'synthesizer' || m.role === 'chair');
    const parsedReplaySynthesis = replaySynthesis ? parseSynthesisContent(replaySynthesis.content) : null;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Synthesis Phase
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Final synthesized answer from this session.
            </p>
          </div>
          <ReplayModeIndicator />
        </div>

        {/* Replay Navigation - visible at top for mobile accessibility */}
        <div className="flex justify-center">
          <ReplayPhaseNavigation />
        </div>

        {/* No synthesis message */}
        {!replaySynthesis && (
          <div className="flex flex-col items-center justify-center py-16 bg-bg-secondary rounded-lg border border-border">
            <XCircle className="w-12 h-12 text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No synthesis recorded</h3>
            <p className="text-text-secondary text-sm">
              This session does not have a synthesis output available.
            </p>
          </div>
        )}

        {/* Main synthesis content */}
        {parsedReplaySynthesis && (
          <div className="space-y-6">
            {/* Chairman info card */}
            {chairmanModel && (
              <div className="bg-bg-secondary rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="text-sm text-text-muted">Synthesized by</div>
                      <div className="font-medium text-text-primary">{chairmanModel.display_name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {parsedReplaySynthesis.confidenceScore > 0 && (
                      <ConfidenceBadge level={parsedReplaySynthesis.confidenceScore} />
                    )}
                    {replaySynthesis?.latency_ms && replaySynthesis.latency_ms > 0 && (
                      <div className="flex items-center gap-1.5 text-text-muted text-sm">
                        <Clock className="w-4 h-4" />
                        {(replaySynthesis.latency_ms / 1000).toFixed(1)}s
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Confidence indicator (full) */}
            {parsedReplaySynthesis.confidenceScore > 0 && (
              <div className="flex justify-center">
                <ConfidenceIndicator level={parsedReplaySynthesis.confidenceScore} size="lg" />
              </div>
            )}

            {/* Synthesis content */}
            <div className="bg-bg-secondary rounded-lg border border-border overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-text-muted" />
                  <h3 className="font-medium text-text-primary">Final Synthesis</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleReplayCopy(parsedReplaySynthesis.rawContent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors touch-target-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="hidden sm:inline">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReplayExport(parsedReplaySynthesis.rawContent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors touch-target-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  <DownloadReportButton
                    sessionData={replayData}
                    variant="compact"
                  />
                </div>
              </div>
              <div className="p-6">
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{parsedReplaySynthesis.rawContent}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Key points */}
            {(parsedReplaySynthesis.keyAgreements.length > 0 ||
              parsedReplaySynthesis.keyDisagreements.length > 0 ||
              parsedReplaySynthesis.minorityOpinions.length > 0) && (
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-3">Analysis Breakdown</h3>
                <KeyPoints
                  agreements={parsedReplaySynthesis.keyAgreements}
                  disagreements={parsedReplaySynthesis.keyDisagreements}
                  minorityOpinions={parsedReplaySynthesis.minorityOpinions}
                />
              </div>
            )}

            {/* Recommendations */}
            {parsedReplaySynthesis.recommendations.length > 0 && (
              <div className="bg-bg-secondary rounded-lg border border-border p-4">
                <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {parsedReplaySynthesis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-0.5 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-accent">{index + 1}</span>
                      </span>
                      <span className="text-text-primary text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stats */}
            {(replayTotalCost !== null || parsedReplaySynthesis) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {replayTotalCost !== null && replayTotalCost > 0 && (
                  <div className="bg-bg-secondary rounded-lg border border-accent/20 p-4 text-center">
                    <div className="text-2xl font-bold text-accent">
                      ${replayTotalCost.toFixed(4)}
                    </div>
                    <div className="text-sm text-text-muted">Total Cost</div>
                  </div>
                )}
                <div className="bg-bg-secondary rounded-lg border border-border p-4 text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {parsedReplaySynthesis.keyAgreements.length}
                  </div>
                  <div className="text-sm text-text-muted">Agreements</div>
                </div>
                <div className="bg-bg-secondary rounded-lg border border-border p-4 text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {parsedReplaySynthesis.keyDisagreements.length}
                  </div>
                  <div className="text-sm text-text-muted">Disagreements</div>
                </div>
                <div className="bg-bg-secondary rounded-lg border border-border p-4 text-center">
                  <div className="text-2xl font-bold text-text-primary flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-sm text-text-muted">Complete</div>
                </div>
              </div>
            )}
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
    enabled: runData?.current_phase === 4 && runData?.status === 'running',
  });

  // Initial fetch and fallback polling
  useEffect(() => {
    if (!currentRunId) return;

    // Initial fetch
    fetchRunStatus();

    // Fallback poll every 30 seconds (Realtime handles most updates)
    // Reduced frequency since Realtime is the primary update mechanism
    const interval = setInterval(() => {
      if (runData?.current_phase === 4 && runData?.status === 'running') {
        fetchRunStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentRunId, fetchRunStatus, runData?.current_phase, runData?.status]);

  // Get synthesis output
  const { chairman, synthesisOutput, parsedSynthesis, totalCost } = useMemo(() => {
    if (!runData?.models) {
      return { chairman: null, synthesisOutput: null, parsedSynthesis: null, totalCost: 0 };
    }

    // Find the chairman (chair role or first model)
    const chairman = runData.models.find(m => m.role === 'chair') || runData.models[0];

    // Find phase 4 output (synthesis)
    let synthesisOutput: ModelOutput | null = null;
    for (const model of runData.models) {
      const phase4Output = model.outputs?.find(o => o.phase === 4);
      if (phase4Output) {
        synthesisOutput = phase4Output;
        break;
      }
    }

    // Parse the synthesis content
    const parsedSynthesis = synthesisOutput
      ? parseSynthesisContent(synthesisOutput.content)
      : null;

    // Calculate total cost
    const totalCost = runData.models.reduce((sum, model) => sum + (model.cost_usd || 0), 0);

    return { chairman, synthesisOutput, parsedSynthesis, totalCost };
  }, [runData]);

  // Copy to clipboard
  const handleCopy = async () => {
    if (!parsedSynthesis?.rawContent) return;
    try {
      await navigator.clipboard.writeText(parsedSynthesis.rawContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Export as markdown
  const handleExport = () => {
    if (!parsedSynthesis?.rawContent) return;

    const blob = new Blob([parsedSynthesis.rawContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synthesis-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Check synthesis status
  const isSynthesisComplete = runData?.status === 'succeeded';
  const isSynthesisInProgress = runData?.current_phase === 4 && runData?.status === 'running';

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
          <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center glow-teal-strong">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gradient">Synthesis Phase</h1>
            <p className="text-text-secondary mt-1">
              The chairman synthesizes the council's deliberation into a final answer.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Status badge */}
          {isSynthesisInProgress && (
            <GlowBadge variant="teal" pulse>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              Synthesizing...
            </GlowBadge>
          )}
          {isSynthesisComplete && (
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
      {isSynthesisInProgress && !synthesisOutput && (
        <div className="flex flex-col items-center justify-center py-16 bg-bg-secondary rounded-lg border border-border">
          <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">Generating Synthesis</h3>
          <p className="text-text-secondary text-sm text-center max-w-md">
            The chairman is analyzing all responses and peer reviews to produce a comprehensive synthesis...
          </p>
        </div>
      )}

      {/* Main synthesis content */}
      {parsedSynthesis && (
        <div className="space-y-6">
          {/* Chairman info card */}
          {chairman && (
            <GlassCard variant="default" padding="lg" className="glow-teal">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-accent flex items-center justify-center">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">Synthesized by</div>
                    <div className="font-display font-semibold text-lg text-text-primary">{chairman.display_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {parsedSynthesis.confidenceScore > 0 && (
                    <ConfidenceBadge level={parsedSynthesis.confidenceScore} />
                  )}
                  {synthesisOutput?.metadata?.latency_ms && (
                    <div className="flex items-center gap-1.5 text-text-muted text-sm glass-subtle px-3 py-1.5 rounded-lg">
                      <Clock className="w-4 h-4" />
                      {(synthesisOutput.metadata.latency_ms / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          )}

          {/* Confidence indicator (full) */}
          {parsedSynthesis.confidenceScore > 0 && (
            <div className="flex justify-center">
              <ConfidenceIndicator level={parsedSynthesis.confidenceScore} size="lg" />
            </div>
          )}

          {/* Synthesis content */}
          <div className="bg-bg-secondary rounded-lg border border-border overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-text-muted" />
                <h3 className="font-medium text-text-primary">Final Synthesis</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors touch-target-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="hidden sm:inline">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors touch-target-sm"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                {runData?.session_id && (
                  <DownloadReportButton
                    sessionId={runData.session_id}
                    variant="compact"
                  />
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{parsedSynthesis.rawContent}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Key points */}
          {(parsedSynthesis.keyAgreements.length > 0 ||
            parsedSynthesis.keyDisagreements.length > 0 ||
            parsedSynthesis.minorityOpinions.length > 0) && (
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-3">Analysis Breakdown</h3>
              <KeyPoints
                agreements={parsedSynthesis.keyAgreements}
                disagreements={parsedSynthesis.keyDisagreements}
                minorityOpinions={parsedSynthesis.minorityOpinions}
              />
            </div>
          )}

          {/* Recommendations */}
          {parsedSynthesis.recommendations.length > 0 && (
            <div className="bg-bg-secondary rounded-lg border border-border p-4">
              <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {parsedSynthesis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-accent">{index + 1}</span>
                    </span>
                    <span className="text-text-primary text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stats */}
          {(synthesisOutput?.metadata || totalCost > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {totalCost > 0 && (
                <div className="bg-bg-secondary rounded-lg border border-accent/20 p-4 text-center">
                  <div className="text-2xl font-bold text-accent">
                    ${totalCost.toFixed(4)}
                  </div>
                  <div className="text-sm text-text-muted">Total Cost</div>
                </div>
              )}
              {synthesisOutput?.metadata?.total_tokens && (
                <div className="bg-bg-secondary rounded-lg border border-border p-4 text-center">
                  <div className="text-2xl font-bold text-text-primary">
                    {synthesisOutput.metadata.total_tokens.toLocaleString()}
                  </div>
                  <div className="text-sm text-text-muted">Total Tokens</div>
                </div>
              )}
              {synthesisOutput?.metadata?.latency_ms && (
                <div className="bg-bg-secondary rounded-lg border border-border p-4 text-center">
                  <div className="text-2xl font-bold text-text-primary">
                    {(synthesisOutput.metadata.latency_ms / 1000).toFixed(1)}s
                  </div>
                  <div className="text-sm text-text-muted">Generation Time</div>
                </div>
              )}
              <div className="bg-bg-secondary rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-green-500">
                  {parsedSynthesis.keyAgreements.length}
                </div>
                <div className="text-sm text-text-muted">Agreements</div>
              </div>
              <div className="bg-bg-secondary rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-red-500">
                  {parsedSynthesis.keyDisagreements.length}
                </div>
                <div className="text-sm text-text-muted">Disagreements</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isSynthesisComplete && (
        <GlassCard variant="subtle" padding="md">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <GradientButton
              variant="secondary"
              onClick={() => setCurrentPhase('setup')}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Start New Deliberation
            </GradientButton>
            <div className="flex items-center gap-3">
              <GlowBadge variant="success" size="lg">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Deliberation Complete
              </GlowBadge>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
