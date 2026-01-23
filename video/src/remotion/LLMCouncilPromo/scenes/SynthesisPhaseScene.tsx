import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { colors, springConfigs } from '../styles/colors';
import { GlassCard, ConfidenceBar, ParticleField, TypewriterText } from '../components';
import { loadFont, fontFamily } from '@remotion/google-fonts/Inter';

loadFont('normal', { weights: ['400', '600', '700', '800'] });

export const SynthesisPhaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase indicator - BOUNCY
  const phaseProgress = spring({
    fps,
    frame,
    config: springConfigs.bouncy,
    delay: 0,
  });

  // Card entry - POP
  const cardProgress = spring({
    fps,
    frame,
    config: springConfigs.pop,
    delay: 12,
  });

  // Content reveal - SMOOTH
  const contentProgress = spring({
    fps,
    frame,
    config: springConfigs.smooth,
    delay: 30,
  });

  // Card scale breathing
  const cardBreath = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [1, 1.02]
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
      <ParticleField count={60} seed={8} style={{ opacity: 0.5 }} />

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
            background: colors.roleSynthesizer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.textPrimary,
            fontWeight: 800,
            fontSize: 18,
            boxShadow: `0 0 25px ${colors.roleSynthesizer}60`,
          }}
        >
          4
        </div>
        <span style={{ color: colors.textPrimary, fontWeight: 700, fontSize: 22 }}>
          Synthesis
        </span>
      </div>

      {/* Synthesis card - BIGGER */}
      <div
        style={{
          transform: `scale(${cardProgress * cardBreath})`,
          opacity: cardProgress,
          width: 720,
        }}
      >
        <GlassCard
          glow
          glowColor={`0 0 50px ${colors.roleSynthesizer}50`}
          style={{
            borderTop: `4px solid ${colors.roleSynthesizer}`,
            padding: 36,
          }}
        >
          {/* Chairman header - BIGGER */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 28,
          }}>
            <span style={{ fontSize: 36 }}>👑</span>
            <div>
              <div style={{
                color: colors.roleSynthesizer,
                fontSize: 16,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}>
                Chair's Synthesis
              </div>
              <div style={{ color: colors.textSecondary, fontSize: 14 }}>
                Claude Sonnet
              </div>
            </div>
          </div>

          {/* Confidence bar */}
          <div style={{ opacity: contentProgress, marginBottom: 28 }}>
            <ConfidenceBar confidence={87} enterDelay={40} />
          </div>

          {/* Key points - BIGGER */}
          <div style={{ opacity: contentProgress }}>
            <div style={{
              color: colors.textSecondary,
              fontSize: 14,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 16,
            }}>
              Key Findings
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: colors.accentSuccess, fontSize: 20 }}>✓</span>
                <span style={{ color: colors.textPrimary, fontSize: 16 }}>
                  Council agrees on phased market entry approach
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: colors.accentSuccess, fontSize: 20 }}>✓</span>
                <span style={{ color: colors.textPrimary, fontSize: 16 }}>
                  GDPR compliance identified as critical priority
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: colors.accentWarning, fontSize: 20 }}>!</span>
                <span style={{ color: colors.textSecondary, fontSize: 16 }}>
                  Dissent: Timing concerns raised by Devil's Advocate
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Scene title - BIGGER */}
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          textAlign: 'center',
        }}
      >
        <TypewriterText
          text="The Chair delivers the verdict"
          startFrame={15}
          speed={2}
          style={{
            color: colors.textPrimary,
            fontSize: 44,
            fontWeight: 700,
            textShadow: `0 0 30px ${colors.roleSynthesizer}30`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
