/**
 * useAnalytics hook - manages analytics data fetching and state
 */

import { useState, useEffect, useCallback } from 'react';
import {
  checkPlatformAdmin,
  getAnalyticsSummary,
  getUsageAnalytics,
  getCostAnalytics,
  getModelAnalytics,
} from '../api/analytics';
import type {
  AnalyticsSummary,
  UsageAnalytics,
  CostAnalytics,
  ModelAnalytics,
  TimeRange,
  AnalyticsScope,
} from '../types';

interface UseAnalyticsOptions {
  userId: string;
  orgId: string | null;
  timeRange?: TimeRange;
}

interface UseAnalyticsReturn {
  // Data
  summary: AnalyticsSummary | null;
  usage: UsageAnalytics | null;
  costs: CostAnalytics | null;
  models: ModelAnalytics | null;

  // State
  loading: boolean;
  error: string | null;

  // Platform admin
  isPlatformAdmin: boolean;
  scope: AnalyticsScope;
  setScope: (scope: AnalyticsScope) => void;

  // Filters
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;

  // Actions
  refetch: () => Promise<void>;
}

export function useAnalytics({
  userId,
  orgId,
  timeRange: initialTimeRange = '30d',
}: UseAnalyticsOptions): UseAnalyticsReturn {
  // State
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [usage, setUsage] = useState<UsageAnalytics | null>(null);
  const [costs, setCosts] = useState<CostAnalytics | null>(null);
  const [models, setModels] = useState<ModelAnalytics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [scope, setScope] = useState<AnalyticsScope>('org');
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);

  // Determine effective org ID based on scope
  const effectiveOrgId = scope === 'platform' ? null : orgId;

  // Check platform admin status
  useEffect(() => {
    if (!userId) return;

    checkPlatformAdmin(userId)
      .then(setIsPlatformAdmin)
      .catch(() => setIsPlatformAdmin(false));
  }, [userId]);

  // Fetch all analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!userId) return;

    // For org scope, we need an org ID
    if (scope === 'org' && !orgId) {
      setError('No organization selected');
      setLoading(false);
      return;
    }

    // For platform scope, user must be platform admin
    if (scope === 'platform' && !isPlatformAdmin) {
      setError('Platform analytics requires admin access');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [summaryData, usageData, costsData, modelsData] = await Promise.all([
        getAnalyticsSummary(userId, effectiveOrgId, timeRange),
        getUsageAnalytics(userId, effectiveOrgId, timeRange),
        getCostAnalytics(userId, effectiveOrgId, timeRange),
        getModelAnalytics(userId, effectiveOrgId, timeRange),
      ]);

      setSummary(summaryData);
      setUsage(usageData);
      setCosts(costsData);
      setModels(modelsData);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [userId, orgId, effectiveOrgId, timeRange, scope, isPlatformAdmin]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Handle scope change
  const handleSetScope = useCallback((newScope: AnalyticsScope) => {
    // Only allow platform scope if user is platform admin
    if (newScope === 'platform' && !isPlatformAdmin) {
      return;
    }
    setScope(newScope);
  }, [isPlatformAdmin]);

  return {
    summary,
    usage,
    costs,
    models,
    loading,
    error,
    isPlatformAdmin,
    scope,
    setScope: handleSetScope,
    timeRange,
    setTimeRange,
    refetch: fetchAnalytics,
  };
}
