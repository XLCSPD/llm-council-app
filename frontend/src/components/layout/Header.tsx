import { Moon, Sun, Menu, Settings } from 'lucide-react';
import { useUIStore } from '@/store';
import { PhaseNavigation } from './PhaseNavigation';

export function Header() {
  const { theme, toggleTheme, toggleSidebar } = useUIStore();

  return (
    <header className="h-16 border-b border-border bg-bg-primary flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-text-secondary" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">LC</span>
          </div>
          <span className="font-semibold text-text-primary">LLM Council</span>
        </div>
      </div>

      <PhaseNavigation />

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-text-secondary" />
          ) : (
            <Sun className="w-5 h-5 text-text-secondary" />
          )}
        </button>

        <button
          className="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-text-secondary" />
        </button>
      </div>
    </header>
  );
}
