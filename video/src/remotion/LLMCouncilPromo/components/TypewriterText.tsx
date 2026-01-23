import React from 'react';
import { useCurrentFrame } from 'remotion';

interface TypewriterTextProps {
  text: string;
  startFrame?: number;
  speed?: number; // frames per character
  style?: React.CSSProperties;
  className?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame = 0,
  speed = 2,
  style = {},
  className = '',
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const charsToShow = Math.floor(elapsed / speed);
  const displayText = text.slice(0, Math.min(charsToShow, text.length));

  return (
    <span style={style} className={className}>
      {displayText}
      {charsToShow < text.length && (
        <span
          style={{
            opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
            marginLeft: 2,
          }}
        >
          |
        </span>
      )}
    </span>
  );
};
