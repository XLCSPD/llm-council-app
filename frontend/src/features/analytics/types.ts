/**
 * TypeScript types for analytics feature
 */

export interface AnalyticsSummary {
  active_users: number;
  total_sessions: number;
  total_runs: number;
  successful_runs: number;
  success_rate: number;
  total_cost: number;
}

export interface DailyDataPoint {
  date: string;
  sessions: number;
  runs: number;
}

export interface TopUser {
  user_id: string;
  session_count: number;
}

export interface UsageAnalytics {
  daily_data: DailyDataPoint[];
  top_users: TopUser[];
  total_sessions: number;
  total_runs: number;
}

export interface ModelCost {
  model_key: string;
  display_name: string;
  cost: number;
  count: number;
}

export interface UserCost {
  user_id: string;
  cost: number;
  run_count: number;
}

export interface DailyCost {
  date: string;
  cost: number;
}

export interface CostAnalytics {
  by_model: ModelCost[];
  by_user: UserCost[];
  by_day: DailyCost[];
  total: number;
}

export interface ModelPerformance {
  model_key: string;
  display_name: string;
  usage_count: number;
  success_rate: number;
  avg_latency_ms: number;
  total_cost: number;
}

export interface RoleDistribution {
  role: string;
  count: number;
}

export interface ModelAnalytics {
  models: ModelPerformance[];
  role_distribution: RoleDistribution[];
}

export type TimeRange = '7d' | '30d' | '90d' | '1y';

export type AnalyticsScope = 'org' | 'platform';

export interface AnalyticsFilters {
  orgId: string | null;
  timeRange: TimeRange;
}
