import { Check, Circle, Loader2 } from 'lucide-react';
import { useSessionStore } from '@/store';
import type { PhaseType } from '@/types';

const phases: { key: PhaseType; label: string }[] = [
  { key: 'setup', label: 'Setup' },
  { key: 'reasoning', label: 'Reasoning' },
  { key: 'review', label: 'Review' },
  { key: 'synthesis', label: 'Synthesis' },
];

export function PhaseNavigation() {
  const { currentPhase, currentSession, setCurrentPhase } = useSessionStore();

  const getPhaseStatus = (phase: PhaseType) => {
    // When no session, use currentPhase from store to track progress
    if (!currentSession) {
      const phaseOrder: PhaseType[] = ['setup', 'reasoning', 'review', 'synthesis'];
      const currentIdx = phaseOrder.indexOf(currentPhase);
      const phaseIdx = phaseOrder.indexOf(phase);

      if (phaseIdx < currentIdx) return 'completed';
      if (phaseIdx === currentIdx) return 'current';
      return 'pending';
    }

    const record = currentSession.phase_history.find((p) => p.phase === phase);
    if (!record) {
      // Fall back to comparing with currentPhase
      const phaseOrder: PhaseType[] = ['setup', 'reasoning', 'review', 'synthesis'];
      const currentIdx = phaseOrder.indexOf(currentPhase);
      const phaseIdx = phaseOrder.indexOf(phase);

      if (phaseIdx < currentIdx) return 'completed';
      if (phaseIdx === currentIdx) return 'current';
      return 'pending';
    }

    if (record.status === 'completed') return 'completed';
    if (record.status === 'running') return 'current';
    if (phase === currentPhase) return 'current';
    return 'pending';
  };

  return (
    <nav className="hidden md:flex items-center gap-1">
      {phases.map((phase, index) => {
        const status = getPhaseStatus(phase.key);
        const isLast = index === phases.length - 1;

        return (
          <div key={phase.key} className="flex items-center">
            <button
              onClick={() => {
                if (status !== 'pending') {
                  setCurrentPhase(phase.key);
                }
              }}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
                ${status === 'current' ? 'bg-accent/10 text-accent' : ''}
                ${status === 'completed' ? 'text-accent-success hover:text-accent cursor-pointer' : ''}
                ${status === 'pending' ? 'text-text-muted cursor-not-allowed' : ''}
                ${status !== 'pending' ? 'hover:bg-bg-secondary' : ''}
              `}
              disabled={status === 'pending'}
            >
              <span className="w-5 h-5 flex items-center justify-center">
                {status === 'completed' && <Check className="w-4 h-4" />}
                {status === 'current' && <Loader2 className="w-4 h-4 animate-spin" />}
                {status === 'pending' && <Circle className="w-4 h-4" />}
              </span>
              <span className="text-sm font-medium">{phase.label}</span>
            </button>

            {!isLast && (
              <div
                className={`w-8 h-0.5 mx-1 ${
                  status === 'completed' ? 'bg-accent-success' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
