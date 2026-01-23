import React from 'react';
import { colors, glows } from '../styles/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  glow?: boolean;
  glowColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style = {},
  glow = false,
  glowColor = glows.teal,
}) => {
  return (
    <div
      style={{
        background: colors.glassBg,
        border: `1px solid ${colors.glassBorder}`,
        borderRadius: 16,
        padding: 24,
        boxShadow: glow ? glowColor : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
