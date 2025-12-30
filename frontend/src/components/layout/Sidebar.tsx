import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { useSessionStore, useUIStore } from '@/store';
import type { SessionSummary } from '@/types';

interface SidebarProps {
  onNewSession: () => void;
  onSelectSession: (session: SessionSummary) => void;
}

export function Sidebar({ onNewSession, onSelectSession }: SidebarProps) {
  const { sidebarOpen } = useUIStore();
  const { sessions, currentSession, removeSession } = useSessionStore();

  if (!sidebarOpen) return null;

  return (
    <aside
      className="w-[280px] h-[calc(100vh-64px)] fixed left-0 top-16 border-r border-border bg-bg-secondary
                 overflow-hidden flex flex-col z-30"
    >
      <div className="p-4">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white
                     rounded-lg hover:bg-accent/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="text-xs font-medium text-text-muted uppercase tracking-wider px-2 mb-2">
          Recent Sessions
        </div>

        {sessions.length === 0 ? (
          <div className="text-sm text-text-muted text-center py-8 px-4">
            No sessions yet. Create your first session to get started.
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={currentSession?.id === session.id}
                onClick={() => onSelectSession(session)}
                onDelete={() => removeSession(session.id)}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
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
    running: 'bg-accent',
    completed: 'bg-accent-success',
    failed: 'bg-accent-error',
  };

  return (
    <div
      className={`
        group relative rounded-lg p-3 cursor-pointer transition-colors
        ${isActive ? 'bg-bg-tertiary' : 'hover:bg-bg-tertiary/50'}
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <MessageSquare className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${statusColors[session.status]}`}
              title={session.status}
            />
            <span className="text-sm font-medium text-text-primary truncate">
              {session.title || 'Untitled'}
            </span>
          </div>
          <div className="text-xs text-text-muted mt-1 truncate">
            {session.council_name}
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            {new Date(session.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-2 top-2 p-1 rounded opacity-0 group-hover:opacity-100
                   hover:bg-accent-error/10 transition-all"
        title="Delete session"
      >
        <Trash2 className="w-3.5 h-3.5 text-accent-error" />
      </button>
    </div>
  );
}
