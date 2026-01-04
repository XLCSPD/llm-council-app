import { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface ModelSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
}

export function ModelSearchInput({
  value,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  placeholder = 'Search models...',
  className = '',
}: ModelSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: ⌘K or Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Also support '/' key when not in an input
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Escape clears and blurs
    if (e.key === 'Escape') {
      onChange('');
      inputRef.current?.blur();
      return;
    }
    // Pass through to parent handler for arrow keys / enter
    onKeyDown?.(e);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search icon */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full pl-10 pr-16 py-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-teal-400/30 focus:ring-1 focus:ring-teal-400/20 focus:shadow-[0_0_20px_rgba(94,234,212,0.1)] transition-all duration-200"
      />

      {/* Clear button - only visible when there's text */}
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          className="absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-300 hover:bg-white/10 transition-colors duration-150"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Keyboard shortcut hint */}
      <kbd
        className={`absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-gray-500 font-mono pointer-events-none ${value ? 'hidden' : ''}`}
      >
        ⌘K
      </kbd>
    </div>
  );
}
