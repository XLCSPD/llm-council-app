/**
 * RemoveMemberDialog - Confirmation modal with options to remove from org or delete account
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2, UserMinus, Trash2 } from 'lucide-react';

interface RemoveMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRemove: (deleteAccount: boolean) => void | Promise<void>;
  memberEmail: string | null;
  loading?: boolean;
}

export function RemoveMemberDialog({
  isOpen,
  onClose,
  onRemove,
  memberEmail,
  loading = false,
}: RemoveMemberDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'remove' | 'delete'>('remove');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onRemove(selectedOption === 'delete');
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="w-full max-w-lg rounded-2xl bg-bg-secondary border border-glass-border shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-red-500/20 text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Remove Member
                </h3>
                <p className="text-sm text-text-secondary">
                  Choose how to handle {memberEmail ? <strong>{memberEmail}</strong> : 'this member'}:
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setSelectedOption('remove')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  selectedOption === 'remove'
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-glass-border hover:border-glass-border/80 hover:bg-bg-tertiary/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${selectedOption === 'remove' ? 'bg-amber-500/20 text-amber-400' : 'bg-bg-tertiary text-text-muted'}`}>
                    <UserMinus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-text-primary mb-1">
                      Remove from organization
                    </div>
                    <div className="text-sm text-text-secondary">
                      User loses access to this organization but their account remains.
                      They can be re-invited later.
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedOption('delete')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  selectedOption === 'delete'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-glass-border hover:border-glass-border/80 hover:bg-bg-tertiary/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${selectedOption === 'delete' ? 'bg-red-500/20 text-red-400' : 'bg-bg-tertiary text-text-muted'}`}>
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-text-primary mb-1">
                      Delete account permanently
                    </div>
                    <div className="text-sm text-text-secondary">
                      Removes from organization AND deletes their Supabase account.
                      This action cannot be undone.
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Warning for delete option */}
            {selectedOption === 'delete' && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-6">
                <p className="text-sm text-red-400">
                  <strong>Warning:</strong> This will permanently delete the user's account
                  and all associated data. This cannot be undone.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                  selectedOption === 'delete'
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : selectedOption === 'delete' ? (
                  'Delete Account'
                ) : (
                  'Remove from Org'
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
