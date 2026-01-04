/**
 * AnnotationPanel - Main annotation panel for sessions
 * Appears in SynthesisPhase after completion
 * Includes rating, notes, and tags
 */

import { useState, useEffect } from 'react';
import { Star, Tag, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarRating } from './StarRating';
import { TagSelector } from './TagSelector';
import { NotesEditor } from './NotesEditor';
import { useDecisionMemoryStore } from '@/store';
import { getSessionTags } from '../../api';
import type { TagSummary } from '../../types';

interface AnnotationPanelProps {
  sessionId: string;
  projectId: string;
  variant?: 'inline' | 'card' | 'compact';
  defaultExpanded?: boolean;
  className?: string;
}

export function AnnotationPanel({
  sessionId,
  projectId,
  variant = 'card',
  defaultExpanded = true,
  className = '',
}: AnnotationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [sessionTags, setSessionTags] = useState<TagSummary[]>([]);
  const [_isLoadingTags, setIsLoadingTags] = useState(true);

  const { currentAnnotation, loadAnnotation, saveAnnotation } = useDecisionMemoryStore();

  // Load annotation and tags on mount
  useEffect(() => {
    if (sessionId) {
      loadAnnotation(sessionId);
      loadSessionTags();
    }
  }, [sessionId, loadAnnotation]);

  const loadSessionTags = async () => {
    setIsLoadingTags(true);
    try {
      const tags = await getSessionTags(sessionId);
      setSessionTags(tags);
    } catch (error) {
      console.error('Failed to load session tags:', error);
    } finally {
      setIsLoadingTags(false);
    }
  };

  const handleRatingChange = async (rating: number | null) => {
    try {
      await saveAnnotation(sessionId, { rating });
    } catch (error) {
      console.error('Failed to save rating:', error);
    }
  };

  const handleNotesChange = async (notes: string | null) => {
    try {
      await saveAnnotation(sessionId, { notes });
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  const handleTagsChange = (tags: TagSummary[]) => {
    setSessionTags(tags);
  };

  // Compact variant - just rating and tags inline
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <StarRating
          value={currentAnnotation?.rating ?? null}
          onChange={handleRatingChange}
          size="sm"
        />
        <div className="flex flex-wrap gap-1">
          {sessionTags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="px-1.5 py-0.5 text-[10px] rounded-full"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {sessionTags.length > 3 && (
            <span className="text-[10px] text-slate-500">+{sessionTags.length - 3}</span>
          )}
        </div>
      </div>
    );
  }

  // Inline variant - horizontal layout
  if (variant === 'inline') {
    return (
      <div className={`flex items-start gap-6 ${className}`}>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          <StarRating
            value={currentAnnotation?.rating ?? null}
            onChange={handleRatingChange}
            size="md"
          />
        </div>

        <div className="flex-1 min-w-0">
          <TagSelector
            sessionId={sessionId}
            projectId={projectId}
            selectedTags={sessionTags}
            onTagsChange={handleTagsChange}
          />
        </div>
      </div>
    );
  }

  // Card variant - collapsible panel
  return (
    <div
      className={`rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden ${className}`}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3
          hover:bg-slate-700/20 transition-colors text-left"
      >
        <Sparkles className="w-5 h-5 text-teal-400" />
        <span className="flex-1 font-medium text-slate-200">Session Annotations</span>

        {/* Quick preview when collapsed */}
        {!isExpanded && (
          <div className="flex items-center gap-3 mr-2">
            <StarRating
              value={currentAnnotation?.rating ?? null}
              onChange={() => {}}
              size="sm"
              readonly
            />
            {sessionTags.length > 0 && (
              <span className="text-xs text-slate-500">
                {sessionTags.length} tag{sessionTags.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 space-y-5 border-t border-slate-700/50 pt-4">
              {/* Rating Section */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-slate-300">Rating</span>
                </div>
                <StarRating
                  value={currentAnnotation?.rating ?? null}
                  onChange={handleRatingChange}
                  size="lg"
                  showLabel
                />
              </div>

              {/* Tags Section */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-teal-400" />
                  <span className="text-sm font-medium text-slate-300">Tags</span>
                </div>
                <TagSelector
                  sessionId={sessionId}
                  projectId={projectId}
                  selectedTags={sessionTags}
                  onTagsChange={handleTagsChange}
                />
              </div>

              {/* Notes Section */}
              <NotesEditor
                value={currentAnnotation?.notes ?? null}
                onChange={handleNotesChange}
                autoSave
                autoSaveDelay={1500}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
