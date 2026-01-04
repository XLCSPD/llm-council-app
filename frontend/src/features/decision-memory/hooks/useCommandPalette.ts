/**
 * useCommandPalette - Hook for command palette keyboard shortcut
 * Registers ⌘K/Ctrl+K to toggle the command palette
 */

import { useEffect } from 'react';
import { useDecisionMemoryStore } from '@/store';

/**
 * Hook to register the ⌘K/Ctrl+K keyboard shortcut
 * Should be called once in App.tsx or a top-level component
 */
export function useCommandPalette() {
  const { toggleCommandPalette, commandPaletteOpen } = useDecisionMemoryStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K on Mac, Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette]);

  return { isOpen: commandPaletteOpen };
}
