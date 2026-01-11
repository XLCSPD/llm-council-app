/**
 * VoiceInputButton - Reusable voice input button component
 *
 * A microphone button that records audio and transcribes it to text.
 * Can be placed next to any text field for voice input capability.
 */

import { useState, useCallback, useEffect } from 'react';
import { Mic, MicOff, Square, Loader2, AlertCircle } from 'lucide-react';
import { useVoiceRecording, type VoiceRecordingError } from '@/hooks/useVoiceRecording';
import { orchestratorApi } from '@/api/orchestrator';

export interface VoiceInputButtonProps {
  /** Callback when transcription is complete */
  onTranscribe: (text: string) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Button size variant */
  size?: 'sm' | 'md';
  /** Maximum recording duration in ms (default: 60000) */
  maxDuration?: number;
}

/** Format milliseconds as MM:SS */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function VoiceInputButton({
  onTranscribe,
  disabled = false,
  className = '',
  size = 'sm',
  maxDuration = 60000,
}: VoiceInputButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleError = useCallback((error: VoiceRecordingError) => {
    setErrorMessage(error.message);
    setShowTooltip(true);
    // Auto-hide tooltip after 5 seconds
    setTimeout(() => setShowTooltip(false), 5000);
  }, []);

  const handleMaxDurationReached = useCallback(() => {
    // Will trigger stopRecording via the recording state
  }, []);

  const {
    isRecording,
    duration,
    error,
    permissionState,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError,
  } = useVoiceRecording({
    maxDuration,
    onError: handleError,
    onMaxDurationReached: handleMaxDurationReached,
  });

  // Auto-stop when max duration is reached
  useEffect(() => {
    if (isRecording && duration >= maxDuration) {
      handleStopRecording();
    }
  }, [duration, maxDuration, isRecording]);

  // Clear error when starting a new recording
  useEffect(() => {
    if (isRecording) {
      setErrorMessage(null);
      setShowTooltip(false);
    }
  }, [isRecording]);

  const handleStartRecording = async () => {
    clearError();
    setErrorMessage(null);
    await startRecording();
  };

  const handleStopRecording = async () => {
    const audioBlob = await stopRecording();
    if (!audioBlob) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await orchestratorApi.transcribe(audioBlob);
      if (result.text) {
        onTranscribe(result.text);
      } else {
        setErrorMessage('No speech detected. Please try again.');
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 5000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed. Please try again.';
      setErrorMessage(message);
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    if (isProcessing) return;

    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancelRecording();
    setErrorMessage(null);
  };

  // Determine button state and appearance
  const isDisabled = disabled || !isSupported || isProcessing;
  const hasError = !!errorMessage || !!error;

  const sizeClasses = size === 'sm'
    ? 'w-7 h-7 p-1.5'
    : 'w-9 h-9 p-2';

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  // Base button classes
  let buttonClasses = `
    relative flex items-center justify-center rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-accent/50
    ${sizeClasses}
    ${className}
  `;

  // State-specific styling
  if (isRecording) {
    buttonClasses += ' bg-red-500 text-white hover:bg-red-600 animate-pulse';
  } else if (isProcessing) {
    buttonClasses += ' bg-accent/20 text-accent cursor-wait';
  } else if (hasError) {
    buttonClasses += ' bg-red-500/10 text-red-500 hover:bg-red-500/20';
  } else if (permissionState === 'denied') {
    buttonClasses += ' bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
  } else if (isDisabled) {
    buttonClasses += ' bg-bg-tertiary text-text-muted cursor-not-allowed opacity-50';
  } else {
    buttonClasses += ' bg-bg-tertiary text-text-secondary hover:bg-accent/10 hover:text-accent';
  }

  // Tooltip content
  let tooltipContent = '';
  if (!isSupported) {
    tooltipContent = 'Voice input not supported in this browser';
  } else if (permissionState === 'denied') {
    tooltipContent = 'Microphone access denied. Click to request again.';
  } else if (errorMessage) {
    tooltipContent = errorMessage;
  } else if (isRecording) {
    tooltipContent = 'Click to stop recording';
  } else if (isProcessing) {
    tooltipContent = 'Transcribing...';
  } else {
    tooltipContent = 'Click to record voice input';
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={buttonClasses}
        title={tooltipContent}
        aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
      >
        {isProcessing ? (
          <Loader2 className={`${iconSize} animate-spin`} />
        ) : isRecording ? (
          <Square className={iconSize} />
        ) : hasError || permissionState === 'denied' ? (
          <MicOff className={iconSize} />
        ) : (
          <Mic className={iconSize} />
        )}
      </button>

      {/* Recording duration indicator */}
      {isRecording && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-medium whitespace-nowrap shadow-lg">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          {formatDuration(duration)}
          {/* Cancel button */}
          <button
            type="button"
            onClick={handleCancel}
            className="ml-1 p-0.5 rounded hover:bg-red-600 transition-colors"
            title="Cancel recording"
          >
            <AlertCircle className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent text-white text-xs font-medium whitespace-nowrap shadow-lg">
          <Loader2 className="w-3 h-3 animate-spin" />
          Transcribing...
        </div>
      )}

      {/* Error/Permission tooltip */}
      {showTooltip && (hasError || permissionState === 'denied') && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-xs text-text-primary whitespace-nowrap shadow-lg z-50 max-w-[200px]">
          <div className="truncate">{errorMessage || 'Microphone access denied'}</div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
        </div>
      )}
    </div>
  );
}
