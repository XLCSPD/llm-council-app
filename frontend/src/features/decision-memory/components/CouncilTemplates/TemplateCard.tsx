/**
 * TemplateCard - Display a single council template
 * Shows template info with usage stats and action buttons
 */

import { Star, Users, Clock, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilFingerprint } from '../DecisionCard/CouncilFingerprint';
import type { CouncilTemplate, CouncilFingerprint as CouncilFingerprintType } from '../../types';
import type { RoleType } from '@/types';

interface TemplateCardProps {
  template: CouncilTemplate;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export function TemplateCard({
  template,
  onSelect,
  onToggleFavorite,
  onEdit,
  onDelete,
  variant = 'default',
  className = '',
}: TemplateCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formatLastUsed = (dateString: string | null) => {
    if (!dateString) return 'Never used';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Used today';
    if (diffDays === 1) return 'Used yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Convert template members to fingerprint format
  const fingerprintMembers: CouncilFingerprintType[] = template.members.map((m) => ({
    modelKey: m.model_id,
    displayName: m.display_name || m.model_id,
    role: m.role as RoleType,
  }));

  // Compact variant
  if (variant === 'compact') {
    return (
      <button
        onClick={onSelect}
        className={`
          w-full flex items-center gap-3 p-3 rounded-xl text-left
          bg-slate-800/40 hover:bg-slate-800/60
          border border-transparent hover:border-slate-700/50
          transition-all duration-200
          ${className}
        `}
      >
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">{template.icon || '🏛️'}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200 truncate">
              {template.name}
            </span>
            {template.is_favorite && (
              <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <CouncilFingerprint members={fingerprintMembers} maxVisible={3} size="sm" showLabels={false} />
            <span className="text-[10px] text-slate-500">{template.members.length} models</span>
          </div>
        </div>
      </button>
    );
  }

  // Default variant with full details
  return (
    <div
      className={`
        relative rounded-xl overflow-hidden
        bg-slate-800/50 hover:bg-slate-800/70
        border border-slate-700/50 hover:border-slate-600/50
        transition-all duration-200
        ${className}
      `}
    >
      {/* Header with favorite star */}
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">{template.icon || '🏛️'}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-200 truncate">
              {template.name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="p-1 rounded hover:bg-slate-700/50 transition-colors"
              title={template.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star
                className={`w-4 h-4 ${
                  template.is_favorite
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-500 hover:text-amber-400'
                }`}
              />
            </button>
          </div>

          {template.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {template.description}
            </p>
          )}
        </div>

        {/* Menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 w-36 rounded-lg bg-slate-800 border border-slate-700 shadow-xl z-20 py-1"
              >
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Council fingerprint */}
      <div className="px-4 pb-3">
        <CouncilFingerprint members={fingerprintMembers} maxVisible={5} size="md" />
      </div>

      {/* Footer with stats */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {template.members.length} models
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatLastUsed(template.last_used_at)}
          </span>
          {template.usage_count > 0 && (
            <span>Used {template.usage_count}x</span>
          )}
        </div>

        <button
          onClick={onSelect}
          className="px-3 py-1.5 rounded-lg text-xs font-medium
            bg-teal-500/20 text-teal-400 hover:bg-teal-500/30
            transition-colors"
        >
          Use Template
        </button>
      </div>
    </div>
  );
}
