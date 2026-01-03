import { Moon, Sun, User, LogOut } from 'lucide-react';
import { useUIStore, useAuthStore, useSessionStore } from '@/store';
import { useReplayMode } from '@/hooks';
import type { PhaseType } from '@/types';

const phases: { key: PhaseType; label: string; icon: string }[] = [
  { key: 'setup', label: 'Setup', icon: '1' },
  { key: 'reasoning', label: 'Reasoning', icon: '2' },
  { key: 'review', label: 'Review', icon: '3' },
  { key: 'synthesis', label: 'Synthesis', icon: '4' },
];

export function FloatingHeader() {
  const { theme, toggleTheme } = useUIStore();
  const { user, signOut } = useAuthStore();
  const { currentPhase, currentSession, setCurrentPhase } = useSessionStore();
  const { isReplayMode, navigateToPhase } = useReplayMode();

  const getPhaseStatus = (phase: PhaseType): 'completed' | 'current' | 'pending' => {
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
    <header className="fixed top-4 left-16 md:left-[88px] right-4 z-40">
      <div className="glass rounded-2xl px-3 md:px-4 py-2.5 md:py-3 flex items-center justify-between">
        {/* Phase Navigation Pills */}
        <nav data-tour="phase-tabs" className="hidden md:flex items-center gap-1 bg-bg-tertiary/50 rounded-xl p-1">
          {phases.map((phase) => {
            const status = getPhaseStatus(phase.key);

            return (
              <button
                key={phase.key}
                onClick={() => {
                  if (isReplayMode) {
                    // In replay mode, all phases are clickable
                    navigateToPhase(phase.key);
                  } else if (status !== 'pending') {
                    setCurrentPhase(phase.key);
                  }
                }}
                disabled={!isReplayMode && status === 'pending'}
                className={`
                  relative flex items-center gap-2 px-4 py-2 rounded-lg
                  font-medium text-sm transition-all duration-200
                  ${status === 'current'
                    ? 'bg-gradient-accent text-white shadow-glow-teal'
                    : status === 'completed' || isReplayMode
                    ? 'text-accent-secondary hover:bg-bg-tertiary cursor-pointer'
                    : 'text-text-muted cursor-not-allowed'
                  }
                `}
              >
                <span
                  className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                    ${status === 'current'
                      ? 'bg-white/20 text-white'
                      : status === 'completed'
                      ? 'bg-accent-success/20 text-accent-success'
                      : isReplayMode
                      ? 'bg-accent-secondary/20 text-accent-secondary'
                      : 'bg-bg-tertiary text-text-muted'
                    }
                  `}
                >
                  {status === 'completed' ? '✓' : phase.icon}
                </span>
                <span className="hidden lg:inline">{phase.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Phase Indicator */}
        <div className="md:hidden flex items-center gap-2">
          <span className="text-sm font-medium text-text-secondary">
            Phase {phases.findIndex(p => p.key === currentPhase) + 1}:
          </span>
          <span className="text-sm font-semibold text-gradient">
            {phases.find(p => p.key === currentPhase)?.label}
          </span>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl glass-subtle hover:bg-bg-tertiary transition-colors"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-text-secondary" />
            ) : (
              <Sun className="w-5 h-5 text-accent-secondary" />
            )}
          </button>

          {/* User Menu */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-glass-border">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-text-primary truncate max-w-[120px]">
                  {user.email?.split('@')[0]}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <button
                onClick={signOut}
                className="p-2 rounded-xl hover:bg-accent-error/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 text-text-muted hover:text-accent-error" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
