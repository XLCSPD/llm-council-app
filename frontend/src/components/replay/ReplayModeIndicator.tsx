interface ReplayModeIndicatorProps {
  className?: string;
}

/**
 * Visual badge indicating the user is viewing historical data in read-only mode.
 */
export function ReplayModeIndicator({ className = '' }: ReplayModeIndicatorProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full ${className}`}
    >
      <svg
        className="w-4 h-4 text-amber-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-sm font-medium text-amber-500">Replay Mode</span>
      <span className="text-xs text-amber-500/70">(Read-only)</span>
    </div>
  );
}
