/**
 * useSmartHistory Hook
 * Manages smart history state with temporal grouping, filtering, and actions
 */

import { useState, useCallback, useMemo } from 'react';
import {
  startOfDay,
  startOfWeek,
  subDays,
  format,
} from 'date-fns';
import {
  getSmartHistory,
  pinSession as apiPinSession,
  unpinSession as apiUnpinSession,
  reorderPinnedSessions,
  archiveSession as apiArchiveSession,
  restoreSession as apiRestoreSession,
} from '../api/smartHistory';
import type {
  SmartHistorySession,
  GroupedSessions,
  ViewMode,
  HistoryFilter,
} from '../types';

interface UseSmartHistoryReturn {
  // State
  sessions: SmartHistorySession[];
  groupedSessions: GroupedSessions;
  isLoading: boolean;
  error: string | null;
  viewMode: ViewMode;
  activeFilters: Set<HistoryFilter>;
  expandedGroups: Set<string>;
  showArchived: boolean;

  // Actions
  loadSessions: (projectId: string) => Promise<void>;
  pinSession: (sessionId: string) => Promise<void>;
  unpinSession: (sessionId: string) => Promise<void>;
  reorderPinned: (sessionIds: string[]) => Promise<void>;
  archiveSession: (sessionId: string) => Promise<void>;
  restoreSession: (sessionId: string) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  toggleFilter: (filter: HistoryFilter) => void;
  toggleGroup: (groupId: string) => void;
  toggleArchived: () => void;
  refresh: () => Promise<void>;
}

export function useSmartHistory(projectId: string | null): UseSmartHistoryReturn {
  // State
  const [sessions, setSessions] = useState<SmartHistorySession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeFilters, setActiveFilters] = useState<Set<HistoryFilter>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['today', 'yesterday', 'this_week'])
  );
  const [showArchived, setShowArchived] = useState(false);

  // Group sessions by time
  const groupedSessions = useMemo(() => {
    return groupSessionsByTime(sessions);
  }, [sessions]);

  // Load sessions
  const loadSessions = useCallback(async (pid: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const filters: Partial<Record<HistoryFilter, boolean>> = {};
      activeFilters.forEach((f) => {
        filters[f] = true;
      });

      const data = await getSmartHistory(pid, showArchived, filters);
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, showArchived]);

  // Refresh current data
  const refresh = useCallback(async () => {
    if (projectId) {
      await loadSessions(projectId);
    }
  }, [projectId, loadSessions]);

  // Pin a session
  const pinSession = useCallback(async (sessionId: string) => {
    try {
      await apiPinSession(sessionId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pin session');
    }
  }, [refresh]);

  // Unpin a session
  const unpinSession = useCallback(async (sessionId: string) => {
    try {
      await apiUnpinSession(sessionId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpin session');
    }
  }, [refresh]);

  // Reorder pinned sessions
  const reorderPinned = useCallback(async (sessionIds: string[]) => {
    try {
      await reorderPinnedSessions(sessionIds);
      // Optimistic update - reorder locally
      setSessions((prev) => {
        const pinnedMap = new Map(
          sessionIds.map((id, index) => [id, index + 1])
        );
        return prev.map((s) =>
          s.is_pinned && pinnedMap.has(s.id)
            ? { ...s, pin_order: pinnedMap.get(s.id) ?? s.pin_order }
            : s
        ).sort((a, b) => {
          if (a.is_pinned && b.is_pinned) {
            return (a.pin_order ?? 0) - (b.pin_order ?? 0);
          }
          return 0;
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder');
      await refresh(); // Revert on error
    }
  }, [refresh]);

  // Archive a session
  const archiveSession = useCallback(async (sessionId: string) => {
    try {
      await apiArchiveSession(sessionId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive session');
    }
  }, [refresh]);

  // Restore a session
  const restoreSession = useCallback(async (sessionId: string) => {
    try {
      await apiRestoreSession(sessionId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore session');
    }
  }, [refresh]);

  // Toggle filter
  const toggleFilter = useCallback((filter: HistoryFilter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  }, []);

  // Toggle group expansion
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  // Toggle archived view
  const toggleArchived = useCallback(() => {
    setShowArchived((prev) => !prev);
  }, []);

  return {
    sessions,
    groupedSessions,
    isLoading,
    error,
    viewMode,
    activeFilters,
    expandedGroups,
    showArchived,
    loadSessions,
    pinSession,
    unpinSession,
    reorderPinned,
    archiveSession,
    restoreSession,
    setViewMode,
    toggleFilter,
    toggleGroup,
    toggleArchived,
    refresh,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function groupSessionsByTime(sessions: SmartHistorySession[]): GroupedSessions {
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = subDays(todayStart, 1);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday

  const pinned: SmartHistorySession[] = [];
  const today: SmartHistorySession[] = [];
  const yesterday: SmartHistorySession[] = [];
  const thisWeek: SmartHistorySession[] = [];
  const earlierMap = new Map<string, SmartHistorySession[]>();

  for (const session of sessions) {
    // Pinned sessions go to their own group
    if (session.is_pinned) {
      pinned.push(session);
      continue;
    }

    const createdAt = new Date(session.created_at);

    if (createdAt >= todayStart) {
      today.push(session);
    } else if (createdAt >= yesterdayStart) {
      yesterday.push(session);
    } else if (createdAt >= weekStart) {
      thisWeek.push(session);
    } else {
      // Group by month
      const monthKey = format(createdAt, 'MMM yyyy');
      if (!earlierMap.has(monthKey)) {
        earlierMap.set(monthKey, []);
      }
      earlierMap.get(monthKey)!.push(session);
    }
  }

  // Sort pinned by pin_order
  pinned.sort((a, b) => (a.pin_order ?? 0) - (b.pin_order ?? 0));

  return {
    pinned,
    today,
    yesterday,
    thisWeek,
    earlier: earlierMap,
  };
}

/**
 * Get display label for a time group
 */
export function getGroupLabel(groupId: string): string {
  switch (groupId) {
    case 'pinned':
      return 'Pinned';
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case 'this_week':
      return 'This Week';
    default:
      return groupId; // 'Nov 2024' etc.
  }
}

/**
 * Get icon for a time group
 */
export function getGroupIcon(groupId: string): string {
  switch (groupId) {
    case 'pinned':
      return '📌';
    case 'today':
      return '🔥';
    case 'yesterday':
      return '📅';
    case 'this_week':
      return '📆';
    default:
      return '📁';
  }
}
