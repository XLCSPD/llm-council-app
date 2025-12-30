import { useState } from 'react';
import { Sparkles, Check, X, ArrowRight, Plus } from 'lucide-react';
import { useSessionStore } from '@/store';
import type { PromptEnhanceResponse } from '@/api/orchestrator';

interface AIEnhancerProps {
  enhancement: PromptEnhanceResponse;
  onClose: () => void;
}

export function AIEnhancer({ enhancement, onClose }: AIEnhancerProps) {
  const { prompt, updatePrompt } = useSessionStore();
  const [appliedChanges, setAppliedChanges] = useState<Set<string>>(new Set());

  const hasChanges = enhancement.enhanced_content !== enhancement.original_content;
  const hasSuggestions =
    enhancement.suggested_objective ||
    enhancement.suggested_constraints.length > 0 ||
    enhancement.suggested_context ||
    enhancement.suggested_audience;

  const applyChange = (key: string, value: unknown) => {
    switch (key) {
      case 'content':
        updatePrompt({ content: value as string });
        break;
      case 'objective':
        updatePrompt({ objective: value as string | null });
        break;
      case 'context':
        updatePrompt({ context: value as string | null });
        break;
      case 'audience':
        updatePrompt({ audience: value as string | null });
        break;
      case 'constraints':
        updatePrompt({ constraints: value as string[] });
        break;
    }
    setAppliedChanges((prev) => new Set(prev).add(key));
  };

  const applyAll = () => {
    if (hasChanges) {
      updatePrompt({ content: enhancement.enhanced_content });
    }
    if (enhancement.suggested_objective) {
      updatePrompt({ objective: enhancement.suggested_objective });
    }
    if (enhancement.suggested_context) {
      updatePrompt({ context: enhancement.suggested_context });
    }
    if (enhancement.suggested_audience) {
      updatePrompt({ audience: enhancement.suggested_audience });
    }
    if (enhancement.suggested_constraints.length > 0) {
      updatePrompt({
        constraints: [...prompt.constraints, ...enhancement.suggested_constraints],
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary rounded-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-bg-secondary z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="font-medium text-text-primary">AI Enhancement Suggestions</h2>
              <p className="text-xs text-text-muted">Review and apply improvements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-bg-tertiary rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Improvements list */}
          {enhancement.improvements.length > 0 && (
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
              <h3 className="text-sm font-medium text-accent mb-2">Improvements Made</h3>
              <ul className="space-y-1">
                {enhancement.improvements.map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Enhanced content */}
          {hasChanges && (
            <SuggestionCard
              title="Enhanced Question"
              original={enhancement.original_content}
              suggested={enhancement.enhanced_content}
              applied={appliedChanges.has('content')}
              onApply={() => applyChange('content', enhancement.enhanced_content)}
            />
          )}

          {/* Suggested objective */}
          {enhancement.suggested_objective && !prompt.objective && (
            <SuggestionCard
              title="Suggested Objective"
              suggested={enhancement.suggested_objective}
              applied={appliedChanges.has('objective')}
              onApply={() => applyChange('objective', enhancement.suggested_objective)}
            />
          )}

          {/* Suggested audience */}
          {enhancement.suggested_audience && !prompt.audience && (
            <SuggestionCard
              title="Suggested Audience"
              suggested={enhancement.suggested_audience}
              applied={appliedChanges.has('audience')}
              onApply={() => applyChange('audience', enhancement.suggested_audience)}
            />
          )}

          {/* Suggested context */}
          {enhancement.suggested_context && !prompt.context && (
            <SuggestionCard
              title="Suggested Context"
              suggested={enhancement.suggested_context}
              applied={appliedChanges.has('context')}
              onApply={() => applyChange('context', enhancement.suggested_context)}
            />
          )}

          {/* Suggested constraints */}
          {enhancement.suggested_constraints.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-bg-tertiary">
                <h3 className="text-sm font-medium text-text-primary">Suggested Constraints</h3>
                {!appliedChanges.has('constraints') && (
                  <button
                    onClick={() =>
                      applyChange('constraints', [
                        ...prompt.constraints,
                        ...enhancement.suggested_constraints,
                      ])
                    }
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10 rounded transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add All
                  </button>
                )}
              </div>
              <div className="p-3 space-y-2">
                {enhancement.suggested_constraints.map((constraint, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded bg-bg-primary border border-border"
                  >
                    <span className="text-sm text-text-primary">{constraint}</span>
                    {appliedChanges.has('constraints') ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <button
                        onClick={() => {
                          updatePrompt({ constraints: [...prompt.constraints, constraint] });
                        }}
                        className="p-1 hover:bg-accent/10 rounded transition-colors"
                      >
                        <Plus className="w-4 h-4 text-accent" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasChanges && !hasSuggestions && (
            <div className="text-center py-8">
              <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-medium text-text-primary mb-1">Your prompt looks great!</h3>
              <p className="text-sm text-text-secondary">
                No significant improvements were identified.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border sticky bottom-0 bg-bg-secondary">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Skip
          </button>
          <button
            onClick={applyAll}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white font-medium rounded-lg
                     hover:bg-accent/90 transition-colors"
          >
            Apply All Suggestions
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  title: string;
  original?: string;
  suggested: string;
  applied: boolean;
  onApply: () => void;
}

function SuggestionCard({ title, original, suggested, applied, onApply }: SuggestionCardProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-bg-tertiary">
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
        {applied ? (
          <span className="flex items-center gap-1 text-xs text-green-500">
            <Check className="w-3 h-3" />
            Applied
          </span>
        ) : (
          <button
            onClick={onApply}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10 rounded transition-colors"
          >
            <Check className="w-3 h-3" />
            Apply
          </button>
        )}
      </div>
      <div className="p-3 space-y-2">
        {original && (
          <div>
            <span className="text-xs text-text-muted">Original:</span>
            <p className="text-sm text-text-secondary line-through">{original}</p>
          </div>
        )}
        <div>
          {original && <span className="text-xs text-text-muted">Enhanced:</span>}
          <p className="text-sm text-text-primary">{suggested}</p>
        </div>
      </div>
    </div>
  );
}
