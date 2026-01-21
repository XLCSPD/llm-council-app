/**
 * ModelPerformanceSection - Model usage and performance metrics
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import type { ModelAnalytics } from '../types';

interface ModelPerformanceSectionProps {
  data: ModelAnalytics;
}

const ROLE_COLORS: Record<string, string> = {
  thinker: '#14b8a6',
  critic: '#f59e0b',
  devils_advocate: '#ef4444',
  chair: '#6366f1',
  unknown: '#64748b',
};

const ROLE_LABELS: Record<string, string> = {
  thinker: 'Thinker',
  critic: 'Critic',
  devils_advocate: "Devil's Advocate",
  chair: 'Chair',
  unknown: 'Other',
};

export function ModelPerformanceSection({ data }: ModelPerformanceSectionProps) {
  const { models, role_distribution } = data;

  // Format model names for chart
  const chartData = models.slice(0, 8).map((m) => ({
    name: m.display_name.split('/').pop() || m.display_name,
    usage: m.usage_count,
    latency: m.avg_latency_ms,
    successRate: m.success_rate,
  }));

  return (
    <div className="space-y-6">
      {/* Role Distribution */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3">Role Distribution</h3>
        <div className="flex flex-wrap gap-3">
          {role_distribution.map((role) => (
            <div
              key={role.role}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-tertiary/30"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ROLE_COLORS[role.role] || ROLE_COLORS.unknown }}
              />
              <span className="text-sm text-text-primary">
                {ROLE_LABELS[role.role] || role.role}
              </span>
              <span className="text-sm font-medium text-text-secondary">
                {role.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Chart */}
      {chartData.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-3">Model Usage</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                />
                <Bar
                  dataKey="usage"
                  name="Runs"
                  fill="#14b8a6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Model Performance Table */}
      {models.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-3">Performance Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-text-tertiary border-b border-glass-border">
                  <th className="text-left py-2 pr-4">Model</th>
                  <th className="text-right py-2 px-4">Runs</th>
                  <th className="text-right py-2 px-4">Success</th>
                  <th className="text-right py-2 px-4">Avg Latency</th>
                  <th className="text-right py-2 pl-4">Cost</th>
                </tr>
              </thead>
              <tbody>
                {models.slice(0, 10).map((model) => (
                  <tr
                    key={model.model_key}
                    className="border-b border-glass-border/50 hover:bg-bg-tertiary/20"
                  >
                    <td className="py-3 pr-4">
                      <div className="font-medium text-text-primary truncate max-w-[200px]">
                        {model.display_name.split('/').pop() || model.display_name}
                      </div>
                      <div className="text-xs text-text-tertiary truncate max-w-[200px]">
                        {model.model_key}
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Zap className="w-3 h-3 text-text-tertiary" />
                        <span className="text-text-primary">{model.usage_count}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {model.success_rate >= 90 ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : model.success_rate >= 70 ? (
                          <CheckCircle className="w-3 h-3 text-yellow-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400" />
                        )}
                        <span
                          className={
                            model.success_rate >= 90
                              ? 'text-green-400'
                              : model.success_rate >= 70
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }
                        >
                          {model.success_rate}%
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3 text-text-tertiary" />
                        <span className="text-text-primary">
                          {model.avg_latency_ms > 1000
                            ? `${(model.avg_latency_ms / 1000).toFixed(1)}s`
                            : `${model.avg_latency_ms}ms`}
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-3 pl-4 font-mono text-accent-primary">
                      ${model.total_cost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {models.length === 0 && (
        <div className="text-center py-8 text-text-tertiary">
          No model data available for this period
        </div>
      )}
    </div>
  );
}
