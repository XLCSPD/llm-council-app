/**
 * HistoryGroup - Collapsible group of sessions (Today, This Week, etc.)
 * Handles expand/collapse with session count display
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Calendar, Flame, Clock, Archive } from 'lucide-react';
import { HistoryItem } from './HistoryItem';
import type { SmartHistorySession, ViewMode } from '../../types';

interface HistoryGroupProps {
  groupId: string;
  sessions: SmartHistorySession[];
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: (sessionId: string) => void;
  onPin: (session: SmartHistorySession) => void;
  onArchive: (session: SmartHistorySession) => void;
  onDelete: (sessionId: string) => void;
  onRerunExact?: (sessionId: string) => void;
  onReusePrompt?: (sessionId: string) => void;
  onReuseCouncil?: (sessionId: string) => void;
  viewMode: ViewMode;
  showCount?: boolean;
}

export function HistoryGroup({
  groupId,
  sessions,
  isExpanded,
  onToggle,
  onSelect,
  onPin,
  onArchive,
  onDelete,
  onRerunExact,
  onReusePrompt,
  onReuseCouncil,
  viewMode,
  showCount = false,
}: HistoryGroupProps) {
  const { label, icon: Icon } = getGroupInfo(groupId);

  return (
    <div className="mb-1">
      {/* Group Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
          text-slate-400 hover:text-slate-200 hover:bg-slate-800/30
          transition-colors text-sm"
      >
        <ChevronRight
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
        <Icon className="w-4 h-4" />
        <span className="font-medium">{label}</span>
        {showCount && (
          <span className="ml-auto text-xs text-slate-500">({sessions.length})</span>
        )}
      </button>

      {/* Sessions List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`
              mt-1 ml-3 space-y-0.5
              ${viewMode === 'cards' ? 'grid grid-cols-1 gap-2' : ''}
            `}>
              {sessions.length === 0 ? (
                <div className="text-xs text-slate-500 py-2 px-2">
                  No sessions
                </div>
              ) : (
                sessions.map((session) => (
                  <HistoryItem
                    key={session.id}
                    session={session}
                    onSelect={onSelect}
                    onPin={onPin}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onRerunExact={onRerunExact}
                    onReusePrompt={onReusePrompt}
                    onReuseCouncil={onReuseCouncil}
                    viewMode={viewMode}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to get group display info
function getGroupInfo(groupId: string): { label: string; icon: React.FC<{ className?: string }> } {
  switch (groupId) {
    case 'today':
      return { label: 'Today', icon: Flame };
    case 'yesterday':
      return { label: 'Yesterday', icon: Clock };
    case 'this_week':
      return { label: 'This Week', icon: Calendar };
    default:
      // Month format like "Nov_2024" -> "November 2024"
      if (groupId.includes('_')) {
        const parts = groupId.split('_');
        const month = parts[0] ?? '';
        const year = parts[1] ?? '';
        const monthNames: Record<string, string> = {
          Jan: 'January',
          Feb: 'February',
          Mar: 'March',
          Apr: 'April',
          May: 'May',
          Jun: 'June',
          Jul: 'July',
          Aug: 'August',
          Sep: 'September',
          Oct: 'October',
          Nov: 'November',
          Dec: 'December',
        };
        const monthLabel = monthNames[month] ?? month;
        return {
          label: `${monthLabel} ${year}`,
          icon: Archive,
        };
      }
      return { label: groupId, icon: Calendar };
  }
}

// Export helper for external use
export function getGroupLabel(groupId: string): string {
  return getGroupInfo(groupId).label;
}
