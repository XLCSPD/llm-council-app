import { Lightbulb, AlertTriangle } from 'lucide-react';
import type { HelpContentBlock } from '../content/helpContent';

interface HelpSectionProps {
  content: HelpContentBlock[];
}

export function HelpSection({ content }: HelpSectionProps) {
  const renderBlock = (block: HelpContentBlock, index: number) => {
    switch (block.type) {
      case 'heading':
        return (
          <h3
            key={index}
            className="text-lg font-semibold text-text-primary mt-6 mb-3 first:mt-0"
          >
            {block.content as string}
          </h3>
        );

      case 'paragraph':
        return (
          <p key={index} className="text-text-secondary leading-relaxed mb-4">
            {block.content as string}
          </p>
        );

      case 'list':
        return (
          <ul key={index} className="space-y-2 mb-4 ml-4">
            {(block.content as string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-2 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );

      case 'numbered-list':
        return (
          <ol key={index} className="space-y-3 mb-4 ml-4">
            {(block.content as string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-text-secondary">
                <span className="w-6 h-6 rounded-full bg-accent-primary/10 text-accent-primary text-sm font-medium flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        );

      case 'tip':
        return (
          <div
            key={index}
            className="flex gap-3 p-4 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
          >
            <Lightbulb className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-200">{block.content as string}</p>
          </div>
        );

      case 'warning':
        return (
          <div
            key={index}
            className="flex gap-3 p-4 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-200">{block.content as string}</p>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="prose prose-invert max-w-none">{content.map(renderBlock)}</div>;
}
