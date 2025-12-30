import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PeerReview {
  reviewer_run_model_id: string;
  reviewed_run_model_id: string;
  score: number;
  rationale?: string;
}

interface ModelInfo {
  id: string;
  display_name: string;
  role: string;
}

interface RankingsMatrixProps {
  peerReviews: PeerReview[];
  models: ModelInfo[];
  onCellClick?: (reviewerId: string, reviewedId: string) => void;
}

const roleColors: Record<string, string> = {
  thinker: 'bg-role-thinker',
  critic: 'bg-role-critic',
  devils_advocate: 'bg-role-devils-advocate',
  chair: 'bg-role-synthesizer',
};

function getScoreColor(score: number): string {
  if (score >= 8) return 'bg-green-500/20 text-green-400';
  if (score >= 6) return 'bg-yellow-500/20 text-yellow-400';
  if (score >= 4) return 'bg-orange-500/20 text-orange-400';
  return 'bg-red-500/20 text-red-400';
}

function getScoreBgIntensity(score: number): string {
  const intensity = Math.round((score / 10) * 100);
  return `rgba(34, 197, 94, ${intensity / 100 * 0.3})`;
}

export function RankingsMatrix({ peerReviews, models, onCellClick }: RankingsMatrixProps) {
  // Build matrix data
  const { matrix, reviewers, reviewed, averages, consensusScores } = useMemo(() => {
    // Get unique reviewers and reviewed models
    const reviewerIds = [...new Set(peerReviews.map(r => r.reviewer_run_model_id))];
    const reviewedIds = [...new Set(peerReviews.map(r => r.reviewed_run_model_id))];

    // Map to model info
    const reviewers = reviewerIds.map(id => models.find(m => m.id === id)).filter(Boolean) as ModelInfo[];
    const reviewed = reviewedIds.map(id => models.find(m => m.id === id)).filter(Boolean) as ModelInfo[];

    // Build score matrix
    const matrix: Record<string, Record<string, number | null>> = {};
    for (const reviewedModel of reviewed) {
      matrix[reviewedModel.id] = {};
      for (const reviewer of reviewers) {
        const review = peerReviews.find(
          r => r.reviewer_run_model_id === reviewer.id && r.reviewed_run_model_id === reviewedModel.id
        );
        matrix[reviewedModel.id]![reviewer.id] = review?.score ?? null;
      }
    }

    // Calculate averages for each reviewed model
    const averages: Record<string, number> = {};
    for (const reviewedModel of reviewed) {
      const modelMatrix = matrix[reviewedModel.id] ?? {};
      const scores = reviewers
        .map(r => modelMatrix[r.id])
        .filter((s): s is number => s !== null);
      averages[reviewedModel.id] = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
    }

    // Calculate consensus scores (lower variance = higher consensus)
    const consensusScores: Record<string, number> = {};
    for (const reviewedModel of reviewed) {
      const modelMatrix = matrix[reviewedModel.id] ?? {};
      const scores = reviewers
        .map(r => modelMatrix[r.id])
        .filter((s): s is number => s !== null);
      if (scores.length > 1) {
        const avg = averages[reviewedModel.id] ?? 0;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
        const maxVariance = 25; // Max variance for 0-10 scale
        consensusScores[reviewedModel.id] = Math.max(0, 1 - variance / maxVariance);
      } else {
        consensusScores[reviewedModel.id] = 1;
      }
    }

    return { matrix, reviewers, reviewed, averages, consensusScores };
  }, [peerReviews, models]);

  // Sort reviewed models by average score
  const sortedReviewed = [...reviewed].sort((a, b) => (averages[b.id] ?? 0) - (averages[a.id] ?? 0));

  if (reviewers.length === 0 || reviewed.length === 0) {
    return (
      <div className="p-6 text-center text-text-muted">
        No peer review data available yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-3 text-left text-sm font-medium text-text-secondary border-b border-border">
              Response
            </th>
            {reviewers.map(reviewer => (
              <th
                key={reviewer.id}
                className="p-3 text-center text-sm font-medium text-text-secondary border-b border-border min-w-[100px]"
              >
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${roleColors[reviewer.role] || 'bg-gray-500'}`} />
                  <span className="truncate max-w-[80px]" title={reviewer.display_name}>
                    {reviewer.display_name}
                  </span>
                </div>
              </th>
            ))}
            <th className="p-3 text-center text-sm font-medium text-text-secondary border-b border-border min-w-[80px]">
              Average
            </th>
            <th className="p-3 text-center text-sm font-medium text-text-secondary border-b border-border min-w-[100px]">
              Consensus
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedReviewed.map((reviewedModel, rowIndex) => {
            const avg = averages[reviewedModel.id] ?? 0;
            const consensus = consensusScores[reviewedModel.id] ?? 0;
            const isTopRanked = rowIndex === 0;
            const isBottomRanked = rowIndex === sortedReviewed.length - 1 && sortedReviewed.length > 1;
            const modelMatrix = matrix[reviewedModel.id] ?? {};

            return (
              <tr
                key={reviewedModel.id}
                className={`border-b border-border/50 hover:bg-bg-tertiary/50 transition-colors
                  ${isTopRanked ? 'bg-green-500/5' : ''}
                  ${isBottomRanked ? 'bg-red-500/5' : ''}`}
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${roleColors[reviewedModel.role] || 'bg-gray-500'}`} />
                    <span className="font-medium text-text-primary">{reviewedModel.display_name}</span>
                    {isTopRanked && <TrendingUp className="w-4 h-4 text-green-500" />}
                    {isBottomRanked && <TrendingDown className="w-4 h-4 text-red-500" />}
                  </div>
                </td>
                {reviewers.map(reviewer => {
                  const score = modelMatrix[reviewer.id];
                  const isSelf = reviewer.id === reviewedModel.id;

                  return (
                    <td
                      key={reviewer.id}
                      className={`p-3 text-center ${onCellClick && !isSelf ? 'cursor-pointer hover:bg-bg-tertiary' : ''}`}
                      onClick={() => !isSelf && onCellClick?.(reviewer.id, reviewedModel.id)}
                      style={score != null ? { backgroundColor: getScoreBgIntensity(score) } : undefined}
                    >
                      {isSelf ? (
                        <span className="text-text-muted">-</span>
                      ) : score != null ? (
                        <span className={`font-mono font-semibold ${getScoreColor(score).split(' ')[1]}`}>
                          {score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="p-3 text-center">
                  <span className={`font-mono font-bold text-lg ${getScoreColor(avg).split(' ')[1]}`}>
                    {avg.toFixed(1)}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-16 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          consensus >= 0.8 ? 'bg-green-500' :
                          consensus >= 0.5 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${consensus * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-muted">
                      {Math.round(consensus * 100)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
