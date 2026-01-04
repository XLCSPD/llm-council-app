/**
 * NotesEditor - Notes textarea with auto-save
 * Provides markdown editing for session notes
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Check, Loader2 } from 'lucide-react';

interface NotesEditorProps {
  value: string | null;
  onChange: (notes: string | null) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  autoSave?: boolean;
  autoSaveDelay?: number;
  className?: string;
}

export function NotesEditor({
  value,
  onChange,
  placeholder = 'Add notes about this session...',
  minRows = 3,
  maxRows = 8,
  autoSave = true,
  autoSaveDelay = 1000,
  className = '',
}: NotesEditorProps) {
  const [localValue, setLocalValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const minHeight = lineHeight * minRows;
    const maxHeight = lineHeight * maxRows;
    const scrollHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${scrollHeight}px`;
  }, [localValue, minRows, maxRows]);

  // Auto-save logic
  const handleSave = useCallback(async () => {
    const trimmedValue = localValue.trim() || null;
    if (trimmedValue === value) return;

    setIsSaving(true);
    try {
      await onChange(trimmedValue);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  }, [localValue, value, onChange]);

  // Debounced auto-save
  useEffect(() => {
    if (!autoSave) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, autoSaveDelay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [localValue, autoSave, autoSaveDelay, handleSave]);

  const handleBlur = () => {
    if (!autoSave) {
      handleSave();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-300">Notes</span>
        <div className="flex-1" />
        {isSaving && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </span>
        )}
        {saved && !isSaving && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg resize-none
          bg-slate-800/50 border border-slate-700/50
          text-slate-200 placeholder-slate-500 text-sm
          focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20
          transition-colors"
        style={{ minHeight: `${minRows * 1.5}rem` }}
      />

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-slate-500">
          Markdown supported
        </span>
        {!autoSave && (
          <button
            onClick={handleSave}
            disabled={isSaving || localValue === (value || '')}
            className="px-2 py-0.5 text-xs font-medium rounded
              bg-teal-500/20 text-teal-400 hover:bg-teal-500/30
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>
    </div>
  );
}
