/**
 * UserActivitySection - User activity and usage breakdown
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
import { User, Zap, DollarSign } from 'lucide-react';
import type { UsageAnalytics, CostAnalytics } from '../types';

interface UserActivitySectionProps {
  usage: UsageAnalytics;
  costs: CostAnalytics;
}

/** Truncate user ID for display */
function truncateId(id: string): string {
  return id.slice(0, 8) + '...';
}

/** Get display name for user (email or truncated ID) */
function getUserDisplay(userId: string, email?: string): string {
  if (email) return email;
  return truncateId(userId);
}

export function UserActivitySection({ usage, costs }: UserActivitySectionProps) {
  const { top_users } = usage;
  const { by_user } = costs;

  // Merge usage and cost data by user
  const mergedUsers = top_users.map((user) => {
    const costData = by_user.find((u) => u.user_id === user.user_id);
    return {
      user_id: user.user_id,
      email: user.email || costData?.email,
      sessions: user.session_count,
      runs: costData?.run_count || 0,
      cost: costData?.cost || 0,
    };
  });

  // Add any users from cost data not in usage data
  by_user.forEach((costUser) => {
    if (!mergedUsers.find((u) => u.user_id === costUser.user_id)) {
      mergedUsers.push({
        user_id: costUser.user_id,
        email: costUser.email,
        sessions: 0,
        runs: costUser.run_count,
        cost: costUser.cost,
      });
    }
  });

  // Sort by sessions (primary) then by cost (secondary)
  mergedUsers.sort((a, b) => b.sessions - a.sessions || b.cost - a.cost);

  // Format data for chart
  const chartData = mergedUsers.slice(0, 8).map((user) => ({
    name: getUserDisplay(user.user_id, user.email),
    sessions: user.sessions,
    runs: user.runs,
  }));

  if (mergedUsers.length === 0) {
    return (
      <div className="text-center py-8 text-text-tertiary">
        No user activity data available for this period
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Activity Chart */}
      {chartData.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-3">Activity by User</h3>
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
                  width={150}
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
                  dataKey="sessions"
                  name="Sessions"
                  fill="#14b8a6"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="runs"
                  name="Runs"
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* User Details Table */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3">User Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-text-tertiary border-b border-glass-border">
                <th className="text-left py-2 pr-4">User</th>
                <th className="text-right py-2 px-4">Sessions</th>
                <th className="text-right py-2 px-4">Runs</th>
                <th className="text-right py-2 pl-4">Cost</th>
              </tr>
            </thead>
            <tbody>
              {mergedUsers.slice(0, 10).map((user) => (
                <tr
                  key={user.user_id}
                  className="border-b border-glass-border/50 hover:bg-bg-tertiary/20"
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-text-primary truncate max-w-[200px]">
                          {user.email || truncateId(user.user_id)}
                        </div>
                        {user.email && (
                          <div className="text-xs text-text-tertiary">
                            {truncateId(user.user_id)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-text-primary">{user.sessions}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Zap className="w-3 h-3 text-text-tertiary" />
                      <span className="text-text-primary">{user.runs}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 pl-4">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="w-3 h-3 text-text-tertiary" />
                      <span className="font-mono text-accent-primary">
                        ${user.cost.toFixed(2)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
