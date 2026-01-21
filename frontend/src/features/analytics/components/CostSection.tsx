/**
 * CostSection - Cost breakdown analytics
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { CostAnalytics } from '../types';

interface CostSectionProps {
  data: CostAnalytics;
}

const COLORS = [
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function CostSection({ data }: CostSectionProps) {
  const { by_model, by_day, total } = data;

  // Format model data for pie chart (top 6)
  const pieData = by_model.slice(0, 6).map((m, i) => ({
    name: m.display_name.split('/').pop() || m.display_name,
    value: m.cost,
    color: COLORS[i % COLORS.length],
  }));

  // Format daily data for bar chart
  const dailyData = by_day.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    cost: d.cost,
  }));

  return (
    <div className="space-y-6">
      {/* Total cost highlight */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20">
        <div className="text-3xl font-bold text-text-primary">
          ${total.toFixed(2)}
        </div>
        <div className="text-sm text-text-tertiary">Total Spend</div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Cost by Model (Pie Chart) */}
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-4">By Model</h3>
          {pieData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                    formatter={(value: number) => [`$${value.toFixed(4)}`, 'Cost']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-text-tertiary">
              No cost data
            </div>
          )}
          {/* Legend */}
          <div className="mt-2 space-y-1">
            {pieData.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-text-tertiary truncate">{item.name}</span>
                <span className="text-text-secondary ml-auto">
                  ${item.value.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Cost Trend (Bar Chart) */}
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-4">Daily Spend</h3>
          {dailyData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v.toFixed(2)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                    formatter={(value: number) => [`$${value.toFixed(4)}`, 'Cost']}
                  />
                  <Bar
                    dataKey="cost"
                    fill="#14b8a6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-text-tertiary">
              No daily cost data
            </div>
          )}
        </div>
      </div>

      {/* Model breakdown table */}
      {by_model.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-3">Model Costs</h3>
          <div className="space-y-2">
            {by_model.slice(0, 8).map((model) => (
              <div
                key={model.model_key}
                className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="font-medium text-text-primary truncate">
                    {model.display_name.split('/').pop() || model.display_name}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {model.count} runs
                  </div>
                </div>
                <div className="font-mono text-accent-primary">
                  ${model.cost.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
