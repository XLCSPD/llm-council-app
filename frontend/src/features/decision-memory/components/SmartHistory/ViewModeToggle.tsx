/**
 * ViewModeToggle - Toggle between list and card views
 */

import { List, LayoutGrid } from 'lucide-react';
import type { ViewMode } from '../../types';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onChangeMode: (mode: ViewMode) => void;
}

export function ViewModeToggle({ viewMode, onChangeMode }: ViewModeToggleProps) {
  return (
    <div className="flex items-center justify-center gap-1 p-2 border-t border-slate-700/50">
      <button
        onClick={() => onChangeMode('list')}
        className={`
          p-1.5 rounded-md transition-all
          ${viewMode === 'list'
            ? 'bg-slate-700/50 text-slate-200'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }
        `}
        title="List view"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChangeMode('cards')}
        className={`
          p-1.5 rounded-md transition-all
          ${viewMode === 'cards'
            ? 'bg-slate-700/50 text-slate-200'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }
        `}
        title="Card view"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
    </div>
  );
}
