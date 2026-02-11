/**
 * SmartHistoryPanel - Main container for smart session history
 * Provides temporal grouping, filtering, pinning, and archiving
 */

import { useEffect } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useWorkspaceStore, useDecisionMemoryStore } from '@/store';
import { useSmartHistory } from '../../hooks/useSmartHistory';
import { PinnedSection } from './PinnedSection';
import { HistoryGroup } from './HistoryGroup';
import { QuickFilters } from './QuickFilters';
import { ArchiveToggle } from './ArchiveToggle';
import { ViewModeToggle } from './ViewModeToggle';
import type { SmartHistorySession } from '../../types';

interface SmartHistoryPanelProps {
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  maxHeight?: string;
}

export function SmartHistoryPanel({
  onSelectSession,
  onDeleteSession,
  maxHeight = 'calc(100vh - 300px)',
}: SmartHistoryPanelProps) {
  const { projectId } = useWorkspaceStore();
  const { openCommandPalette } = useDecisionMemoryStore();

  const {
    groupedSessions,
    isLoading,
    error,
    viewMode,
    activeFilters,
    expandedGroups,
    showArchived,
    loadSessions,
    pinSession,
    unpinSession,
    reorderPinned,
    archiveSession,
    restoreSession,
    setViewMode,
    toggleFilter,
    toggleGroup,
    toggleArchived,
  } = useSmartHistory(projectId);

  // Load sessions on mount and when filters change
  useEffect(() => {
    if (projectId) {
      loadSessions(projectId);
    }
  }, [projectId, loadSessions, activeFilters, showArchived]);

  // Get month keys from earlier sessions, sorted newest first
  const monthKeys = Array.from(groupedSessions.earlier.keys()).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB.getTime() - dateA.getTime();
  });

  // Session action handlers
  const handlePin = async (session: SmartHistorySession) => {
    if (session.is_pinned) {
      await unpinSession(session.id);
    } else {
      await pinSession(session.id);
    }
  };

  const handleArchive = async (session: SmartHistorySession) => {
    if (session.is_archived) {
      await restoreSession(session.id);
    } else {
      await archiveSession(session.id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Button */}
      <div className="px-2 py-2 border-b border-slate-700/50">
        <button
          onClick={openCommandPalette}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
            bg-slate-800/50 border border-slate-700/50
            text-slate-400 hover:text-slate-200 hover:border-slate-600
            transition-colors text-sm"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Search sessions...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-700/50">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Quick Filters */}
      <QuickFilters
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
      />

      {/* Archive Toggle */}
      <ArchiveToggle
        showArchived={showArchived}
        onToggle={toggleArchived}
      />

      {/* Session List */}
      <div
        className="flex-1 overflow-y-auto px-2 py-2"
        style={{ maxHeight }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Pinned Section */}
            {groupedSessions.pinned.length > 0 && (
              <PinnedSection
                sessions={groupedSessions.pinned}
                onReorder={reorderPinned}
                onSelect={onSelectSession}
                onUnpin={(id) => unpinSession(id)}
                onArchive={(session) => handleArchive(session)}
                onDelete={onDeleteSession}
                viewMode={viewMode}
              />
            )}

            {/* Today */}
            {groupedSessions.today.length > 0 && (
              <HistoryGroup
                groupId="today"
                sessions={groupedSessions.today}
                isExpanded={expandedGroups.has('today')}
                onToggle={() => toggleGroup('today')}
                onSelect={onSelectSession}
                onPin={handlePin}
                onArchive={handleArchive}
                onDelete={onDeleteSession}
                viewMode={viewMode}
              />
            )}

            {/* Yesterday */}
            {groupedSessions.yesterday.length > 0 && (
              <HistoryGroup
                groupId="yesterday"
                sessions={groupedSessions.yesterday}
                isExpanded={expandedGroups.has('yesterday')}
                onToggle={() => toggleGroup('yesterday')}
                onSelect={onSelectSession}
                onPin={handlePin}
                onArchive={handleArchive}
                onDelete={onDeleteSession}
                viewMode={viewMode}
              />
            )}

            {/* This Week */}
            {groupedSessions.thisWeek.length > 0 && (
              <HistoryGroup
                groupId="this_week"
                sessions={groupedSessions.thisWeek}
                isExpanded={expandedGroups.has('this_week')}
                onToggle={() => toggleGroup('this_week')}
                onSelect={onSelectSession}
                onPin={handlePin}
                onArchive={handleArchive}
                onDelete={onDeleteSession}
                viewMode={viewMode}
              />
            )}

            {/* Earlier (by month) */}
            {monthKeys.map((monthKey) => {
              const sessions = groupedSessions.earlier.get(monthKey) ?? [];
              return (
                <HistoryGroup
                  key={monthKey}
                  groupId={monthKey}
                  sessions={sessions}
                  isExpanded={expandedGroups.has(monthKey)}
                  onToggle={() => toggleGroup(monthKey)}
                  onSelect={onSelectSession}
                  onPin={handlePin}
                  onArchive={handleArchive}
                  onDelete={onDeleteSession}
                  viewMode={viewMode}
                  showCount
                />
              );
            })}

            {/* Empty State */}
            {groupedSessions.pinned.length === 0 &&
              groupedSessions.today.length === 0 &&
              groupedSessions.yesterday.length === 0 &&
              groupedSessions.thisWeek.length === 0 &&
              monthKeys.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400">
                    {showArchived ? 'No archived sessions' : 'No sessions yet'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {showArchived
                      ? 'Archived sessions will appear here'
                      : 'Start a new session to get started'}
                  </p>
                </div>
              )}
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <ViewModeToggle
        viewMode={viewMode}
        onChangeMode={setViewMode}
      />
    </div>
  );
}
