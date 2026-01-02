import { useState } from 'react';
import { Sparkles, Loader2, Plus, X, Trash2 } from 'lucide-react';
import { useSessionStore } from '@/store';
import { orchestratorApi, type PromptEnhanceResponse } from '@/api/orchestrator';

interface FreeformEditorProps {
  onEnhanceStart?: () => void;
  onEnhanceComplete?: (result: PromptEnhanceResponse) => void;
}

export function FreeformEditor({ onEnhanceStart, onEnhanceComplete }: FreeformEditorProps) {
  const { prompt, updatePrompt, resetPrompt } = useSessionStore();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [newConstraint, setNewConstraint] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Check if prompt has any content
  const hasContent = prompt.content.trim() || prompt.objective || prompt.audience ||
                     prompt.context || prompt.constraints.length > 0;

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
        <textarea
          data-tour="prompt-input"
          value={prompt.content}
          onChange={(e) => updatePrompt({ content: e.target.value })}
          placeholder="What would you like the council to deliberate on?"
          className="w-full h-32 px-4 py-3 rounded-lg border border-border bg-bg-primary
                   text-text-primary placeholder:text-text-muted resize-none
                   focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-colors"
        />
      </div>

      {/* Enhance error */}
      {enhanceError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-500">{enhanceError}</p>
        </div>
      )}

      {/* Objective */}
      <div data-tour="prompt-fields">
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Objective (Optional)
        </label>
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
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Target Audience (Optional)
        </label>
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
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Context (Optional)
        </label>
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
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Constraints (Optional)
        </label>
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
    </div>
  );
}
