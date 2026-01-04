import { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileCode, ChevronDown } from 'lucide-react';
import { exportResponseAsMarkdown, exportResponseAsPdf } from '../lib/singleResponseExport';
import type { RoleType } from '@/types';

interface ResponseExportMenuProps {
  modelName: string;
  role: RoleType | string;
  content: string;
  metadata: {
    latency_ms: number;
    token_count: number;
    timestamp: string;
  };
  promptContent?: string;
  variant?: 'icon' | 'button';
  className?: string;
}

/**
 * Dropdown menu for exporting individual model responses
 * Supports markdown and PDF export formats
 */
export function ResponseExportMenu({
  modelName,
  role,
  content,
  metadata,
  promptContent,
  variant = 'icon',
  className = '',
}: ResponseExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleExportMarkdown = () => {
    exportResponseAsMarkdown(modelName, role, content, metadata);
    setIsOpen(false);
  };

  const handleExportPdf = () => {
    exportResponseAsPdf(modelName, role, content, metadata, promptContent);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className={`relative inline-block ${className}`}>
      {variant === 'icon' ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-teal-400 hover:bg-slate-700/50"
          title="Export response"
          aria-label="Export response"
          aria-expanded={isOpen}
        >
          <Download className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
            rounded-lg transition-all duration-200
            bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white"
          aria-expanded={isOpen}
        >
          <Download className="w-4 h-4" />
          Export
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-48 rounded-lg
            bg-slate-800 border border-slate-700 shadow-xl shadow-black/30
            py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
          role="menu"
        >
          <button
            onClick={handleExportMarkdown}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm
              text-slate-300 hover:text-white hover:bg-slate-700/50
              transition-colors text-left"
            role="menuitem"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="font-medium">Markdown</div>
              <div className="text-xs text-slate-500">.md file</div>
            </div>
          </button>

          <button
            onClick={handleExportPdf}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm
              text-slate-300 hover:text-white hover:bg-slate-700/50
              transition-colors text-left"
            role="menuitem"
          >
            <FileText className="w-4 h-4 text-teal-400" />
            <div>
              <div className="font-medium">PDF</div>
              <div className="text-xs text-slate-500">Formatted document</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
