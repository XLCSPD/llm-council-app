import { useState } from 'react';
import { FileEdit, LayoutTemplate, Wand2 } from 'lucide-react';
import { useSessionStore } from '@/store';
import type { PromptEnhanceResponse } from '@/api/orchestrator';
import type { PromptTemplate } from './templates';
import { FreeformEditor } from './FreeformEditor';
import { TemplateSelector } from './TemplateSelector';
import { AIEnhancer } from './AIEnhancer';

type CreatorMode = 'freeform' | 'templates';

export function PromptCreator() {
  const { updatePrompt } = useSessionStore();
  const [mode, setMode] = useState<CreatorMode>('freeform');
  const [enhancement, setEnhancement] = useState<PromptEnhanceResponse | null>(null);

  const handleTemplateSelect = (template: PromptTemplate['template']) => {
    updatePrompt({
      content: template.content,
      objective: template.objective,
      constraints: template.constraints,
      audience: template.audience || null,
      context: template.context || null,
    });
    // Switch to freeform to let user edit
    setMode('freeform');
  };

  const handleEnhanceComplete = (result: PromptEnhanceResponse) => {
    setEnhancement(result);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Prompt</h2>

        {/* Mode toggle */}
        <div className="flex items-center bg-bg-secondary rounded-lg p-1">
          <button
            onClick={() => setMode('freeform')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              mode === 'freeform'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            Freeform
          </button>
          <button
            onClick={() => setMode('templates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              mode === 'templates'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <LayoutTemplate className="w-4 h-4" />
            Templates
          </button>
        </div>
      </div>

      {/* AI Enhancement hint */}
      {mode === 'freeform' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
          <Wand2 className="w-4 h-4 text-accent flex-shrink-0" />
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-accent">Pro tip:</span> Click "Enhance with AI" to get
            suggestions for improving your prompt.
          </p>
        </div>
      )}

      {/* Mode content */}
      {mode === 'freeform' && (
        <FreeformEditor onEnhanceComplete={handleEnhanceComplete} />
      )}

      {mode === 'templates' && (
        <TemplateSelector
          onSelect={handleTemplateSelect}
          onClose={() => setMode('freeform')}
        />
      )}

      {/* AI Enhancer modal */}
      {enhancement && (
        <AIEnhancer enhancement={enhancement} onClose={() => setEnhancement(null)} />
      )}
    </div>
  );
}

export { FreeformEditor } from './FreeformEditor';
export { TemplateSelector } from './TemplateSelector';
export { AIEnhancer } from './AIEnhancer';
