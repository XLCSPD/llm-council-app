/**
 * UsageSection - Usage trends and activity metrics
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { UsageAnalytics } from '../types';

interface UsageSectionProps {
  data: UsageAnalytics;
}

export function UsageSection({ data }: UsageSectionProps) {
  const { daily_data, total_sessions, total_runs } = data;

  // Format date for display
  const formattedData = daily_data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-bg-tertiary/30">
          <div className="text-2xl font-bold text-text-primary">{total_sessions}</div>
          <div className="text-sm text-text-tertiary">Total Sessions</div>
        </div>
        <div className="p-4 rounded-lg bg-bg-tertiary/30">
          <div className="text-2xl font-bold text-text-primary">{total_runs}</div>
          <div className="text-sm text-text-tertiary">Total Runs</div>
        </div>
      </div>

      {/* Chart */}
      {formattedData.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '12px',
                }}
                labelStyle={{ color: '#f1f5f9' }}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                name="Sessions"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#14b8a6' }}
              />
              <Line
                type="monotone"
                dataKey="runs"
                name="Runs"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-text-tertiary">
          No usage data available for this period
        </div>
      )}
    </div>
  );
}
