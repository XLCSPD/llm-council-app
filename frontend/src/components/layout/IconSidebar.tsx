import { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  History,
  ChevronRight,
} from 'lucide-react';
import { useSessionStore, useUIStore } from '@/store';
import type { SessionSummary } from '@/types';

interface IconSidebarProps {
  onNewSession: () => void;
  onSelectSession: (session: SessionSummary) => void;
}

export function IconSidebar({ onNewSession, onSelectSession }: IconSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { sessions, currentSession, removeSession } = useSessionStore();
  const { currentView, setCurrentView } = useUIStore();

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen z-50
        glass-strong flex flex-col
        transition-all duration-300 ease-out
        ${isExpanded ? 'w-[280px]' : 'w-[72px]'}
      `}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false);
        setShowHistory(false);
      }}
    >
      {/* Logo */}
      <div className={`h-20 flex items-center border-b border-glass-border ${isExpanded ? 'px-3' : 'justify-center'}`}>
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

        {/* History Section */}
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`
              w-full flex items-center gap-3 p-3 rounded-xl
              text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50
              transition-colors
              ${isExpanded ? '' : 'justify-center'}
            `}
          >
            <History className="w-5 h-5 flex-shrink-0" />
            <span className={`flex-1 text-left ${isExpanded ? 'block' : 'hidden'}`}>
              History
            </span>
            {isExpanded && (
              <ChevronRight
                className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-90' : ''}`}
              />
            )}
          </button>

          {/* Session History List */}
          {isExpanded && showHistory && (
            <div className="mt-2 ml-2 space-y-1 max-h-[calc(100vh-400px)] overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="text-xs text-text-muted py-4 px-3 text-center">
                  No sessions yet
                </div>
              ) : (
                sessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={currentSession?.id === session.id}
                    onClick={() => {
                      setCurrentView('deliberation');
                      onSelectSession(session);
                    }}
                    onDelete={() => removeSession(session.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-2 border-t border-glass-border">
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
}

function NavItem({ icon, label, isExpanded, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
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

interface SessionItemProps {
  session: SessionSummary;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function SessionItem({ session, isActive, onClick, onDelete }: SessionItemProps) {
  const statusColors = {
    draft: 'bg-text-muted',
    running: 'bg-accent animate-pulse',
    completed: 'bg-accent-success',
    failed: 'bg-accent-error',
  };

  return (
    <div
      className={`
        group relative rounded-lg p-2.5 cursor-pointer transition-all
        ${isActive ? 'bg-accent/10 border border-accent/20' : 'hover:bg-bg-tertiary/50'}
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <MessageSquare className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${statusColors[session.status]}`}
            />
            <span className="text-sm font-medium text-text-primary truncate">
              {session.title || 'Untitled'}
            </span>
          </div>
          <div className="text-xs text-text-muted mt-0.5 truncate">
            {new Date(session.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-1.5 top-1.5 p-1 rounded opacity-0 group-hover:opacity-100
                   hover:bg-accent-error/10 transition-all"
        title="Delete session"
      >
        <Trash2 className="w-3 h-3 text-accent-error" />
      </button>
    </div>
  );
}
