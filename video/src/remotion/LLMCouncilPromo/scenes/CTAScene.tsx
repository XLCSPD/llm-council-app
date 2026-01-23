import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { colors, gradients, springConfigs } from '../styles/colors';
import { ParticleField, TypewriterText } from '../components';
import { loadFont, fontFamily } from '@remotion/google-fonts/Inter';

loadFont('normal', { weights: ['400', '600', '700', '800'] });

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // URL animation - BOUNCIER
  const urlProgress = spring({
    fps,
    frame,
    config: springConfigs.pop,
    delay: 5,
  });

  // Button animation - VERY BOUNCY
  const buttonProgress = spring({
    fps,
    frame,
    config: springConfigs.elastic,
    delay: 40,
  });

  // Logo animation
  const logoProgress = spring({
    fps,
    frame,
    config: springConfigs.bouncy,
    delay: 0,
  });

  // Button glow pulse - MORE INTENSE
  const glowIntensity = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [0.5, 1.0]
  );

  // Button breathing scale
  const buttonBreath = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [1, 1.08]
  );

  // Particle burst on button - EARLIER and BIGGER
  const showBurst = frame > 55;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.bgBase} 0%, ${colors.bgPrimary} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <ParticleField count={70} seed={11} style={{ opacity: 0.5 }} />

      {/* Logo at top - BIGGER */}
      <div
        style={{
          position: 'absolute',
          top: 70,
          opacity: logoProgress,
          transform: `scale(${logoProgress})`,
        }}
      >
        <span
          style={{
            fontSize: 48,
            fontWeight: 800,
            background: gradients.accent,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 20px ${colors.accentPrimary}40)`,
          }}
        >
          LLM Council
        </span>
      </div>

      {/* Main content */}
      <div style={{ textAlign: 'center' }}>
        {/* URL - BIGGER */}
        <div
          style={{
            opacity: urlProgress,
            marginBottom: 50,
            transform: `scale(${urlProgress})`,
          }}
        >
          <TypewriterText
            text="llmcouncil.ai"
            startFrame={10}
            speed={2}
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: colors.textPrimary,
              letterSpacing: 4,
              textShadow: `0 0 40px ${colors.accentSecondary}30`,
            }}
          />
        </div>

        {/* CTA Button - MUCH BIGGER */}
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            transform: `scale(${buttonProgress * buttonBreath})`,
            opacity: buttonProgress,
          }}
        >
          {/* Button glow background - MORE INTENSE */}
          <div
            style={{
              position: 'absolute',
              inset: -20,
              background: gradients.accent,
              borderRadius: 30,
              filter: `blur(${40 * glowIntensity}px)`,
              opacity: glowIntensity * 0.8,
            }}
          />

          {/* Outer ring pulse */}
          <div
            style={{
              position: 'absolute',
              inset: -30,
              borderRadius: 40,
              border: `3px solid ${colors.accentSecondary}`,
              opacity: glowIntensity * 0.5,
              transform: `scale(${1 + glowIntensity * 0.1})`,
            }}
          />

          {/* Button - BIGGER */}
          <div
            style={{
              position: 'relative',
              padding: '28px 64px',
              background: gradients.accent,
              borderRadius: 16,
              boxShadow: `
                0 0 ${50 * glowIntensity}px ${colors.accentPrimary}60,
                0 0 ${80 * glowIntensity}px ${colors.accentSecondary}40
              `,
            }}
          >
            <span style={{
              fontSize: 32,
              fontWeight: 800,
              color: colors.textPrimary,
              letterSpacing: 1,
            }}>
              Start Deliberating →
            </span>
          </div>

          {/* Particle burst - MORE PARTICLES, BIGGER */}
          {showBurst && (
            <>
              {[...Array(16)].map((_, i) => {
                const burstProgress = interpolate(
                  frame - 55,
                  [0, 40],
                  [0, 1],
                  { extrapolateRight: 'clamp' }
                );
                const angle = (i / 16) * Math.PI * 2;
                const distance = burstProgress * 120;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                const size = 8 + (i % 3) * 4;

                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: size,
                      height: size,
                      borderRadius: '50%',
                      background: colors.accentSecondary,
                      boxShadow: `0 0 ${size * 2}px ${colors.accentSecondary}`,
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      opacity: (1 - burstProgress) * 0.8,
                    }}
                  />
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Footer text - BIGGER */}
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          color: colors.textSecondary,
          fontSize: 20,
          opacity: urlProgress,
          letterSpacing: 2,
        }}
      >
        Multi-Agent AI Deliberation Platform
      </div>
    </AbsoluteFill>
  );
};
