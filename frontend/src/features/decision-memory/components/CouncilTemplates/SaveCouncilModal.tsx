/**
 * SaveCouncilModal - Modal to save current council as a template
 * Allows users to name, describe, and set icon for their council configuration
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Users } from 'lucide-react';
import { CouncilFingerprint } from '../DecisionCard/CouncilFingerprint';
import { saveCouncilAsTemplate } from '../../api';
import type { CouncilFingerprint as CouncilFingerprintType, CouncilTemplate } from '../../types';
import type { RoleType } from '@/types';

interface SaveCouncilModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: CouncilTemplate) => void;
  projectId: string;
  councilConfig: {
    members: Array<{
      model_key: string;
      display_name: string;
      role: string;
      weight: number;
    }>;
  };
}

// Preset icons
const ICONS = ['🏛️', '⚡', '🎯', '🔬', '📊', '🌟', '🚀', '💡', '🤖', '🧠', '⚖️', '🔮'];

export function SaveCouncilModal({
  isOpen,
  onClose,
  onSave,
  projectId,
  councilConfig,
}: SaveCouncilModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🏛️');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a template name');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const template = await saveCouncilAsTemplate(
        projectId,
        councilConfig,
        name.trim(),
        description.trim() || undefined,
        icon
      );
      onSave(template);
      handleClose();
    } catch (err) {
      console.error('Failed to save template:', err);
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setIcon('🏛️');
    setError(null);
    onClose();
  };

  // Convert council config to fingerprint format
  const fingerprintMembers: CouncilFingerprintType[] = councilConfig.members.map((m) => ({
    modelKey: m.model_key,
    displayName: m.display_name,
    role: m.role as RoleType,
  }));

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-slate-200">
                  Save Council as Template
                </h2>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Council Preview */}
              <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                  <Users className="w-4 h-4" />
                  <span>Council Configuration</span>
                </div>
                <CouncilFingerprint members={fingerprintMembers} maxVisible={6} size="md" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Icon Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setIcon(emoji)}
                        className={`
                          w-10 h-10 rounded-xl text-xl flex items-center justify-center
                          transition-all duration-150
                          ${icon === emoji
                            ? 'bg-teal-500/20 ring-2 ring-teal-500 scale-110'
                            : 'bg-slate-700/50 hover:bg-slate-700 hover:scale-105'
                          }
                        `}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label
                    htmlFor="template-name"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Template Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="template-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Research Analysis Council"
                    className="w-full px-3 py-2 rounded-lg
                      bg-slate-700/50 border border-slate-600
                      text-slate-200 placeholder-slate-500
                      focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20
                      transition-colors"
                    autoFocus
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label
                    htmlFor="template-description"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Description <span className="text-slate-500">(optional)</span>
                  </label>
                  <textarea
                    id="template-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe when to use this council configuration..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg resize-none
                      bg-slate-700/50 border border-slate-600
                      text-slate-200 placeholder-slate-500
                      focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20
                      transition-colors"
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium
                      text-slate-400 hover:text-slate-200 hover:bg-slate-700/50
                      transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                      bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500
                      text-white shadow-lg shadow-teal-500/20
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Template
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
