import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Run, RunModel, ModelOutput, PeerReview } from '@/types/database';

interface RunWithDetails extends Run {
  run_models: (RunModel & {
    model_outputs: ModelOutput[];
  })[];
  peer_reviews: PeerReview[];
}

interface UseRealtimeRunOptions {
  runId: string;
  onPhaseChange?: (phase: number) => void;
  onStatusChange?: (status: Run['status']) => void;
  onModelOutput?: (output: ModelOutput) => void;
  onPeerReview?: (review: PeerReview) => void;
}

export function useRealtimeRun({
  runId,
  onPhaseChange,
  onStatusChange,
  onModelOutput,
  onPeerReview,
}: UseRealtimeRunOptions) {
  const [run, setRun] = useState<RunWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial run data
  const fetchRun = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('runs')
        .select(`
          *,
          run_models (
            *,
            model_outputs (*)
          ),
          peer_reviews (*)
        `)
        .eq('id', runId)
        .single();

      if (fetchError) throw fetchError;
      setRun(data as RunWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch run'));
    } finally {
      setIsLoading(false);
    }
  }, [runId]);

  // Set up realtime subscriptions
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscriptions = async () => {
      // Fetch initial data
      await fetchRun();

      // Create channel for this run
      channel = supabase
        .channel(`run:${runId}`)
        // Subscribe to run updates
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'runs',
            filter: `id=eq.${runId}`,
          },
          (payload: RealtimePostgresChangesPayload<Run>) => {
            const newData = payload.new as Run;
            setRun((prev) => (prev ? { ...prev, ...newData } : null));

            if (onStatusChange && newData.status) {
              onStatusChange(newData.status);
            }
            if (onPhaseChange && newData.current_phase) {
              onPhaseChange(newData.current_phase);
            }
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
          (payload: RealtimePostgresChangesPayload<RunModel>) => {
            if (payload.eventType === 'UPDATE') {
              const updatedModel = payload.new as RunModel;
              setRun((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  run_models: prev.run_models.map((rm) =>
                    rm.id === updatedModel.id ? { ...rm, ...updatedModel } : rm
                  ),
                };
              });
            }
          }
        )
        // Subscribe to model_outputs (new outputs)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'model_outputs',
          },
          async (payload: RealtimePostgresChangesPayload<ModelOutput>) => {
            const newOutput = payload.new as ModelOutput;

            // Check if this output belongs to our run
            setRun((prev) => {
              if (!prev) return null;

              const modelIndex = prev.run_models.findIndex(
                (rm) => rm.id === newOutput.run_model_id
              );

              if (modelIndex === -1) return prev;

              const updatedModels = [...prev.run_models];
              const existingModel = updatedModels[modelIndex];
              if (!existingModel) return prev;

              updatedModels[modelIndex] = {
                ...existingModel,
                model_outputs: [...existingModel.model_outputs, newOutput],
              };

              return {
                ...prev,
                run_models: updatedModels,
              };
            });

            onModelOutput?.(newOutput);
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
          (payload: RealtimePostgresChangesPayload<PeerReview>) => {
            const newReview = payload.new as PeerReview;
            setRun((prev) =>
              prev ? { ...prev, peer_reviews: [...prev.peer_reviews, newReview] } : null
            );
            onPeerReview?.(newReview);
          }
        )
        .subscribe();
    };

    setupSubscriptions();

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [runId, fetchRun, onPhaseChange, onStatusChange, onModelOutput, onPeerReview]);

  return {
    run,
    isLoading,
    error,
    refetch: fetchRun,
  };
}
