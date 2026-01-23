import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { colors, springConfigs } from '../styles/colors';
import { GlowNode, TypewriterText, ParticleField } from '../components';
import { loadFont, fontFamily } from '@remotion/google-fonts/Inter';

loadFont('normal', { weights: ['400', '600', '700', '800'] });

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Node entry with bounce
  const nodeProgress = spring({
    fps,
    frame,
    config: springConfigs.elastic,
    delay: 10,
  });

  // Extra pulse effect
  const pulse = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [0.9, 1.15]
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.bgBase} 0%, ${colors.bgPrimary} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <ParticleField count={50} seed={1} style={{ opacity: 0.5 }} />

      {/* Central glowing node - BIGGER */}
      <div
        style={{
          position: 'absolute',
          opacity: nodeProgress,
          transform: `scale(${nodeProgress * pulse})`,
        }}
      >
        <GlowNode
          size={70}
          color={colors.accentSecondary}
          pulseSpeed={0.12}
        />
      </div>

      {/* Outer ring glow */}
      <div
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: '50%',
          border: `2px solid ${colors.accentSecondary}30`,
          opacity: nodeProgress * 0.5,
          transform: `scale(${nodeProgress * pulse})`,
          boxShadow: `0 0 60px ${colors.accentSecondary}30`,
        }}
      />

      {/* Text - BIGGER */}
      <div
        style={{
          position: 'absolute',
          bottom: '30%',
          textAlign: 'center',
        }}
      >
        <TypewriterText
          text="One AI gave you an answer..."
          startFrame={15}
          speed={1.5}
          style={{
            color: colors.textPrimary,
            fontSize: 64,
            fontWeight: 500,
            textShadow: `0 0 40px ${colors.accentSecondary}30`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
