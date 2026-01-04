/**
 * TemplateSelector - Select from available council templates
 * Displays templates in a dropdown or grid view
 */

import { useState, useEffect } from 'react';
import { ChevronDown, Star, Loader2, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TemplateCard } from './TemplateCard';
import { useDecisionMemoryStore, useCouncilStore } from '@/store';
import { toggleTemplateFavorite, deleteCouncilTemplate } from '../../api';
import type { CouncilTemplate } from '../../types';

interface TemplateSelectorProps {
  projectId: string;
  variant?: 'dropdown' | 'grid' | 'list';
  onSelect?: (template: CouncilTemplate) => void;
  className?: string;
}

export function TemplateSelector({
  projectId,
  variant = 'dropdown',
  onSelect,
  className = '',
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { templates, templatesLoading, loadTemplates, useTemplate } = useDecisionMemoryStore();
  const { setSelectedModels } = useCouncilStore();

  // Load templates on mount
  useEffect(() => {
    if (projectId) {
      loadTemplates(projectId);
    }
  }, [projectId, loadTemplates]);

  const handleSelectTemplate = (template: CouncilTemplate) => {
    const members = useTemplate(template);
    setSelectedModels(members);
    setIsOpen(false);
    onSelect?.(template);
  };

  const handleToggleFavorite = async (template: CouncilTemplate) => {
    try {
      await toggleTemplateFavorite(template.id);
      loadTemplates(projectId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleDeleteTemplate = async (template: CouncilTemplate) => {
    if (!confirm(`Delete template "${template.name}"?`)) return;

    try {
      await deleteCouncilTemplate(template.id);
      loadTemplates(projectId);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  // Separate favorites from other templates
  const favorites = templates.filter((t) => t.is_favorite);
  const others = templates.filter((t) => !t.is_favorite);

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl
            bg-slate-800/50 hover:bg-slate-800/70
            border border-slate-700/50 hover:border-slate-600/50
            text-slate-200 transition-all duration-200"
        >
          <FolderOpen className="w-5 h-5 text-teal-400" />
          <span className="flex-1 text-left text-sm font-medium">
            Load from Template
          </span>
          {templatesLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : (
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 top-full mt-2 rounded-xl
                bg-slate-800 border border-slate-700 shadow-xl z-30
                max-h-80 overflow-y-auto"
            >
              {templates.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <FolderOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No templates saved yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Save a council configuration to reuse it later
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {/* Favorites section */}
                  {favorites.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 px-2 py-1 text-xs text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>Favorites</span>
                      </div>
                      {favorites.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          variant="compact"
                          onSelect={() => handleSelectTemplate(template)}
                          onToggleFavorite={() => handleToggleFavorite(template)}
                        />
                      ))}
                    </>
                  )}

                  {/* Other templates */}
                  {others.length > 0 && (
                    <>
                      {favorites.length > 0 && (
                        <div className="border-t border-slate-700/50 my-2" />
                      )}
                      <div className="px-2 py-1 text-xs text-slate-500">
                        All Templates
                      </div>
                      {others.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          variant="compact"
                          onSelect={() => handleSelectTemplate(template)}
                          onToggleFavorite={() => handleToggleFavorite(template)}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Grid variant
  if (variant === 'grid') {
    return (
      <div className={className}>
        {templatesLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-400" />
            <p className="text-sm text-slate-500 mt-2">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="py-8 text-center">
            <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No templates saved yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Save a council configuration to reuse it later
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                variant="default"
                onSelect={() => handleSelectTemplate(template)}
                onToggleFavorite={() => handleToggleFavorite(template)}
                onDelete={() => handleDeleteTemplate(template)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // List variant
  return (
    <div className={`space-y-2 ${className}`}>
      {templatesLoading ? (
        <div className="py-4 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-teal-400" />
        </div>
      ) : templates.length === 0 ? (
        <div className="py-4 text-center text-sm text-slate-500">
          No templates available
        </div>
      ) : (
        templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            variant="compact"
            onSelect={() => handleSelectTemplate(template)}
            onToggleFavorite={() => handleToggleFavorite(template)}
            onDelete={() => handleDeleteTemplate(template)}
          />
        ))
      )}
    </div>
  );
}
