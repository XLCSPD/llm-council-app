/**
 * CommandPalette - Main command palette modal
 * Portal-rendered modal triggered by ⌘K/Ctrl+K
 * Provides quick access to session search and re-run actions
 */

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CommandInput } from './CommandInput';
import { CommandResults } from './CommandResults';
import { useDecisionMemoryStore, useCouncilStore, useSessionStore } from '@/store';
import type { QuickSearchResult, RerunAction, SearchFilterType } from '../../types';

export function CommandPalette() {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const {
    commandPaletteOpen,
    commandQuery,
    commandResults,
    commandLoading,
    activeFilter,
    closeCommandPalette,
    setCommandQuery,
    setActiveFilter,
    prepareRerun,
  } = useDecisionMemoryStore();

  const { setSelectedModels } = useCouncilStore();
  const { updatePrompt, resetSession, loadSessionForReplay } = useSessionStore();

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [commandResults]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!commandPaletteOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < commandResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (commandResults[selectedIndex]) {
            handleSelect(commandResults[selectedIndex]);
          }
          break;
        case 'Tab':
          e.preventDefault();
          // Cycle through filters
          const filters: SearchFilterType[] = ['all', 'prompts', 'councils', 'tags'];
          const currentIdx = filters.indexOf(activeFilter || 'all');
          const nextIdx = (currentIdx + 1) % filters.length;
          const nextFilter = filters[nextIdx] ?? 'all';
          setActiveFilter(nextFilter);
          break;
        case 'Escape':
          e.preventDefault();
          closeCommandPalette();
          break;
      }
    },
    [commandPaletteOpen, commandResults, selectedIndex, activeFilter]
  );

  // Attach keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle selecting a result (view session)
  const handleSelect = (result: QuickSearchResult) => {
    closeCommandPalette();
    loadSessionForReplay(result.session_id);
    navigate('/');
  };

  // Handle action buttons (reuse prompt, reuse council, re-run exact)
  const handleAction = async (result: QuickSearchResult, action: RerunAction) => {
    closeCommandPalette();

    try {
      const { prompt, council } = await prepareRerun(action, result.session_id);

      // Reset current session state
      resetSession();

      // Apply reused data
      if (prompt) {
        updatePrompt(prompt);
      }
      if (council) {
        setSelectedModels(council);
      }

      // Navigate to setup phase
      navigate('/');
    } catch (error) {
      console.error('Failed to prepare re-run:', error);
    }
  };

  // Don't render if not open
  if (!commandPaletteOpen) return null;

  return createPortal(
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm"
            onClick={closeCommandPalette}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-x-0 top-[10vh] z-50 mx-auto max-w-2xl px-4"
          >
            <div
              className="overflow-hidden rounded-2xl bg-slate-800/95 backdrop-blur-xl
                border border-slate-700/50 shadow-2xl shadow-black/50
                ring-1 ring-white/5"
            >
              <CommandInput
                value={commandQuery}
                onChange={setCommandQuery}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                isLoading={commandLoading}
                onClose={closeCommandPalette}
              />

              <CommandResults
                results={commandResults}
                selectedIndex={selectedIndex}
                isLoading={commandLoading}
                query={commandQuery}
                onSelect={handleSelect}
                onAction={handleAction}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
