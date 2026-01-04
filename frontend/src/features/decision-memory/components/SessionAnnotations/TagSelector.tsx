/**
 * TagSelector - Tag selection with create-new option
 * Allows users to add/remove tags from sessions
 */

import { useState, useRef, useEffect } from 'react';
import { Tag as TagIcon, Plus, X, Check, Loader2 } from 'lucide-react';
import { useDecisionMemoryStore } from '@/store';
import { createTag, addSessionTag, removeSessionTag } from '../../api';
import type { Tag, TagSummary } from '../../types';

interface TagSelectorProps {
  sessionId: string;
  projectId: string;
  selectedTags: TagSummary[];
  onTagsChange: (tags: TagSummary[]) => void;
  className?: string;
}

// Preset colors for new tags
const TAG_COLORS = [
  '#5eead4', // teal (default)
  '#f97316', // orange
  '#a855f7', // purple
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#eab308', // yellow
  '#ec4899', // pink
];

export function TagSelector({
  sessionId,
  projectId,
  selectedTags,
  onTagsChange,
  className = '',
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { projectTags, loadProjectTags, tagsLoading } = useDecisionMemoryStore();

  // Load tags when opening
  useEffect(() => {
    if (isOpen && projectId) {
      loadProjectTags(projectId);
    }
  }, [isOpen, projectId, loadProjectTags]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setIsCreating(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredTags = projectTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isTagSelected = (tagId: string) =>
    selectedTags.some((t) => t.id === tagId);

  const handleToggleTag = async (tag: Tag) => {
    if (isTagSelected(tag.id)) {
      // Remove tag
      try {
        await removeSessionTag(sessionId, tag.id);
        onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
      } catch (error) {
        console.error('Failed to remove tag:', error);
      }
    } else {
      // Add tag
      try {
        await addSessionTag(sessionId, tag.id);
        onTagsChange([...selectedTags, { id: tag.id, name: tag.name, color: tag.color }]);
      } catch (error) {
        console.error('Failed to add tag:', error);
      }
    }
  };

  const handleCreateTag = async () => {
    if (!searchQuery.trim()) return;

    setIsCreating(true);
    try {
      const newTag = await createTag(projectId, {
        name: searchQuery.trim(),
        color: selectedColor,
      });

      // Automatically select the new tag
      await addSessionTag(sessionId, newTag.id);
      onTagsChange([...selectedTags, { id: newTag.id, name: newTag.name, color: newTag.color }]);

      setSearchQuery('');
      loadProjectTags(projectId);
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await removeSessionTag(sessionId, tagId);
      onTagsChange(selectedTags.filter((t) => t.id !== tagId));
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  const showCreateOption =
    searchQuery.trim() &&
    !filteredTags.some((t) => t.name.toLowerCase() === searchQuery.toLowerCase());

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Selected Tags Display */}
      <div className="flex flex-wrap items-center gap-2 min-h-[32px]">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
          >
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="hover:bg-white/10 rounded p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs
            text-slate-400 hover:text-teal-400 hover:bg-slate-700/50
            border border-dashed border-slate-600 hover:border-teal-500/50
            transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add tag
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-64 rounded-lg
          bg-slate-800 border border-slate-700 shadow-xl z-20">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-700/50">
            <div className="relative">
              <TagIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or create tag..."
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md
                  bg-slate-700/50 border border-slate-600
                  text-slate-200 placeholder-slate-500
                  focus:outline-none focus:border-teal-500/50"
              />
            </div>
          </div>

          {/* Tags List */}
          <div className="max-h-48 overflow-y-auto p-1">
            {tagsLoading ? (
              <div className="py-4 text-center">
                <Loader2 className="w-4 h-4 animate-spin mx-auto text-teal-400" />
              </div>
            ) : filteredTags.length === 0 && !showCreateOption ? (
              <div className="py-4 text-center text-sm text-slate-500">
                No tags found
              </div>
            ) : (
              <>
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md
                      hover:bg-slate-700/50 transition-colors text-left"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm text-slate-300 flex-1">{tag.name}</span>
                    {isTagSelected(tag.id) && (
                      <Check className="w-4 h-4 text-teal-400" />
                    )}
                  </button>
                ))}

                {/* Create new tag option */}
                {showCreateOption && (
                  <>
                    <div className="border-t border-slate-700/50 my-1" />
                    <div className="px-2 py-1.5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-slate-400">Create:</span>
                        <span className="text-sm text-slate-200">{searchQuery}</span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-5 h-5 rounded-full transition-transform
                              ${selectedColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-800 scale-110' : 'hover:scale-110'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={handleCreateTag}
                        disabled={isCreating}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5
                          rounded-md bg-teal-500/20 text-teal-400 text-sm font-medium
                          hover:bg-teal-500/30 transition-colors disabled:opacity-50"
                      >
                        {isCreating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Create tag
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
