import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { colors, springConfigs } from '../styles/colors';
import { GlassCard, ParticleField, TypewriterText } from '../components';
import { loadFont, fontFamily } from '@remotion/google-fonts/Inter';

loadFont('normal', { weights: ['400', '500', '600', '700', '800'] });

export const SetupPhaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card slide animation - BOUNCY
  const cardProgress = spring({
    fps,
    frame,
    config: springConfigs.pop,
    delay: 8,
  });

  const cardX = interpolate(cardProgress, [0, 1], [500, 0]);
  const cardScale = interpolate(cardProgress, [0, 0.5, 1], [0.8, 1.05, 1]);

  // Phase indicator - SNAPPY
  const phaseProgress = spring({
    fps,
    frame,
    config: springConfigs.bouncy,
    delay: 0,
  });

  // Typing cursor blink
  const cursorVisible = Math.sin(frame * 0.2) > 0;

  // Simulated typing in the prompt box
  const promptText = "What are the key considerations for launching a new product in the European market?";
  const charsToShow = Math.min(Math.floor((frame - 40) / 1.5), promptText.length);
  const displayPrompt = frame > 40 ? promptText.slice(0, Math.max(0, charsToShow)) : '';

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.bgBase} 0%, ${colors.bgPrimary} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <ParticleField count={50} seed={5} style={{ opacity: 0.4 }} />

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
          1
        </div>
        <span style={{ color: colors.textPrimary, fontWeight: 700, fontSize: 22 }}>
          Setup
        </span>
      </div>

      {/* Prompt editor card - BIGGER */}
      <div
        style={{
          transform: `translateX(${cardX}px) scale(${cardScale})`,
          opacity: cardProgress,
          width: 780,
        }}
      >
        <GlassCard glow glowColor={`0 0 40px ${colors.accentPrimary}30`} style={{ padding: 36 }}>
          <div style={{ marginBottom: 24 }}>
            <label style={{
              color: colors.textSecondary,
              fontSize: 14,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}>
              Your Question
            </label>
          </div>

          {/* Prompt input area - BIGGER */}
          <div
            style={{
              background: colors.bgSecondary,
              border: `2px solid ${colors.accentPrimary}60`,
              borderRadius: 14,
              padding: 24,
              minHeight: 140,
              boxShadow: `inset 0 0 20px ${colors.accentPrimary}10`,
            }}
          >
            <span style={{
              color: colors.textPrimary,
              fontSize: 18,
              lineHeight: 1.7,
            }}>
              {displayPrompt}
              {charsToShow < promptText.length && cursorVisible && (
                <span style={{ color: colors.accentSecondary, fontWeight: 700 }}>|</span>
              )}
            </span>
          </div>

          {/* Objective field - BIGGER */}
          <div style={{ marginTop: 24 }}>
            <label style={{
              color: colors.textSecondary,
              fontSize: 14,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}>
              Objective
            </label>
            <div
              style={{
                background: colors.bgSecondary,
                border: `1px solid ${colors.glassBorder}`,
                borderRadius: 10,
                padding: 16,
                marginTop: 10,
              }}
            >
              <span style={{ color: colors.textSecondary, fontSize: 16 }}>
                Get comprehensive market entry strategy
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Scene title - BIGGER */}
      <div
        style={{
          position: 'absolute',
          bottom: '12%',
          textAlign: 'center',
        }}
      >
        <TypewriterText
          text="Configure your question"
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
