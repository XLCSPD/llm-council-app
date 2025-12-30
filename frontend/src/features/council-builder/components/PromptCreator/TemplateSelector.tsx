import { useState } from 'react';
import {
  Scale,
  Lightbulb,
  Sparkles,
  ListChecks,
  Target,
  AlertTriangle,
  Grid,
  BarChart,
  X,
} from 'lucide-react';
import { PROMPT_TEMPLATES, TEMPLATE_CATEGORIES, fillTemplate, type PromptTemplate } from './templates';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Scale,
  Lightbulb,
  Sparkles,
  ListChecks,
  Target,
  AlertTriangle,
  Grid,
  BarChart,
};

interface TemplateSelectorProps {
  onSelect: (template: PromptTemplate['template']) => void;
  onClose?: () => void;
}

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});

  const filteredTemplates =
    selectedCategory === 'all'
      ? PROMPT_TEMPLATES
      : PROMPT_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    // Initialize placeholder values with empty strings
    const values: Record<string, string> = {};
    template.placeholders.forEach((p) => {
      values[p.key] = '';
    });
    setPlaceholderValues(values);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;
    const filled = fillTemplate(selectedTemplate, placeholderValues);
    onSelect(filled);
    setSelectedTemplate(null);
    setPlaceholderValues({});
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setPlaceholderValues({});
  };

  // Template detail/customization view
  if (selectedTemplate) {
    const IconComponent = iconMap[selectedTemplate.icon];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to templates
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-bg-tertiary rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {IconComponent && (
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-accent" />
            </div>
          )}
          <div>
            <h3 className="font-medium text-text-primary">{selectedTemplate.name}</h3>
            <p className="text-sm text-text-secondary">{selectedTemplate.description}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text-secondary">Customize your prompt</h4>
          {selectedTemplate.placeholders.map((placeholder) => (
            <div key={placeholder.key}>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {placeholder.label}
              </label>
              <input
                type="text"
                value={placeholderValues[placeholder.key] || ''}
                onChange={(e) =>
                  setPlaceholderValues((prev) => ({
                    ...prev,
                    [placeholder.key]: e.target.value,
                  }))
                }
                placeholder={placeholder.example}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary
                         text-text-primary placeholder:text-text-muted
                         focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-colors"
              />
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-bg-tertiary border border-border">
          <h4 className="text-xs font-medium text-text-muted uppercase mb-2">Preview</h4>
          <p className="text-sm text-text-primary whitespace-pre-wrap">
            {fillTemplate(selectedTemplate, placeholderValues).content}
          </p>
        </div>

        <button
          onClick={handleApplyTemplate}
          disabled={Object.values(placeholderValues).some((v) => !v.trim())}
          className="w-full px-4 py-2.5 bg-accent text-white font-medium rounded-lg
                   hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Use This Template
        </button>
      </div>
    );
  }

  // Template gallery view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">Choose a template</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-tertiary rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {TEMPLATE_CATEGORIES.map((category) => {
          const IconComponent = iconMap[category.icon];
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedCategory === category.id
                  ? 'bg-accent text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              }`}
            >
              {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Template cards */}
      <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
        {filteredTemplates.map((template) => {
          const IconComponent = iconMap[template.icon];
          return (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-bg-secondary
                       hover:border-accent hover:bg-bg-tertiary transition-colors text-left"
            >
              {IconComponent && (
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-4 h-4 text-accent" />
                </div>
              )}
              <div>
                <div className="font-medium text-text-primary">{template.name}</div>
                <div className="text-sm text-text-secondary">{template.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
