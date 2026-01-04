/**
 * HistoryItem - Individual session item in the smart history list
 * Displays session info with status indicators, rating, and action menu
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Pin,
  Archive,
  ArchiveRestore,
  Trash2,
  MoreVertical,
  Star,
  Tag,
  Play,
  Copy,
  Users,
} from 'lucide-react';
import type { SmartHistorySession } from '../../types';
import type { ViewMode } from '../../types';

interface HistoryItemProps {
  session: SmartHistorySession;
  onSelect: (sessionId: string) => void;
  onPin?: (session: SmartHistorySession) => void;
  onArchive?: (session: SmartHistorySession) => void;
  onDelete: (sessionId: string) => void;
  onRerunExact?: (sessionId: string) => void;
  onReusePrompt?: (sessionId: string) => void;
  onReuseCouncil?: (sessionId: string) => void;
  viewMode: ViewMode;
  isActive?: boolean;
  isDragging?: boolean;
  showPinButton?: boolean;
}

export function HistoryItem({
  session,
  onSelect,
  onPin,
  onArchive,
  onDelete,
  onRerunExact,
  onReusePrompt,
  onReuseCouncil,
  viewMode,
  isActive = false,
  isDragging = false,
  showPinButton = true,
}: HistoryItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-400',
    running: 'bg-teal-400 animate-pulse',
    completed: 'bg-emerald-400',
    failed: 'bg-red-400',
  };

  const phaseIndicators = {
    setup: 1,
    reasoning: 2,
    review: 3,
    synthesis: 4,
  };

  const currentPhaseNum = phaseIndicators[session.current_phase as keyof typeof phaseIndicators] || 1;

  // Toggle menu on click
  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  if (viewMode === 'cards') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        onClick={() => onSelect(session.id)}
        className={`
          group relative p-3 rounded-xl cursor-pointer transition-all
          ${isActive
            ? 'bg-teal-500/10 border border-teal-500/30'
            : 'bg-slate-800/30 hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50'
          }
          ${isDragging ? 'shadow-lg ring-2 ring-teal-500/50' : ''}
        `}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[session.status]}`} />
            <span className="text-sm font-medium text-slate-200 truncate">
              {session.title || 'Untitled Session'}
            </span>
          </div>

          {/* Menu Button */}
          <button
            onClick={handleMenuToggle}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-700/50 transition-all"
          >
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Card Body */}
        <div className="space-y-2">
          {/* Council Name */}
          {session.council_name && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Users className="w-3 h-3" />
              <span className="truncate">{session.council_name}</span>
            </div>
          )}

          {/* Indicators Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Phase Progress */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4].map((phase) => (
                <span
                  key={phase}
                  className={`w-1.5 h-1.5 rounded-full ${
                    phase <= currentPhaseNum
                      ? session.status === 'completed' ? 'bg-emerald-400' : 'bg-teal-400'
                      : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>

            {/* Rating */}
            {session.rating && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= session.rating! ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Has Tags */}
            {session.has_tags && (
              <Tag className="w-3 h-3 text-teal-400" />
            )}

            {/* Pinned */}
            {session.is_pinned && (
              <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />
            )}
          </div>

          {/* Date */}
          <div className="text-xs text-slate-500">
            {new Date(session.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Context Menu */}
        {showMenu && (
          <ContextMenu
            session={session}
            onPin={onPin}
            onArchive={onArchive}
            onDelete={onDelete}
            onRerunExact={onRerunExact}
            onReusePrompt={onReusePrompt}
            onReuseCouncil={onReuseCouncil}
            onClose={() => setShowMenu(false)}
            showPinButton={showPinButton}
          />
        )}
      </motion.div>
    );
  }

  // List view (default)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      onClick={() => onSelect(session.id)}
      className={`
        group relative flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all
        ${isActive
          ? 'bg-teal-500/10 border border-teal-500/30'
          : 'hover:bg-slate-800/50'
        }
        ${isDragging ? 'shadow-lg ring-2 ring-teal-500/50 bg-slate-800' : ''}
      `}
    >
      {/* Status Indicator */}
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColors[session.status]}`} />

      {/* Session Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-200 truncate">
            {session.title || 'Untitled'}
          </span>

          {/* Inline Indicators */}
          <div className="flex items-center gap-1 opacity-60">
            {session.rating && (
              <span className="flex items-center">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[10px] text-amber-400 ml-0.5">{session.rating}</span>
              </span>
            )}
            {session.has_tags && <Tag className="w-3 h-3 text-teal-400" />}
            {session.is_pinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />}
          </div>
        </div>
      </div>

      {/* Phase Progress (compact) */}
      <div className="flex items-center gap-0.5 mr-1">
        {[1, 2, 3, 4].map((phase) => (
          <span
            key={phase}
            className={`w-1 h-1 rounded-full ${
              phase <= currentPhaseNum
                ? session.status === 'completed' ? 'bg-emerald-400' : 'bg-teal-400'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Menu Button */}
      <button
        onClick={handleMenuToggle}
        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-700/50 transition-all"
      >
        <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Context Menu */}
      {showMenu && (
        <ContextMenu
          session={session}
          onPin={onPin}
          onArchive={onArchive}
          onDelete={onDelete}
          onRerunExact={onRerunExact}
          onReusePrompt={onReusePrompt}
          onReuseCouncil={onReuseCouncil}
          onClose={() => setShowMenu(false)}
          showPinButton={showPinButton}
        />
      )}
    </motion.div>
  );
}

// Context Menu Component
interface ContextMenuProps {
  session: SmartHistorySession;
  onPin?: (session: SmartHistorySession) => void;
  onArchive?: (session: SmartHistorySession) => void;
  onDelete: (sessionId: string) => void;
  onRerunExact?: (sessionId: string) => void;
  onReusePrompt?: (sessionId: string) => void;
  onReuseCouncil?: (sessionId: string) => void;
  onClose: () => void;
  showPinButton?: boolean;
}

function ContextMenu({
  session,
  onPin,
  onArchive,
  onDelete,
  onRerunExact,
  onReusePrompt,
  onReuseCouncil,
  onClose,
  showPinButton = true,
}: ContextMenuProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Menu */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute right-0 top-full mt-1 z-50 w-48 py-1 rounded-lg
          bg-slate-800 border border-slate-700 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pin/Unpin */}
        {showPinButton && onPin && (
          <MenuButton
            icon={<Pin className="w-4 h-4" />}
            label={session.is_pinned ? 'Unpin' : 'Pin to top'}
            onClick={() => {
              onPin(session);
              onClose();
            }}
          />
        )}

        {/* Divider */}
        {showPinButton && onPin && <div className="my-1 border-t border-slate-700" />}

        {/* Re-run Actions */}
        {onRerunExact && (
          <MenuButton
            icon={<Play className="w-4 h-4" />}
            label="Re-run exact"
            onClick={() => {
              onRerunExact(session.id);
              onClose();
            }}
          />
        )}
        {onReusePrompt && (
          <MenuButton
            icon={<Copy className="w-4 h-4" />}
            label="Reuse prompt"
            onClick={() => {
              onReusePrompt(session.id);
              onClose();
            }}
          />
        )}
        {onReuseCouncil && (
          <MenuButton
            icon={<Users className="w-4 h-4" />}
            label="Reuse council"
            onClick={() => {
              onReuseCouncil(session.id);
              onClose();
            }}
          />
        )}

        {/* Divider */}
        {(onRerunExact || onReusePrompt || onReuseCouncil) && (
          <div className="my-1 border-t border-slate-700" />
        )}

        {/* Archive/Restore */}
        {onArchive && (
          <MenuButton
            icon={session.is_archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            label={session.is_archived ? 'Restore' : 'Archive'}
            onClick={() => {
              onArchive(session);
              onClose();
            }}
          />
        )}

        {/* Delete */}
        <MenuButton
          icon={<Trash2 className="w-4 h-4" />}
          label="Delete"
          onClick={() => {
            onDelete(session.id);
            onClose();
          }}
          variant="danger"
        />
      </motion.div>
    </>
  );
}

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

function MenuButton({ icon, label, onClick, variant = 'default' }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors
        ${variant === 'danger'
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-slate-300 hover:bg-slate-700/50'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
