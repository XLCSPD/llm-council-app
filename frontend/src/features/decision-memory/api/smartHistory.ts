/**
 * Smart History API
 * Functions for pinning, archiving, and fetching organized session history
 */

import { supabase } from '@/lib/supabase';
import type { SmartHistorySession, HistoryFilter } from '../types';

// Helper to call untyped RPC functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc.bind(supabase) as any;

// =============================================================================
// FETCH SESSIONS
// =============================================================================

/**
 * Get sessions with smart grouping (pinned, today, yesterday, this week, earlier)
 */
export async function getSmartHistory(
  projectId: string,
  includeArchived: boolean = false,
  filters: Partial<Record<HistoryFilter, boolean>> = {}
): Promise<SmartHistorySession[]> {
  const filtersJson = JSON.stringify({
    rated: filters.rated || false,
    tagged: filters.tagged || false,
    completed: filters.completed || false,
    running: filters.running || false,
  });

  const { data, error } = await rpc('get_smart_history', {
    p_project_id: projectId,
    p_include_archived: includeArchived,
    p_filters: filtersJson,
  });

  if (error) {
    console.error('Failed to get smart history:', error);
    throw new Error(error.message);
  }

  return (data as SmartHistorySession[]) || [];
}

// =============================================================================
// PIN/UNPIN
// =============================================================================

/**
 * Pin a session to the top of the history
 */
export async function pinSession(sessionId: string): Promise<void> {
  const { error } = await rpc('pin_session', {
    p_session_id: sessionId,
  });

  if (error) {
    console.error('Failed to pin session:', error);
    throw new Error(error.message);
  }
}

/**
 * Unpin a session
 */
export async function unpinSession(sessionId: string): Promise<void> {
  const { error } = await rpc('unpin_session', {
    p_session_id: sessionId,
  });

  if (error) {
    console.error('Failed to unpin session:', error);
    throw new Error(error.message);
  }
}

/**
 * Reorder pinned sessions (drag-to-reorder)
 */
export async function reorderPinnedSessions(sessionIds: string[]): Promise<void> {
  const { error } = await rpc('reorder_pinned_sessions', {
    p_session_ids: sessionIds,
  });

  if (error) {
    console.error('Failed to reorder pinned sessions:', error);
    throw new Error(error.message);
  }
}

// =============================================================================
// ARCHIVE/RESTORE
// =============================================================================

/**
 * Archive a session
 */
export async function archiveSession(sessionId: string): Promise<void> {
  const { error } = await rpc('archive_session', {
    p_session_id: sessionId,
  });

  if (error) {
    console.error('Failed to archive session:', error);
    throw new Error(error.message);
  }
}

/**
 * Restore a session from archive
 */
export async function restoreSession(sessionId: string): Promise<void> {
  const { error } = await rpc('restore_session', {
    p_session_id: sessionId,
  });

  if (error) {
    console.error('Failed to restore session:', error);
    throw new Error(error.message);
  }
}

/**
 * Touch a session (update last_accessed_at)
 */
export async function touchSession(sessionId: string): Promise<void> {
  const { error } = await rpc('touch_session', {
    p_session_id: sessionId,
  });

  if (error) {
    // Non-critical, just log
    console.warn('Failed to touch session:', error);
  }
}
