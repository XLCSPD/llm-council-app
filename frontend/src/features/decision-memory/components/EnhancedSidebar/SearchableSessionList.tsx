/**
 * SearchableSessionList - Session list with inline search
 * Provides quick filtering within the sidebar
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2, Command } from 'lucide-react';
import { useDecisionMemoryStore } from '@/store';
import { DecisionCard, searchResultToCardData } from '../DecisionCard';

interface SearchableSessionListProps {
  maxHeight?: string;
}

export function SearchableSessionList({
  maxHeight = 'calc(100vh - 400px)',
}: SearchableSessionListProps) {
  const [localQuery, setLocalQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const {
    searchResults,
    searchLoading,
    setSearchQuery,
    executeSearch,
    openCommandPalette,
  } = useDecisionMemoryStore();

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(localQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery]);

  // Execute search when debounced query changes
  useEffect(() => {
    setSearchQuery(debouncedQuery);
    executeSearch();
  }, [debouncedQuery, setSearchQuery, executeSearch]);

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // ⌘K to open command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openCommandPalette();
    }
  }, [openCommandPalette]);

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="px-2 py-2 border-b border-slate-700/50">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {searchLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>

          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search sessions..."
            className="w-full pl-10 pr-16 py-2 text-sm rounded-lg
              bg-slate-800/50 border border-slate-700/50
              text-slate-200 placeholder-slate-500
              focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20
              transition-colors"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {localQuery && (
              <button
                onClick={handleClear}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={openCommandPalette}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded
                bg-slate-700/50 text-slate-400 hover:text-slate-200
                transition-colors"
              title="Open command palette (⌘K)"
            >
              <Command className="w-3 h-3" />
              <span className="text-[10px] font-mono">K</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div
        className="flex-1 overflow-y-auto px-2 py-2 space-y-1"
        style={{ maxHeight }}
      >
        {searchLoading && searchResults.length === 0 ? (
          <div className="py-8 text-center">
            <Loader2 className="w-5 h-5 text-teal-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Searching...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="py-8 text-center">
            <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">
              {localQuery ? 'No sessions found' : 'No recent sessions'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {localQuery
                ? 'Try a different search term'
                : 'Start a new session to get started'}
            </p>
          </div>
        ) : (
          searchResults.map((result) => (
            <DecisionCard
              key={result.session_id}
              data={searchResultToCardData(result)}
              variant="compact"
              className="mb-1"
            />
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-slate-700/50">
        <button
          onClick={openCommandPalette}
          className="w-full flex items-center justify-center gap-2 py-1.5
            text-xs text-slate-500 hover:text-slate-300
            transition-colors"
        >
          <Command className="w-3 h-3" />
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 font-mono text-[10px]">
            ⌘K
          </kbd>
          <span>for full search</span>
        </button>
      </div>
    </div>
  );
}
