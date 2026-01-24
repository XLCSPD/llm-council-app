import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  TooltipProps,
} from 'recharts';

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

interface AgreementChartProps {
  peerReviews: PeerReview[];
  models: ModelInfo[];
  chartType?: 'bar' | 'radar';
}

// Brand-aligned colors matching the design system
const COLORS = {
  thinker: '#6366F1',      // indigo (role-thinker)
  critic: '#F59E0B',       // amber (role-critic)
  devils_advocate: '#EF4444', // red (role-devils-advocate)
  chair: '#0D9488',        // teal (role-synthesizer/accent)
  default: '#5EEAD4',      // cyan (accent-secondary)
};

function getModelColor(role: string): string {
  return COLORS[role as keyof typeof COLORS] || COLORS.default;
}

// Custom glass-styled tooltip component
function GlassTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;

  return (
    <div className="glass-strong rounded-lg p-3 shadow-xl border border-glass-border">
      <p className="font-display font-medium text-text-primary mb-1">
        {data?.fullName || label}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 mt-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: entry.color || '#5EEAD4' }}
          />
          <span className="text-text-secondary text-sm">
            {entry.value}/10
          </span>
        </div>
      ))}
      {data?.reviewCount && (
        <p className="text-text-muted text-xs mt-2">
          Based on {data.reviewCount} review{data.reviewCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

export function AgreementChart({ peerReviews, models, chartType = 'bar' }: AgreementChartProps) {
  const chartData = useMemo(() => {
    // Get reviewed models (excluding chair)
    const reviewedIds = [...new Set(peerReviews.map(r => r.reviewed_run_model_id))];
    const reviewedModels = reviewedIds
      .map(id => models.find(m => m.id === id))
      .filter(Boolean) as ModelInfo[];

    // Calculate stats for each reviewed model
    return reviewedModels.map(model => {
      const scores = peerReviews
        .filter(r => r.reviewed_run_model_id === model.id)
        .map(r => r.score);

      const avgScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

      const minScore = scores.length > 0 ? Math.min(...scores) : 0;
      const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
      const range = maxScore - minScore;

      // Truncate name for display
      const shortName = model.display_name.length > 12
        ? model.display_name.substring(0, 10) + '...'
        : model.display_name;

      return {
        name: shortName,
        fullName: model.display_name,
        avgScore: Number(avgScore.toFixed(1)),
        minScore,
        maxScore,
        range,
        role: model.role,
        reviewCount: scores.length,
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [peerReviews, models]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-text-muted">
        No review data available
      </div>
    );
  }

  if (chartType === 'radar') {
    return (
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={chartData}>
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5EEAD4" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#0D9488" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: '#94A3B8', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 10]}
            tick={{ fill: '#64748B', fontSize: 10 }}
          />
          <Radar
            name="Average Score"
            dataKey="avgScore"
            stroke="#5EEAD4"
            strokeWidth={2}
            fill="url(#radarGradient)"
            style={{ filter: 'drop-shadow(0 0 8px rgba(94, 234, 212, 0.3))' }}
          />
          <Tooltip content={<GlassTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  // Default: Bar chart
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="barGradientDefault" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#5EEAD4" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" horizontal={true} vertical={false} />
        <XAxis
          type="number"
          domain={[0, 10]}
          tick={{ fill: '#94A3B8' }}
          axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
          tickLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#94A3B8', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
          tickLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
          width={100}
        />
        <Tooltip content={<GlassTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => <span style={{ color: '#94A3B8' }}>{value}</span>}
        />
        <Bar
          dataKey="avgScore"
          name="Average Score"
          radius={[0, 6, 6, 0]}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getModelColor(entry.role)}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface ScoreDistributionProps {
  peerReviews: PeerReview[];
}

export function ScoreDistribution({ peerReviews }: ScoreDistributionProps) {
  const distributionData = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let i = 0; i <= 10; i++) {
      buckets[i.toString()] = 0;
    }

    for (const review of peerReviews) {
      const bucket = Math.round(review.score);
      buckets[bucket.toString()] = (buckets[bucket.toString()] || 0) + 1;
    }

    return Object.entries(buckets).map(([score, count]) => ({
      score: Number(score),
      count,
    }));
  }, [peerReviews]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={distributionData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <defs>
          <linearGradient id="distributionGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
        <XAxis
          dataKey="score"
          tick={{ fill: '#94A3B8', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
        />
        <YAxis
          tick={{ fill: '#94A3B8', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
          allowDecimals={false}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="glass-strong rounded-lg p-3 shadow-xl border border-glass-border">
                <p className="font-display font-medium text-text-primary">
                  Score: {label}/10
                </p>
                <p className="text-text-secondary text-sm mt-1">
                  {payload[0]?.value} review{(payload[0]?.value as number) !== 1 ? 's' : ''}
                </p>
              </div>
            );
          }}
        />
        <Bar
          dataKey="count"
          fill="url(#distributionGradient)"
          radius={[4, 4, 0, 0]}
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
