import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { colors, springConfigs } from '../styles/colors';
import { PeerMatrix, ParticleField, TypewriterText } from '../components';
import { loadFont, fontFamily } from '@remotion/google-fonts/Inter';

loadFont('normal', { weights: ['400', '600', '700', '800'] });

export const ReviewPhaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase indicator - BOUNCY
  const phaseProgress = spring({
    fps,
    frame,
    config: springConfigs.bouncy,
    delay: 0,
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.bgBase} 0%, ${colors.bgPrimary} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <ParticleField count={50} seed={7} style={{ opacity: 0.4 }} />

      {/* Phase indicator */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 60,
          opacity: phaseProgress,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: colors.accentPrimary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.textPrimary,
            fontWeight: 800,
            fontSize: 18,
            boxShadow: `0 0 20px ${colors.accentPrimary}50`,
          }}
        >
          3
        </div>
        <span style={{ color: colors.textPrimary, fontWeight: 700, fontSize: 22 }}>
          Peer Review
        </span>
      </div>

      {/* Peer Review Matrix */}
      <PeerMatrix enterDelay={15} />

      {/* Scene title - BIGGER */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          textAlign: 'center',
        }}
      >
        <TypewriterText
          text="Then they critique each other"
          startFrame={15}
          speed={2}
          style={{
            color: colors.textPrimary,
            fontSize: 44,
            fontWeight: 700,
            textShadow: `0 0 30px ${colors.accentSecondary}25`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
