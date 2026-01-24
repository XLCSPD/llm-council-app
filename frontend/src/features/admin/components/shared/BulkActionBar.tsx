/**
 * BulkActionBar - Floating action bar for bulk operations
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, UserCog, Trash2 } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onBulkRoleChange: () => void;
  onBulkRemove: () => void;
  isOwner: boolean;
}

export function BulkActionBar({
  selectedCount,
  onClear,
  onBulkRoleChange,
  onBulkRemove,
  isOwner,
}: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-bg-secondary border border-glass-border shadow-2xl backdrop-blur-xl">
            <span className="text-sm text-text-secondary">
              <strong className="text-text-primary">{selectedCount}</strong> selected
            </span>

            <div className="w-px h-6 bg-glass-border" />

            {isOwner && (
              <button
                onClick={onBulkRoleChange}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              >
                <UserCog className="w-4 h-4" />
                Change Role
              </button>
            )}

            <button
              onClick={onBulkRemove}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>

            <button
              onClick={onClear}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
