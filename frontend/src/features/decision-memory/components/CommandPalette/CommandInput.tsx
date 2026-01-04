/**
 * CommandInput - Search input with filter pills
 * Provides search functionality and filter toggle
 */

import { useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import type { SearchFilterType } from '../../types';

interface CommandInputProps {
  value: string;
  onChange: (value: string) => void;
  activeFilter: SearchFilterType;
  onFilterChange: (filter: SearchFilterType) => void;
  isLoading: boolean;
  onClose?: () => void;
}

const FILTERS: { id: SearchFilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'prompts', label: 'Prompts' },
  { id: 'councils', label: 'Councils' },
  { id: 'tags', label: 'Tags' },
];

export function CommandInput({
  value,
  onChange,
  activeFilter,
  onFilterChange,
  isLoading,
}: CommandInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="border-b border-slate-700/50">
      {/* Search input */}
      <div className="flex items-center gap-3 px-4 py-3">
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-teal-400 animate-spin flex-shrink-0" />
        ) : (
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search sessions, prompts, councils..."
          className="flex-1 bg-transparent text-slate-200 placeholder-slate-500
            text-sm outline-none"
        />

        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200
              hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 border-l border-slate-700 pl-3">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 font-mono">
            esc
          </kbd>
          <span>to close</span>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 px-4 pb-3">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`
              px-3 py-1 text-xs font-medium rounded-full transition-all duration-200
              ${activeFilter === filter.id
                ? 'bg-teal-500/20 text-teal-400 ring-1 ring-teal-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }
            `}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
