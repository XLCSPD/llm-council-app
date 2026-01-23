import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { colors, gradients, springConfigs } from '../styles/colors';
import { ParticleField } from '../components';
import { loadFont, fontFamily } from '@remotion/google-fonts/Inter';

loadFont('normal', { weights: ['400', '600', '700', '800'] });

export const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Orb scale animation - MORE BOUNCE
  const orbProgress = spring({
    fps,
    frame,
    config: springConfigs.elastic,
    delay: 10,
  });

  // Logo text animation - BOUNCY
  const logoProgress = spring({
    fps,
    frame,
    config: springConfigs.pop,
    delay: 35,
  });

  // Subtitle animation
  const subtitleProgress = spring({
    fps,
    frame,
    config: springConfigs.bouncy,
    delay: 55,
  });

  // Orb rotation - FASTER
  const orbRotation = frame * 1.2;

  // Orb glow pulse - MORE INTENSE
  const glowIntensity = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [0.5, 1.0]
  );

  // Breathing scale effect
  const breathe = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [0.95, 1.05]
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
      <ParticleField count={100} seed={3} style={{ opacity: 0.6 }} />

      {/* 3D Orb representation - MUCH BIGGER */}
      <div
        style={{
          position: 'relative',
          transform: `scale(${orbProgress * breathe})`,
          marginBottom: 50,
        }}
      >
        {/* Outer glow rings - multiple layers */}
        <div
          style={{
            position: 'absolute',
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: `radial-gradient(circle, transparent 30%, ${colors.accentSecondary}15 60%, transparent 100%)`,
            transform: `translate(-50%, -50%) rotate(${orbRotation}deg)`,
            left: '50%',
            top: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 280,
            height: 280,
            borderRadius: '50%',
            border: `2px solid ${colors.accentSecondary}30`,
            transform: `translate(-50%, -50%) rotate(${-orbRotation * 0.5}deg)`,
            left: '50%',
            top: '50%',
          }}
        />

        {/* Main orb - BIGGER */}
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${colors.accentSecondary}, ${colors.accentPrimary})`,
            boxShadow: `
              0 0 ${100 * glowIntensity}px ${50 * glowIntensity}px ${colors.accentSecondary}50,
              0 0 ${150 * glowIntensity}px ${80 * glowIntensity}px ${colors.accentPrimary}30,
              inset 0 0 50px ${colors.accentSecondary}40
            `,
          }}
        />

        {/* Orbiting particles - MORE and BIGGER */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
          const particleAngle = (i / 10) * Math.PI * 2 + frame * 0.05;
          const radius = 120 + (i % 2) * 20;
          const particleX = Math.cos(particleAngle) * radius;
          const particleY = Math.sin(particleAngle) * (radius * 0.35);
          const size = 6 + (i % 3) * 3;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: '50%',
                background: colors.accentSecondary,
                boxShadow: `0 0 ${size * 3}px ${colors.accentSecondary}`,
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${particleX}px), calc(-50% + ${particleY}px))`,
                opacity: orbProgress,
              }}
            />
          );
        })}
      </div>

      {/* Logo - BIGGER */}
      <div
        style={{
          opacity: logoProgress,
          transform: `translateY(${interpolate(logoProgress, [0, 1], [40, 0])}px) scale(${logoProgress})`,
        }}
      >
        <h1
          style={{
            fontSize: 96,
            fontWeight: 800,
            background: gradients.accent,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            filter: `drop-shadow(0 0 30px ${colors.accentPrimary}50)`,
          }}
        >
          LLM Council
        </h1>
      </div>

      {/* Subtitle - BIGGER */}
      <div
        style={{
          opacity: subtitleProgress,
          transform: `translateY(${interpolate(subtitleProgress, [0, 1], [20, 0])}px)`,
          marginTop: 20,
        }}
      >
        <span style={{
          color: colors.textSecondary,
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}>
          Multi-Agent AI Deliberation
        </span>
      </div>
    </AbsoluteFill>
  );
};
