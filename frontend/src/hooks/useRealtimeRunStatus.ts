import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeRunStatusOptions {
  runId: string | null;
  onUpdate: () => void;
  enabled?: boolean;
}

/**
 * Hook that subscribes to Supabase Realtime for run status changes.
 * Instead of polling, this detects changes in real-time and triggers
 * a callback to refresh data from the orchestrator.
 */
export function useRealtimeRunStatus({
  runId,
  onUpdate,
  enabled = true,
}: UseRealtimeRunStatusOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onUpdateRef = useRef(onUpdate);

  // Keep callback ref up to date
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const setupSubscription = useCallback(() => {
    if (!runId || !enabled) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create channel for this run
    channelRef.current = supabase
      .channel(`run-status:${runId}`)
      // Subscribe to run updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'runs',
          filter: `id=eq.${runId}`,
        },
        () => {
          onUpdateRef.current();
        }
      )
      // Subscribe to run_models updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'run_models',
          filter: `run_id=eq.${runId}`,
        },
        () => {
          onUpdateRef.current();
        }
      )
      // Subscribe to model_outputs inserts
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'model_outputs',
        },
        () => {
          // Model outputs don't have run_id directly, so we trigger update
          // and let the caller filter
          onUpdateRef.current();
        }
      )
      // Subscribe to peer_reviews
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'peer_reviews',
          filter: `run_id=eq.${runId}`,
        },
        () => {
          onUpdateRef.current();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to run ${runId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] Channel error for run ${runId}`);
        }
      });
  }, [runId, enabled]);

  // Set up subscription when runId changes
  useEffect(() => {
    setupSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [setupSubscription]);

  return {
    isSubscribed: !!channelRef.current,
  };
}
