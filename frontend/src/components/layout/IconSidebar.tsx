import { useState } from 'react';
import {
  Plus,
  Settings,
  HelpCircle,
  Search,
} from 'lucide-react';
import { useSessionStore, useUIStore, useDecisionMemoryStore } from '@/store';
import { SmartHistoryPanel } from '@/features/decision-memory/components/SmartHistory';
import type { SessionSummary } from '@/types';

interface IconSidebarProps {
  onNewSession: () => void;
  onSelectSession: (session: SessionSummary) => void;
}

export function IconSidebar({ onNewSession, onSelectSession }: IconSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { removeSession } = useSessionStore();
  const { currentView, setCurrentView } = useUIStore();
  const { openCommandPalette } = useDecisionMemoryStore();

  const handleSelectSession = (sessionId: string) => {
    setCurrentView('deliberation');
    // SmartHistory provides session IDs, we need to pass as SessionSummary
    onSelectSession({ id: sessionId } as SessionSummary);
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen z-50
        glass-strong hidden md:flex flex-col
        transition-all duration-300 ease-out
        ${isExpanded ? 'w-[280px]' : 'w-[72px]'}
      `}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div
        data-tour="sidebar-logo"
        className={`h-20 flex items-center border-b border-glass-border ${isExpanded ? 'px-3' : 'justify-center'}`}
      >
        <div className={`rounded-lg overflow-hidden flex-shrink-0 ${isExpanded ? 'w-[60px] h-[60px]' : 'w-[48px] h-[48px]'}`}>
          <img src="/logo.png" alt="LLM Council" className="w-full h-full object-contain" />
        </div>
        <span
          className={`
            ml-3 font-display font-semibold text-lg text-gradient
            transition-opacity duration-200
            ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}
          `}
        >
          LLM Council
        </span>
      </div>

      {/* Navigation Icons */}
      <nav className="flex-1 py-4 px-2 space-y-2">
        {/* New Session Button */}
        <button
          onClick={() => {
            setCurrentView('deliberation');
            onNewSession();
          }}
          className={`
            w-full flex items-center gap-3 p-3 rounded-xl
            bg-gradient-accent text-white font-medium
            hover:shadow-glow-cyan transition-all duration-200
            ${isExpanded ? '' : 'justify-center'}
          `}
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          <span className={`${isExpanded ? 'block' : 'hidden'}`}>New Session</span>
        </button>

        {/* Search / Command Palette Button */}
        <button
          onClick={openCommandPalette}
          className={`
            w-full flex items-center gap-3 p-3 rounded-xl
            text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50
            transition-colors group
            ${isExpanded ? '' : 'justify-center'}
          `}
          title="Search sessions (⌘K)"
        >
          <Search className="w-5 h-5 flex-shrink-0" />
          {isExpanded && (
            <>
              <span className="flex-1 text-left">Search</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-bg-tertiary text-text-muted group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                ⌘K
              </kbd>
            </>
          )}
        </button>

        {/* Smart History Section */}
        {isExpanded && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <SmartHistoryPanel
              onSelectSession={handleSelectSession}
              onDeleteSession={removeSession}
              maxHeight="calc(100vh - 320px)"
            />
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="p-2 border-t border-glass-border space-y-1">
        <NavItem
          icon={<HelpCircle className="w-5 h-5" />}
          label="Help"
          isExpanded={isExpanded}
          isActive={currentView === 'help'}
          onClick={() => setCurrentView('help')}
          dataTour="sidebar-help"
        />
        <NavItem
          icon={<Settings className="w-5 h-5" />}
          label="Settings"
          isExpanded={isExpanded}
          isActive={currentView === 'settings'}
          onClick={() => setCurrentView('settings')}
        />
      </div>
    </aside>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isExpanded: boolean;
  isActive: boolean;
  onClick?: () => void;
  dataTour?: string;
}

function NavItem({ icon, label, isExpanded, isActive, onClick, dataTour }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      data-tour={dataTour}
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl
        transition-colors
        ${isExpanded ? '' : 'justify-center'}
        ${isActive
          ? 'bg-accent/10 text-accent'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
        }
      `}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className={`${isExpanded ? 'block' : 'hidden'}`}>{label}</span>
    </button>
  );
}

