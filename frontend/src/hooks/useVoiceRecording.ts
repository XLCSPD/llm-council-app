/**
 * useVoiceRecording - Custom hook for browser audio recording
 *
 * Manages MediaRecorder state for capturing audio from the user's microphone.
 * Handles permission requests, recording state, and audio blob creation.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

export type VoiceRecordingErrorType =
  | 'permission_denied'
  | 'no_microphone'
  | 'browser_unsupported'
  | 'recording_failed'
  | 'unknown';

export interface VoiceRecordingError {
  type: VoiceRecordingErrorType;
  message: string;
}

export interface UseVoiceRecordingOptions {
  /** Maximum recording duration in milliseconds. Default: 60000 (60 seconds) */
  maxDuration?: number;
  /** Callback when an error occurs */
  onError?: (error: VoiceRecordingError) => void;
  /** Callback when recording auto-stops due to max duration */
  onMaxDurationReached?: () => void;
}

export interface UseVoiceRecordingReturn {
  /** Whether currently recording */
  isRecording: boolean;
  /** Current recording duration in milliseconds */
  duration: number;
  /** Current error state */
  error: VoiceRecordingError | null;
  /** Microphone permission state */
  permissionState: PermissionState;
  /** Whether the browser supports audio recording */
  isSupported: boolean;
  /** Start recording audio */
  startRecording: () => Promise<void>;
  /** Stop recording and return the audio blob */
  stopRecording: () => Promise<Blob | null>;
  /** Cancel recording without returning data */
  cancelRecording: () => void;
  /** Request microphone permission */
  requestPermission: () => Promise<boolean>;
  /** Clear the current error */
  clearError: () => void;
}

/**
 * Get the best supported audio MIME type for the browser
 */
function getSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') {
    return 'audio/webm';
  }

  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/wav',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'audio/webm';
}

/**
 * Check if the browser supports audio recording
 */
function checkBrowserSupport(): boolean {
  return !!(
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  );
}

export function useVoiceRecording(
  options: UseVoiceRecordingOptions = {}
): UseVoiceRecordingReturn {
  const { maxDuration = 60000, onError, onMaxDurationReached } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<VoiceRecordingError | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const maxDurationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSupported = checkBrowserSupport();

  // Check permission state on mount
  useEffect(() => {
    if (!isSupported) {
      setPermissionState('unavailable');
      return;
    }

    // Try to check permission without prompting (not supported in all browsers)
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((result) => {
          setPermissionState(result.state as PermissionState);
          result.onchange = () => {
            setPermissionState(result.state as PermissionState);
          };
        })
        .catch(() => {
          // Firefox doesn't support permissions.query for microphone
          setPermissionState('prompt');
        });
    }
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleError = useCallback(
    (err: VoiceRecordingError) => {
      setError(err);
      onError?.(err);
    },
    [onError]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setDuration(0);
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      handleError({
        type: 'browser_unsupported',
        message: 'Your browser does not support audio recording.',
      });
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop the stream - we just wanted to check permission
      stream.getTracks().forEach((track) => track.stop());
      setPermissionState('granted');
      return true;
    } catch (err) {
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        handleError({
          type: 'permission_denied',
          message: 'Microphone access was denied. Please enable it in your browser settings.',
        });
      } else if (error.name === 'NotFoundError') {
        handleError({
          type: 'no_microphone',
          message: 'No microphone detected. Please connect a microphone and try again.',
        });
      } else {
        handleError({
          type: 'unknown',
          message: `Failed to access microphone: ${error.message}`,
        });
      }
      return false;
    }
  }, [isSupported, handleError]);

  const startRecording = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      handleError({
        type: 'browser_unsupported',
        message: 'Your browser does not support audio recording.',
      });
      return;
    }

    if (isRecording) {
      return;
    }

    clearError();
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermissionState('granted');

      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        handleError({
          type: 'recording_failed',
          message: 'Recording failed. Please try again.',
        });
        cleanup();
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Start duration tracking
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setDuration(elapsed);
      }, 100);

      // Set max duration timeout
      maxDurationTimeoutRef.current = setTimeout(() => {
        onMaxDurationReached?.();
        // Auto-stop will be handled by the component
      }, maxDuration);
    } catch (err) {
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        handleError({
          type: 'permission_denied',
          message: 'Microphone access was denied. Please enable it in your browser settings.',
        });
      } else if (error.name === 'NotFoundError') {
        handleError({
          type: 'no_microphone',
          message: 'No microphone detected. Please connect a microphone and try again.',
        });
      } else {
        handleError({
          type: 'recording_failed',
          message: `Failed to start recording: ${error.message}`,
        });
      }
    }
  }, [isSupported, isRecording, maxDuration, handleError, clearError, cleanup, onMaxDurationReached]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || !isRecording) {
      return null;
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        cleanup();
        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }, [isRecording, cleanup]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    chunksRef.current = [];
    cleanup();
  }, [isRecording, cleanup]);

  return {
    isRecording,
    duration,
    error,
    permissionState,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    requestPermission,
    clearError,
  };
}
