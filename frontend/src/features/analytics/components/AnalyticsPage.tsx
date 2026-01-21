/**
 * AnalyticsPage - Main analytics dashboard page
 */

import { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/lib/supabase';
import { useAnalytics } from '../hooks/useAnalytics';
import { MetricCard } from './MetricCard';
import { UsageSection } from './UsageSection';
import { CostSection } from './CostSection';
import { ModelPerformanceSection } from './ModelPerformanceSection';
import type { TimeRange } from '../types';

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y', label: '1 year' },
];

export function AnalyticsPage() {
  const setCurrentView = useUIStore((state) => state.setCurrentView);
  const user = useAuthStore((state) => state.user);

  // Get user's org ID
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch user's org membership
    supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .then(({ data }) => {
        const result = data as { org_id: string }[] | null;
        if (result?.[0]) {
          setOrgId(result[0].org_id);
        }
        setLoadingOrg(false);
      });
  }, [user]);

  const {
    summary,
    usage,
    costs,
    models,
    loading,
    error,
    isPlatformAdmin,
    scope,
    setScope,
    timeRange,
    setTimeRange,
    refetch,
  } = useAnalytics({
    userId: user?.id || '',
    orgId,
  });

  if (loadingOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentView('deliberation')}
            className="p-2 rounded-xl hover:bg-bg-tertiary/50 transition-colors"
            aria-label="Back to deliberation"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-accent">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-display font-semibold text-text-primary">
              Analytics
            </h1>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Scope toggle (only for platform admins) */}
          {isPlatformAdmin && (
            <div className="flex rounded-lg bg-bg-tertiary/50 p-1">
              <button
                onClick={() => setScope('org')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  scope === 'org'
                    ? 'bg-accent-primary text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Organization
              </button>
              <button
                onClick={() => setScope('platform')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  scope === 'platform'
                    ? 'bg-accent-primary text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Platform
              </button>
            </div>
          )}

          {/* Time range selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-3 py-2 rounded-lg bg-bg-tertiary/50 border border-glass-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          >
            {TIME_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
          <button
            onClick={refetch}
            className="ml-4 text-sm underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
        </div>
      )}

      {/* Dashboard Content */}
      {!loading && summary && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Active Users"
              value={summary.active_users}
              icon="users"
            />
            <MetricCard
              title="Total Runs"
              value={summary.total_runs}
              icon="play"
            />
            <MetricCard
              title="Success Rate"
              value={`${summary.success_rate}%`}
              icon="check"
              valueColor={summary.success_rate >= 90 ? 'success' : summary.success_rate >= 70 ? 'warning' : 'error'}
            />
            <MetricCard
              title="Total Spend"
              value={`$${summary.total_cost.toFixed(2)}`}
              icon="dollar"
            />
          </div>

          {/* Usage Section */}
          {usage && (
            <GlassCard variant="default" padding="lg">
              <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-accent rounded-full" />
                Usage Trends
              </h2>
              <UsageSection data={usage} />
            </GlassCard>
          )}

          {/* Model Performance Section */}
          {models && (
            <GlassCard variant="default" padding="lg">
              <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-accent rounded-full" />
                Model Performance
              </h2>
              <ModelPerformanceSection data={models} />
            </GlassCard>
          )}

          {/* Cost Section */}
          {costs && (
            <GlassCard variant="default" padding="lg">
              <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-accent rounded-full" />
                Cost Breakdown
              </h2>
              <CostSection data={costs} />
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
