import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { colors, glows } from '../styles/colors';

interface GlowNodeProps {
  size?: number;
  color?: string;
  glowColor?: string;
  pulseSpeed?: number;
  enterDelay?: number;
  style?: React.CSSProperties;
}

export const GlowNode: React.FC<GlowNodeProps> = ({
  size = 20,
  color = colors.accentSecondary,
  glowColor = glows.cyan,
  pulseSpeed = 0.05,
  enterDelay = 0,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry animation
  const scale = spring({
    fps,
    frame,
    config: { damping: 100, stiffness: 150 },
    delay: enterDelay,
  });

  // Pulse animation
  const pulse = interpolate(
    Math.sin(frame * pulseSpeed),
    [-1, 1],
    [0.8, 1.2]
  );

  // Glow intensity
  const glowIntensity = interpolate(
    Math.sin(frame * pulseSpeed),
    [-1, 1],
    [0.3, 0.6]
  );

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 ${20 * glowIntensity}px ${10 * glowIntensity}px ${color}`,
        transform: `scale(${scale * pulse})`,
        ...style,
      }}
    />
  );
};
