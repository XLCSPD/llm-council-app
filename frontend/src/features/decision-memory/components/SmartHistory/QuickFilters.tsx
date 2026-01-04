/**
 * QuickFilters - Filter pill bar for quick session filtering
 * Toggleable filters: All, Rated, Tagged, Completed, Running
 */

import { Star, Tag, CheckCircle, Zap } from 'lucide-react';
import type { HistoryFilter } from '../../types';

interface QuickFiltersProps {
  activeFilters: Set<HistoryFilter>;
  onToggleFilter: (filter: HistoryFilter) => void;
}

export function QuickFilters({ activeFilters, onToggleFilter }: QuickFiltersProps) {
  const filters: { id: HistoryFilter; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'rated', label: 'Rated', icon: Star },
    { id: 'tagged', label: 'Tagged', icon: Tag },
    { id: 'completed', label: 'Done', icon: CheckCircle },
    { id: 'running', label: 'Active', icon: Zap },
  ];

  const hasActiveFilters = activeFilters.size > 0;

  return (
    <div className="flex items-center gap-1.5 px-2 py-2 border-b border-slate-700/50 overflow-x-auto">
      {/* All Button - clears filters */}
      <FilterPill
        label="All"
        isActive={!hasActiveFilters}
        onClick={() => {
          // Clear all filters when "All" is clicked
          if (hasActiveFilters) {
            activeFilters.forEach((filter) => onToggleFilter(filter));
          }
        }}
      />

      {/* Filter Pills */}
      {filters.map(({ id, label, icon: Icon }) => (
        <FilterPill
          key={id}
          icon={<Icon className="w-3 h-3" />}
          label={label}
          isActive={activeFilters.has(id)}
          onClick={() => onToggleFilter(id)}
        />
      ))}
    </div>
  );
}

interface FilterPillProps {
  icon?: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function FilterPill({ icon, label, isActive, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        transition-all whitespace-nowrap
        ${isActive
          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
          : 'bg-slate-800/50 text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-700/50'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
