/**
 * ArchiveToggle - Toggle between active and archived sessions
 */

import { Archive, Inbox } from 'lucide-react';

interface ArchiveToggleProps {
  showArchived: boolean;
  onToggle: () => void;
}

export function ArchiveToggle({ showArchived, onToggle }: ArchiveToggleProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-700/50">
      <button
        onClick={() => !showArchived && onToggle()}
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
          transition-all
          ${!showArchived
            ? 'bg-slate-700/50 text-slate-200'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }
        `}
      >
        <Inbox className="w-3.5 h-3.5" />
        <span>Active</span>
      </button>
      <button
        onClick={() => showArchived && onToggle()}
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
          transition-all
          ${showArchived
            ? 'bg-slate-700/50 text-slate-200'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }
        `}
      >
        <Archive className="w-3.5 h-3.5" />
        <span>Archive</span>
      </button>
    </div>
  );
}
