/**
 * Analytics API functions
 */

import type {
  AnalyticsSummary,
  UsageAnalytics,
  CostAnalytics,
  ModelAnalytics,
  TimeRange,
} from '../types';

const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:8002';

/**
 * Check if current user is a platform administrator
 */
export async function checkPlatformAdmin(userId: string): Promise<boolean> {
  const response = await fetch(`${ORCHESTRATOR_URL}/api/admin/is-platform-admin`, {
    method: 'GET',
    headers: {
      'X-User-ID': userId,
    },
  });

  if (!response.ok) {
    console.error('Failed to check platform admin status');
    return false;
  }

  const data = await response.json();
  return data.is_platform_admin || false;
}

/**
 * Get analytics summary for dashboard header cards
 */
export async function getAnalyticsSummary(
  userId: string,
  orgId: string | null,
  timeRange: TimeRange = '30d'
): Promise<AnalyticsSummary> {
  const params = new URLSearchParams({ time_range: timeRange });
  if (orgId) {
    params.append('org_id', orgId);
  }

  const response = await fetch(`${ORCHESTRATOR_URL}/api/analytics/summary?${params}`, {
    method: 'GET',
    headers: {
      'X-User-ID': userId,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch summary' }));
    throw new Error(error.detail || 'Failed to fetch analytics summary');
  }

  return response.json();
}

/**
 * Get usage analytics with time series data
 */
export async function getUsageAnalytics(
  userId: string,
  orgId: string | null,
  timeRange: TimeRange = '30d'
): Promise<UsageAnalytics> {
  const params = new URLSearchParams({ time_range: timeRange });
  if (orgId) {
    params.append('org_id', orgId);
  }

  const response = await fetch(`${ORCHESTRATOR_URL}/api/analytics/usage?${params}`, {
    method: 'GET',
    headers: {
      'X-User-ID': userId,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch usage' }));
    throw new Error(error.detail || 'Failed to fetch usage analytics');
  }

  return response.json();
}

/**
 * Get cost breakdown analytics
 */
export async function getCostAnalytics(
  userId: string,
  orgId: string | null,
  timeRange: TimeRange = '30d'
): Promise<CostAnalytics> {
  const params = new URLSearchParams({ time_range: timeRange });
  if (orgId) {
    params.append('org_id', orgId);
  }

  const response = await fetch(`${ORCHESTRATOR_URL}/api/analytics/costs?${params}`, {
    method: 'GET',
    headers: {
      'X-User-ID': userId,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch costs' }));
    throw new Error(error.detail || 'Failed to fetch cost analytics');
  }

  return response.json();
}

/**
 * Get expanded user data with pagination (fetches both usage and cost endpoints)
 */
export async function getExpandedUsers(
  userId: string,
  orgId: string | null,
  timeRange: TimeRange = '30d',
  limit: number = 25,
  offset: number = 0
): Promise<{ usage: UsageAnalytics; costs: CostAnalytics }> {
  const params = new URLSearchParams({
    time_range: timeRange,
    user_limit: String(limit),
    user_offset: String(offset),
  });
  if (orgId) {
    params.append('org_id', orgId);
  }

  const headers = { 'X-User-ID': userId };

  const [usageRes, costsRes] = await Promise.all([
    fetch(`${ORCHESTRATOR_URL}/api/analytics/usage?${params}`, { headers }),
    fetch(`${ORCHESTRATOR_URL}/api/analytics/costs?${params}`, { headers }),
  ]);

  if (!usageRes.ok || !costsRes.ok) {
    throw new Error('Failed to fetch expanded user data');
  }

  return {
    usage: await usageRes.json(),
    costs: await costsRes.json(),
  };
}

/**
 * Get model performance analytics
 */
export async function getModelAnalytics(
  userId: string,
  orgId: string | null,
  timeRange: TimeRange = '30d'
): Promise<ModelAnalytics> {
  const params = new URLSearchParams({ time_range: timeRange });
  if (orgId) {
    params.append('org_id', orgId);
  }

  const response = await fetch(`${ORCHESTRATOR_URL}/api/analytics/models?${params}`, {
    method: 'GET',
    headers: {
      'X-User-ID': userId,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch models' }));
    throw new Error(error.detail || 'Failed to fetch model analytics');
  }

  return response.json();
}
