import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { colors, gradients, springConfigs } from '../styles/colors';
import { ParticleField } from '../components';
import { loadFont, fontFamily } from '@remotion/google-fonts/Inter';

loadFont('normal', { weights: ['400', '600', '700', '800'] });

export const TaglineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = ['Better', 'decisions', 'through', 'structured', 'disagreement'];

  // Background pulse
  const bgPulse = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [0.4, 0.8]
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
      <ParticleField count={80} seed={10} style={{ opacity: 0.6 }} />

      {/* Background orb silhouette - BIGGER and PULSING */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.accentPrimary}20 0%, ${colors.accentSecondary}10 40%, transparent 70%)`,
          opacity: bgPulse,
          transform: `scale(${0.9 + bgPulse * 0.2})`,
        }}
      />

      {/* Tagline - BIGGER text */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 24,
          maxWidth: 1200,
          padding: 40,
        }}
      >
        {words.map((word, i) => {
          const wordProgress = spring({
            fps,
            frame,
            config: springConfigs.pop,
            delay: 5 + i * 6,
          });

          const isHighlight = word === 'structured' || word === 'disagreement';

          // Extra bounce for highlight words
          const extraScale = isHighlight
            ? interpolate(Math.sin(frame * 0.1 + i), [-1, 1], [1, 1.05])
            : 1;

          return (
            <span
              key={word}
              style={{
                fontSize: isHighlight ? 88 : 80,
                fontWeight: isHighlight ? 800 : 600,
                opacity: wordProgress,
                transform: `translateY(${interpolate(wordProgress, [0, 1], [60, 0])}px) scale(${wordProgress * extraScale})`,
                ...(isHighlight
                  ? {
                      background: gradients.accent,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: `drop-shadow(0 0 30px ${colors.accentPrimary}60)`,
                    }
                  : {
                      color: colors.textPrimary,
                      textShadow: `0 0 20px ${colors.accentSecondary}20`,
                    }),
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* Shimmer effect overlay - FASTER and MORE VISIBLE */}
      <div
        style={{
          position: 'absolute',
          width: '200%',
          height: '100%',
          background: `linear-gradient(90deg, transparent 0%, ${colors.accentSecondary}20 50%, transparent 100%)`,
          transform: `translateX(${interpolate(frame, [0, 120], [-100, 100])}%)`,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
