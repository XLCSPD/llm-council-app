/**
 * UserActivitySection - User activity and usage breakdown with expandable view
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { User, Zap, DollarSign, ChevronDown, ChevronUp, Search, Users, X, Loader2 } from 'lucide-react';
import type { UsageAnalytics, CostAnalytics, TopUser, UserCost, TimeRange } from '../types';
import { getExpandedUsers } from '../api/analytics';
import { useAuthStore } from '@/store';

interface UserActivitySectionProps {
  usage: UsageAnalytics;
  costs: CostAnalytics;
  orgId: string | null;
  timeRange: string;
}

interface MergedUser {
  user_id: string;
  email?: string;
  sessions: number;
  runs: number;
  cost: number;
}

const PAGE_SIZE = 25;

/** Truncate user ID for display */
function truncateId(id: string): string {
  return id.slice(0, 8) + '...';
}

/** Get display name for user (email or truncated ID) */
function getUserDisplay(userId: string, email?: string): string {
  if (email) return email;
  return truncateId(userId);
}

/** Merge usage and cost data for users */
function mergeUserData(topUsers: TopUser[], byUser: UserCost[]): MergedUser[] {
  const merged: MergedUser[] = topUsers.map((user) => {
    const costData = byUser.find((u) => u.user_id === user.user_id);
    return {
      user_id: user.user_id,
      email: user.email || costData?.email,
      sessions: user.session_count,
      runs: costData?.run_count || 0,
      cost: costData?.cost || 0,
    };
  });

  // Add any users from cost data not in usage data
  byUser.forEach((costUser) => {
    if (!merged.find((u) => u.user_id === costUser.user_id)) {
      merged.push({
        user_id: costUser.user_id,
        email: costUser.email,
        sessions: 0,
        runs: costUser.run_count,
        cost: costUser.cost,
      });
    }
  });

  // Sort by sessions (primary) then by cost (secondary)
  merged.sort((a, b) => b.sessions - a.sessions || b.cost - a.cost);

  return merged;
}

export function UserActivitySection({ usage, costs, orgId, timeRange }: UserActivitySectionProps) {
  const userId = useAuthStore((state) => state.user?.id);

  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<MergedUser[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalUserCount, setTotalUserCount] = useState(usage.total_user_count || 0);
  const [currentOffset, setCurrentOffset] = useState(0);

  // Base merged data from the initial analytics fetch (top 10)
  const baseMergedUsers = mergeUserData(usage.top_users, costs.by_user);

  // Format data for chart (top 8 from base data)
  const chartData = baseMergedUsers.slice(0, 8).map((user) => ({
    name: getUserDisplay(user.user_id, user.email),
    sessions: user.sessions,
    runs: user.runs,
  }));

  // Load expanded user data
  const handleExpand = useCallback(async () => {
    if (isExpanded) {
      setIsExpanded(false);
      setSearchQuery('');
      return;
    }

    if (!userId) return;
    setLoadingMore(true);
    try {
      const data = await getExpandedUsers(userId, orgId, timeRange as TimeRange, PAGE_SIZE, 0);
      const merged = mergeUserData(data.usage.top_users, data.costs.by_user);
      setExpandedUsers(merged);
      setTotalUserCount(data.usage.total_user_count);
      setCurrentOffset(PAGE_SIZE);
      setIsExpanded(true);
    } catch (err) {
      console.error('Failed to load expanded users:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [isExpanded, userId, orgId, timeRange]);

  // Load more users (pagination)
  const handleLoadMore = useCallback(async () => {
    if (!userId) return;
    setLoadingMore(true);
    try {
      const data = await getExpandedUsers(userId, orgId, timeRange as TimeRange, PAGE_SIZE, currentOffset);
      const merged = mergeUserData(data.usage.top_users, data.costs.by_user);
      setExpandedUsers((prev) => [...prev, ...merged]);
      setCurrentOffset((prev) => prev + PAGE_SIZE);
    } catch (err) {
      console.error('Failed to load more users:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, orgId, timeRange, currentOffset]);

  // Determine which users to display
  const activeUsers = isExpanded ? expandedUsers : baseMergedUsers.slice(0, 10);
  const displayedUsers = searchQuery
    ? activeUsers.filter(
        (u) =>
          u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.user_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeUsers;

  const hasMore = isExpanded && currentOffset < totalUserCount && !searchQuery;

  if (baseMergedUsers.length === 0) {
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

      {/* User Details Header with Expand Toggle */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text-secondary">User Details</h3>
          {totalUserCount > 10 && (
            <button
              onClick={handleExpand}
              disabled={loadingMore && !isExpanded}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-teal-500/10 text-teal-300 border border-teal-500/20
                hover:bg-teal-500/20 hover:border-teal-500/30
                transition-all duration-200 disabled:opacity-50"
            >
              {loadingMore && !isExpanded ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Users className="w-3.5 h-3.5" />
              )}
              {isExpanded ? 'Show Top 10' : `View All ${totalUserCount} Users`}
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Search bar (only in expanded mode) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search by email or user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-subtle text-sm text-text-primary
                    placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-teal-500/30
                    transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Table */}
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
              <AnimatePresence mode="popLayout">
                {displayedUsers.map((user, index) => (
                  <motion.tr
                    key={user.user_id}
                    initial={isExpanded ? { opacity: 0, y: 8 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ delay: Math.min(index * 0.02, 0.5), duration: 0.2 }}
                    className="border-b border-glass-border/30 hover:bg-teal-500/5 transition-colors duration-150"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-text-primary truncate max-w-[200px]">
                            {user.email || truncateId(user.user_id)}
                          </div>
                          {user.email && (
                            <div className="text-xs text-text-tertiary font-mono">
                              {truncateId(user.user_id)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 tabular-nums text-text-primary">
                      {user.sessions}
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Zap className="w-3 h-3 text-text-tertiary" />
                        <span className="text-text-primary tabular-nums">{user.runs}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 pl-4">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="w-3 h-3 text-text-tertiary" />
                        <span className="font-mono text-accent-primary tabular-nums">
                          ${user.cost.toFixed(2)}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Empty search results */}
        {isExpanded && searchQuery && displayedUsers.length === 0 && (
          <div className="text-center py-6 text-text-tertiary text-sm">
            No users matching &ldquo;{searchQuery}&rdquo;
          </div>
        )}

        {/* Load More Button (expanded mode) */}
        <AnimatePresence>
          {hasMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center pt-4"
            >
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl
                  glass-subtle text-sm font-medium text-teal-300
                  hover:bg-teal-500/10 hover:border-teal-500/30
                  transition-all duration-200 disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Load More ({totalUserCount - currentOffset} remaining)
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User count summary */}
        {isExpanded && (
          <div className="text-center pt-2 text-xs text-text-muted">
            Showing {displayedUsers.length} of {totalUserCount} users
          </div>
        )}
      </div>
    </div>
  );
}
