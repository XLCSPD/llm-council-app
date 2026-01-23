import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { colors } from '../styles/colors';

interface ModelNodeProps {
  name: string;
  color: string;
  angle: number; // starting angle in radians
  radius: number;
  orbitSpeed?: number;
  enterDelay?: number;
  size?: number;
}

export const ModelNode: React.FC<ModelNodeProps> = ({
  name,
  color,
  angle,
  radius,
  orbitSpeed = 0.02,
  enterDelay = 0,
  size = 50,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry animation
  const progress = spring({
    fps,
    frame,
    config: { damping: 100, stiffness: 150 },
    delay: enterDelay,
  });

  // Calculate orbital position
  const currentAngle = angle + frame * orbitSpeed;
  const x = Math.cos(currentAngle) * radius * progress;
  const y = Math.sin(currentAngle) * radius * 0.4 * progress; // Elliptical orbit

  // Pulse effect
  const pulse = interpolate(
    Math.sin(frame * 0.1 + angle),
    [-1, 1],
    [0.95, 1.05]
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${progress * pulse})`,
        opacity: progress,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}40, ${color}80)`,
          border: `2px solid ${color}`,
          boxShadow: `0 0 20px ${color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{
          color: colors.textPrimary,
          fontSize: 8,
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: 1.1,
        }}>
          {name}
        </span>
      </div>
    </div>
  );
};
