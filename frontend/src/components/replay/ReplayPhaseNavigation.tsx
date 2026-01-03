import { useSessionStore } from '@/store';
import { useReplayMode } from '@/hooks';
import type { PhaseType } from '@/types';

interface PhaseInfo {
  id: PhaseType;
  label: string;
  icon: React.ReactNode;
}

const phases: PhaseInfo[] = [
  {
    id: 'setup',
    label: 'Prompt',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: 'reasoning',
    label: 'Reasoning',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: 'review',
    label: 'Review',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'synthesis',
    label: 'Synthesis',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

interface ReplayPhaseNavigationProps {
  className?: string;
}

/**
 * Phase navigation for replay mode.
 * All phases are always clickable in replay mode so users can review any phase.
 * Visual indicators show which phases have data vs which failed/have no data.
 */
export function ReplayPhaseNavigation({ className = '' }: ReplayPhaseNavigationProps) {
  const currentPhase = useSessionStore((state) => state.currentPhase);
  const { navigateToPhase, hasReasoningData, hasReviewData, hasSynthesisData } = useReplayMode();

  const phaseHasData = (phase: PhaseType): boolean => {
    switch (phase) {
      case 'setup':
        return true; // Setup always has data (the prompt)
      case 'reasoning':
        return hasReasoningData;
      case 'review':
        return hasReviewData;
      case 'synthesis':
        return hasSynthesisData;
      default:
        return false;
    }
  };

  return (
    <div className={`flex items-center gap-1 p-1 bg-bg-secondary rounded-lg ${className}`}>
      {phases.map((phase, index) => {
        const isActive = currentPhase === phase.id;
        const hasData = phaseHasData(phase.id);

        return (
          <button
            key={phase.id}
            onClick={() => navigateToPhase(phase.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md transition-all cursor-pointer
              ${isActive
                ? 'bg-bg-tertiary text-text-primary shadow-sm'
                : hasData
                  ? 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-tertiary/30'
              }
            `}
            title={hasData ? `View ${phase.label}` : `View ${phase.label} (no data)`}
          >
            <span className={`${isActive ? 'text-accent-primary' : ''} ${!hasData && !isActive ? 'opacity-60' : ''}`}>
              {phase.icon}
            </span>
            <span className={`text-sm font-medium hidden sm:inline ${!hasData && !isActive ? 'opacity-60' : ''}`}>
              {phase.label}
            </span>
            {index < phases.length - 1 && (
              <svg
                className="w-4 h-4 text-text-muted ml-1 hidden sm:block"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
