import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, interpolateColors } from 'remotion';
import { colors, springConfigs } from '../styles/colors';
import { TypewriterText, ParticleField } from '../components';
import { loadFont, fontFamily } from '@remotion/google-fonts/Inter';

loadFont('normal', { weights: ['400', '600', '700', '800'] });

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // FASTER node color pulsing between cyan and amber (uncertainty)
  const colorPulse = interpolate(
    Math.sin(frame * 0.25),
    [-1, 1],
    [0, 1]
  );

  const nodeColor = interpolateColors(
    colorPulse,
    [0, 1],
    [colors.accentSecondary, colors.accentWarning]
  );

  // Node shake effect for uncertainty
  const shakeX = Math.sin(frame * 0.8) * 3;
  const shakeY = Math.cos(frame * 0.6) * 2;

  // Question mark entry with BOUNCE
  const questionProgress = spring({
    fps,
    frame,
    config: springConfigs.elastic,
    delay: 10,
  });

  // Question mark wobble
  const wobble = Math.sin(frame * 0.2) * 5;

  // Scale pulse for drama
  const scalePulse = interpolate(
    Math.sin(frame * 0.2),
    [-1, 1],
    [0.95, 1.1]
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
      <ParticleField count={50} seed={2} style={{ opacity: 0.5 }} />

      {/* Pulsing uncertain node - BIGGER with shake */}
      <div
        style={{
          width: 70,
          height: 70,
          borderRadius: '50%',
          background: nodeColor,
          boxShadow: `0 0 60px ${nodeColor}, 0 0 100px ${nodeColor}50`,
          transform: `translate(${shakeX}px, ${shakeY}px) scale(${scalePulse})`,
        }}
      />

      {/* Warning ring */}
      <div
        style={{
          position: 'absolute',
          width: 150,
          height: 150,
          borderRadius: '50%',
          border: `3px solid ${colors.accentWarning}40`,
          boxShadow: `0 0 40px ${colors.accentWarning}30`,
          transform: `scale(${scalePulse})`,
          opacity: colorPulse,
        }}
      />

      {/* Question mark - MUCH BIGGER with wobble */}
      <div
        style={{
          position: 'absolute',
          top: '22%',
          transform: `scale(${questionProgress}) rotate(${wobble}deg)`,
          opacity: questionProgress,
        }}
      >
        <span style={{
          fontSize: 180,
          fontWeight: 800,
          color: colors.accentWarning,
          textShadow: `0 0 80px ${colors.accentWarning}80, 0 0 120px ${colors.accentWarning}50`,
        }}>
          ?
        </span>
      </div>

      {/* Text - BIGGER */}
      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          textAlign: 'center',
        }}
      >
        <TypewriterText
          text="...but was it the RIGHT answer?"
          startFrame={8}
          speed={1.5}
          style={{
            color: colors.textPrimary,
            fontSize: 64,
            fontWeight: 700,
            textShadow: `0 0 30px ${colors.accentWarning}30`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
