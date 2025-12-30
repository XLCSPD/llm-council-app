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

const COLORS = {
  thinker: '#3B82F6',      // blue
  critic: '#F59E0B',       // amber
  devils_advocate: '#EF4444', // red
  chair: '#8B5CF6',        // purple
  default: '#6B7280',      // gray
};

function getModelColor(role: string): string {
  return COLORS[role as keyof typeof COLORS] || COLORS.default;
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
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 10]}
            tick={{ fill: '#6B7280', fontSize: 10 }}
          />
          <Radar
            name="Average Score"
            dataKey="avgScore"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.3}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#F3F4F6' }}
            formatter={(value: number) => [`${value}/10`, 'Score']}
          />
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
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
        <XAxis
          type="number"
          domain={[0, 10]}
          tick={{ fill: '#9CA3AF' }}
          axisLine={{ stroke: '#374151' }}
          tickLine={{ stroke: '#374151' }}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={{ stroke: '#374151' }}
          width={100}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#F3F4F6' }}
          formatter={(value: number, name: string) => {
            if (name === 'avgScore') return [`${value}/10`, 'Average Score'];
            return [value, name];
          }}
          labelFormatter={(label, payload) => {
            if (payload?.[0]?.payload?.fullName) {
              return payload[0].payload.fullName;
            }
            return label;
          }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => <span style={{ color: '#9CA3AF' }}>{value}</span>}
        />
        <Bar
          dataKey="avgScore"
          name="Average Score"
          radius={[0, 4, 4, 0]}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getModelColor(entry.role)} />
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
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="score"
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          axisLine={{ stroke: '#374151' }}
        />
        <YAxis
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          axisLine={{ stroke: '#374151' }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#F3F4F6' }}
          formatter={(value: number) => [value, 'Reviews']}
          labelFormatter={(label) => `Score: ${label}/10`}
        />
        <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
