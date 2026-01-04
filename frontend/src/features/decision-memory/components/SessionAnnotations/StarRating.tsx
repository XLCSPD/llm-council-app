/**
 * StarRating - Interactive star rating input
 * Allows users to rate sessions 1-5 stars
 */

import { useState } from 'react';

interface StarRatingProps {
  value: number | null;
  onChange: (rating: number | null) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showLabel?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function StarRating({
  value,
  onChange,
  size = 'md',
  readonly = false,
  showLabel = false,
  className = '',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleClick = (rating: number) => {
    if (readonly) return;
    // Toggle off if clicking the same value
    onChange(value === rating ? null : rating);
  };

  const displayValue = hoverValue ?? value ?? 0;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !readonly && setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            className={`
              transition-all duration-150
              ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
              ${star <= displayValue ? 'text-amber-400' : 'text-slate-600'}
            `}
            title={readonly ? `${value || 0} stars` : `Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <svg
              className={SIZE_CLASSES[size]}
              viewBox="0 0 20 20"
              fill={star <= displayValue ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>

      {showLabel && (
        <span className="text-xs text-slate-400 ml-1">
          {value ? `${value}/5` : 'Not rated'}
        </span>
      )}
    </div>
  );
}
