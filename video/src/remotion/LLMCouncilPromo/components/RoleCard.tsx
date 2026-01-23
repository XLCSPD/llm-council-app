import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { colors } from '../styles/colors';
import { GlassCard } from './GlassCard';

type RoleType = 'thinker' | 'critic' | 'devils_advocate' | 'synthesizer';

interface RoleCardProps {
  role: RoleType;
  modelName: string;
  enterDelay?: number;
  showSpinner?: boolean;
  responseText?: string;
  style?: React.CSSProperties;
}

const roleConfig: Record<RoleType, { color: string; icon: string; label: string }> = {
  thinker: { color: colors.roleThinker, icon: '🧠', label: 'Thinker' },
  critic: { color: colors.roleCritic, icon: '👁️', label: 'Critic' },
  devils_advocate: { color: colors.roleDevilsAdvocate, icon: '🔥', label: "Devil's Advocate" },
  synthesizer: { color: colors.roleSynthesizer, icon: '👑', label: 'Chair' },
};

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  modelName,
  enterDelay = 0,
  showSpinner = false,
  responseText,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const config = roleConfig[role];

  // Entry animation
  const progress = spring({
    fps,
    frame,
    config: { damping: 100, stiffness: 150 },
    delay: enterDelay,
  });

  const translateY = interpolate(progress, [0, 1], [50, 0]);
  const opacity = progress;

  // Spinner rotation
  const spinnerRotation = frame * 8;

  // Glow pulse
  const glowIntensity = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0.2, 0.4]
  );

  return (
    <div
      style={{
        transform: `translateY(${translateY}px)`,
        opacity,
        ...style,
      }}
    >
      <GlassCard
        glow
        glowColor={`0 0 20px ${config.color}${Math.round(glowIntensity * 255).toString(16).padStart(2, '0')}`}
        style={{
          borderLeft: `3px solid ${config.color}`,
          minWidth: 280,
          minHeight: 120,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>{config.icon}</span>
          <div>
            <div style={{
              color: config.color,
              fontWeight: 600,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              {config.label}
            </div>
            <div style={{ color: colors.textSecondary, fontSize: 12 }}>
              {modelName}
            </div>
          </div>
          {showSpinner && (
            <div
              style={{
                marginLeft: 'auto',
                width: 20,
                height: 20,
                border: `2px solid ${colors.bgSecondary}`,
                borderTopColor: config.color,
                borderRadius: '50%',
                transform: `rotate(${spinnerRotation}deg)`,
              }}
            />
          )}
        </div>
        {responseText && (
          <div style={{
            color: colors.textSecondary,
            fontSize: 13,
            lineHeight: 1.5,
            overflow: 'hidden',
            maxHeight: 60,
          }}>
            {responseText}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
