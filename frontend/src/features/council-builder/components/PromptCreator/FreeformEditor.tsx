import { useState } from 'react';
import { Sparkles, Loader2, Plus, X, Trash2 } from 'lucide-react';
import { useSessionStore, useCouncilStore } from '@/store';
import { orchestratorApi, type PromptEnhanceResponse } from '@/api/orchestrator';
import { AttachmentUploader } from './AttachmentUploader';
import { VisionWarning } from './VisionWarning';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import type { PromptAttachment } from '@/types';

interface FreeformEditorProps {
  onEnhanceStart?: () => void;
  onEnhanceComplete?: (result: PromptEnhanceResponse) => void;
}

export function FreeformEditor({ onEnhanceStart, onEnhanceComplete }: FreeformEditorProps) {
  const { prompt, updatePrompt, resetPrompt } = useSessionStore();
  const { selectedModels, availableModels, setAvailableModels } = useCouncilStore();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [newConstraint, setNewConstraint] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Check if prompt has any content
  const hasContent = prompt.content.trim() || prompt.objective || prompt.audience ||
                     prompt.context || prompt.constraints.length > 0 || prompt.attachments.length > 0;

  // Vision model checks
  const hasAttachments = prompt.attachments.length > 0;
  const nonVisionModels = selectedModels.filter((m) => {
    const modelInfo = availableModels.find((am) => am.id === m.model_id);
    return modelInfo && !modelInfo.supports_vision;
  });
  const showVisionWarning = hasAttachments && nonVisionModels.length > 0;

  // Attachment handlers
  const handleAttach = (attachment: PromptAttachment) => {
    updatePrompt({ attachments: [...prompt.attachments, attachment] });
  };

  const handleRemoveAttachment = (id: string) => {
    updatePrompt({ attachments: prompt.attachments.filter((a) => a.id !== id) });
  };

  const handleFilterVision = () => {
    // Filter available models to show only vision-capable ones
    const visionModels = availableModels.filter((m) => m.supports_vision);
    setAvailableModels(visionModels);
  };

  const handleClearPrompt = () => {
    resetPrompt();
    setShowClearConfirm(false);
  };

  const handleEnhance = async () => {
    if (!prompt.content.trim()) return;

    setIsEnhancing(true);
    setEnhanceError(null);
    onEnhanceStart?.();

    try {
      const result = await orchestratorApi.enhancePrompt({
        content: prompt.content,
        objective: prompt.objective,
        constraints: prompt.constraints,
        context: prompt.context,
        audience: prompt.audience,
      });
      onEnhanceComplete?.(result);
    } catch (err) {
      console.error('Failed to enhance prompt:', err);
      setEnhanceError('Failed to enhance prompt. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main prompt content */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-text-secondary">
            Your Question or Task
          </label>
          <div className="flex items-center gap-2">
            {/* Clear button with confirmation */}
            {showClearConfirm ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                <span className="text-xs text-red-400">Clear all?</span>
                <button
                  onClick={handleClearPrompt}
                  className="px-2 py-0.5 text-xs font-medium rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-0.5 text-xs font-medium rounded bg-bg-tertiary text-text-secondary hover:bg-bg-secondary transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={!hasContent}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full
                         bg-bg-tertiary text-text-secondary hover:bg-red-500/10 hover:text-red-400
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Clear all fields"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
            {/* Enhance button */}
            <button
              data-tour="enhance-button"
              onClick={handleEnhance}
              disabled={!prompt.content.trim() || isEnhancing}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full
                       bg-accent/10 text-accent hover:bg-accent/20
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Enhance with AI
                </>
              )}
            </button>
          </div>
        </div>
        <div className="relative">
          <textarea
            data-tour="prompt-input"
            value={prompt.content}
            onChange={(e) => updatePrompt({ content: e.target.value })}
            placeholder="What would you like the council to deliberate on?"
            className="w-full h-32 px-4 py-3 pr-12 rounded-lg border border-border bg-bg-primary
                     text-text-primary placeholder:text-text-muted resize-none
                     focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-colors"
          />
          <div className="absolute right-3 bottom-3 z-10">
            <VoiceInputButton
              onTranscribe={(text) => {
                updatePrompt({
                  content: prompt.content + (prompt.content ? ' ' : '') + text,
                });
              }}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Enhance error */}
      {enhanceError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-500">{enhanceError}</p>
        </div>
      )}

      {/* Objective */}
      <div data-tour="prompt-fields">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-text-secondary">
            Objective (Optional)
          </label>
          <VoiceInputButton
            onTranscribe={(text) => updatePrompt({ objective: text })}
            size="sm"
          />
        </div>
        <input
          type="text"
          value={prompt.objective || ''}
          onChange={(e) => updatePrompt({ objective: e.target.value || null })}
          placeholder="What outcome are you looking for?"
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-primary
                   text-text-primary placeholder:text-text-muted
                   focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-colors"
        />
      </div>

      {/* Target Audience */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-text-secondary">
            Target Audience (Optional)
          </label>
          <VoiceInputButton
            onTranscribe={(text) => updatePrompt({ audience: text })}
            size="sm"
          />
        </div>
        <input
          type="text"
          value={prompt.audience || ''}
          onChange={(e) => updatePrompt({ audience: e.target.value || null })}
          placeholder="Who is this decision for?"
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-primary
                   text-text-primary placeholder:text-text-muted
                   focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-colors"
        />
      </div>

      {/* Context */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-text-secondary">
            Context (Optional)
          </label>
          <VoiceInputButton
            onTranscribe={(text) => {
              updatePrompt({
                context: (prompt.context || '') + (prompt.context ? '\n' : '') + text,
              });
            }}
            size="sm"
          />
        </div>
        <textarea
          value={prompt.context || ''}
          onChange={(e) => updatePrompt({ context: e.target.value || null })}
          placeholder="Provide any background information or context that would help the council..."
          className="w-full h-20 px-4 py-3 rounded-lg border border-border bg-bg-primary
                   text-text-primary placeholder:text-text-muted resize-none
                   focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-colors"
        />
      </div>

      {/* Constraints */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-text-secondary">
            Constraints (Optional)
          </label>
          <VoiceInputButton
            onTranscribe={(text) => {
              updatePrompt({ constraints: [...prompt.constraints, text.trim()] });
            }}
            size="sm"
          />
        </div>
        <div className="space-y-2">
          {prompt.constraints.map((constraint, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg-secondary text-sm text-text-primary">
                {constraint}
              </span>
              <button
                onClick={() => {
                  const newConstraints = prompt.constraints.filter((_, i) => i !== index);
                  updatePrompt({ constraints: newConstraints });
                }}
                className="p-1.5 rounded hover:bg-red-500/10 transition-colors"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newConstraint}
              onChange={(e) => setNewConstraint(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newConstraint.trim()) {
                  e.preventDefault();
                  updatePrompt({ constraints: [...prompt.constraints, newConstraint.trim()] });
                  setNewConstraint('');
                }
              }}
              placeholder="Add a constraint (press Enter)"
              className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-bg-primary
                       text-text-primary placeholder:text-text-muted
                       focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-colors"
            />
            <button
              onClick={() => {
                if (newConstraint.trim()) {
                  updatePrompt({ constraints: [...prompt.constraints, newConstraint.trim()] });
                  setNewConstraint('');
                }
              }}
              disabled={!newConstraint.trim()}
              className="px-3 py-2.5 rounded-lg bg-accent/10 text-accent font-medium
                       hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Attachments (Optional)
        </label>
        <AttachmentUploader
          attachments={prompt.attachments}
          onAttach={handleAttach}
          onRemove={handleRemoveAttachment}
        />
      </div>

      {/* Vision Warning */}
      {showVisionWarning && (
        <VisionWarning
          nonVisionCount={nonVisionModels.length}
          totalCount={selectedModels.length}
          onFilterVision={handleFilterVision}
        />
      )}
    </div>
  );
}
