/**
 * CommandResults - Search results list with keyboard navigation
 * Groups results by type and supports arrow key navigation
 */

import { FileText, History } from 'lucide-react';
import { CommandItem } from './CommandItem';
import type { QuickSearchResult, RerunAction } from '../../types';

interface CommandResultsProps {
  results: QuickSearchResult[];
  selectedIndex: number;
  isLoading: boolean;
  query: string;
  onSelect: (result: QuickSearchResult) => void;
  onAction: (result: QuickSearchResult, action: RerunAction) => void;
}

export function CommandResults({
  results,
  selectedIndex,
  isLoading,
  query,
  onSelect,
  onAction,
}: CommandResultsProps) {
  if (isLoading && results.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center gap-2 text-slate-400">
          <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <span>Searching...</span>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">
          {query
            ? `No results found for "${query}"`
            : 'Start typing to search sessions'}
        </p>
        <p className="text-slate-500 text-xs mt-1">
          Search prompts, council configurations, and tags
        </p>
      </div>
    );
  }

  // Group results: Recent first if no query, otherwise by relevance
  const groupLabel = query ? 'Results' : 'Recent Sessions';

  return (
    <div className="max-h-[400px] overflow-y-auto">
      {/* Group header */}
      <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
        <History className="w-3 h-3" />
        {groupLabel}
        <span className="text-slate-600">({results.length})</span>
      </div>

      {/* Results list */}
      <div className="pb-2">
        {results.map((result, index) => (
          <CommandItem
            key={result.session_id}
            result={result}
            isSelected={index === selectedIndex}
            onSelect={() => onSelect(result)}
            onAction={(action) => onAction(result, action)}
          />
        ))}
      </div>

      {/* Keyboard hints */}
      <div className="px-4 py-2 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-slate-700/50 text-slate-400 font-mono text-[10px]">
              ↑↓
            </kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-slate-700/50 text-slate-400 font-mono text-[10px]">
              ↵
            </kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-slate-700/50 text-slate-400 font-mono text-[10px]">
              tab
            </kbd>
            filters
          </span>
        </div>
      </div>
    </div>
  );
}
