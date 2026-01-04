/**
 * CommandItem - Individual search result item
 * Displays session info with council fingerprint and action buttons
 */

import { Clock, Play, Users, FileText, RotateCcw, Star } from 'lucide-react';
import type { QuickSearchResult, RerunAction } from '../../types';

interface CommandItemProps {
  result: QuickSearchResult;
  isSelected: boolean;
  onSelect: () => void;
  onAction: (action: RerunAction) => void;
}

// Role colors matching the app theme
const ROLE_COLORS: Record<string, string> = {
  thinker: 'bg-blue-500',
  critic: 'bg-amber-500',
  devils_advocate: 'bg-rose-500',
  synthesizer: 'bg-teal-500',
};

export function CommandItem({
  result,
  isSelected,
  onSelect,
  onAction,
}: CommandItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'succeeded':
        return 'text-emerald-400';
      case 'failed':
        return 'text-red-400';
      case 'running':
        return 'text-amber-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`
        group px-4 py-3 cursor-pointer transition-all duration-150
        ${isSelected
          ? 'bg-slate-700/60 border-l-2 border-teal-400'
          : 'hover:bg-slate-700/40 border-l-2 border-transparent'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon based on status */}
        <div className={`mt-0.5 ${getStatusColor(result.run_status)}`}>
          {result.run_status === 'succeeded' ? (
            <FileText className="w-4 h-4" />
          ) : result.run_status === 'running' ? (
            <Play className="w-4 h-4 animate-pulse" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-slate-200 truncate">
              {result.title || 'Untitled Session'}
            </span>
            {result.rating && (
              <div className="flex items-center gap-0.5 text-amber-400">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs">{result.rating}</span>
              </div>
            )}
          </div>

          {/* Prompt preview */}
          {result.prompt_preview && (
            <p className="text-xs text-slate-400 truncate mb-2">
              {result.prompt_preview}
            </p>
          )}

          {/* Council fingerprint + metadata */}
          <div className="flex items-center gap-3">
            {/* Council members as colored dots */}
            {result.council_members && result.council_members.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-500" />
                <div className="flex -space-x-1">
                  {result.council_members.slice(0, 4).map((member, idx) => (
                    <div
                      key={idx}
                      className={`w-3 h-3 rounded-full ${ROLE_COLORS[member.role] || 'bg-slate-500'} ring-1 ring-slate-800`}
                      title={`${member.display_name} (${member.role})`}
                    />
                  ))}
                  {result.council_members.length > 4 && (
                    <div className="w-3 h-3 rounded-full bg-slate-600 ring-1 ring-slate-800 flex items-center justify-center">
                      <span className="text-[8px] text-slate-300">
                        +{result.council_members.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date */}
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{formatDate(result.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Action buttons - visible on hover/select */}
        <div
          className={`
            flex items-center gap-1 transition-opacity duration-150
            ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('reuse-prompt');
            }}
            className="p-1.5 rounded-md text-slate-400 hover:text-teal-400 hover:bg-slate-600/50 transition-colors"
            title="Reuse prompt"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('reuse-council');
            }}
            className="p-1.5 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-600/50 transition-colors"
            title="Reuse council"
          >
            <Users className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('exact');
            }}
            className="p-1.5 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-slate-600/50 transition-colors"
            title="Re-run exact"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
