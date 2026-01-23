import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { colors, springConfigs } from '../styles/colors';
import { ModelNode, ParticleField, TypewriterText } from '../components';
import { loadFont, fontFamily } from '@remotion/google-fonts/Inter';

loadFont('normal', { weights: ['400', '600', '700', '800'] });

const models = [
  { name: 'GPT-5', color: colors.modelOpenAI },
  { name: 'Claude', color: colors.modelAnthropic },
  { name: 'Gemini', color: colors.modelGoogle },
  { name: 'Grok', color: colors.modelXAI },
  { name: 'Llama', color: colors.modelMeta },
  { name: 'DeepSeek', color: colors.modelDeepSeek },
];

export const CouncilConceptScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Central orb animation - BOUNCY
  const orbProgress = spring({
    fps,
    frame,
    config: springConfigs.elastic,
    delay: 0,
  });

  // Connection lines pulse - MORE VISIBLE
  const lineOpacity = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [0.3, 0.7]
  );

  // Orb breathing pulse
  const orbPulse = interpolate(
    Math.sin(frame * 0.1),
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
      <ParticleField count={60} seed={4} style={{ opacity: 0.5 }} />

      {/* Central orb - BIGGER with more glow */}
      <div
        style={{
          position: 'absolute',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${colors.accentSecondary}, ${colors.accentPrimary})`,
          boxShadow: `
            0 0 60px ${colors.accentSecondary}50,
            0 0 100px ${colors.accentPrimary}30,
            inset 0 0 30px ${colors.accentSecondary}40
          `,
          transform: `scale(${orbProgress * orbPulse})`,
        }}
      />

      {/* Outer ring */}
      <div
        style={{
          position: 'absolute',
          width: 160,
          height: 160,
          borderRadius: '50%',
          border: `2px solid ${colors.accentSecondary}30`,
          transform: `scale(${orbProgress}) rotate(${frame * 0.5}deg)`,
          opacity: orbProgress * 0.6,
        }}
      />

      {/* Connection lines (SVG) - THICKER */}
      <svg
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {models.map((model, i) => {
          const angle = (i / models.length) * Math.PI * 2 + frame * 0.03;
          const radius = 220;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius * 0.4;

          return (
            <line
              key={`line-${i}`}
              x1="50%"
              y1="50%"
              x2={`calc(50% + ${x}px)`}
              y2={`calc(50% + ${y}px)`}
              stroke={model.color}
              strokeWidth={3}
              opacity={lineOpacity * orbProgress}
              strokeDasharray="8,4"
            />
          );
        })}
      </svg>

      {/* Orbiting model nodes - BIGGER */}
      {models.map((model, i) => (
        <ModelNode
          key={model.name}
          name={model.name}
          color={model.color}
          angle={(i / models.length) * Math.PI * 2}
          radius={220}
          orbitSpeed={0.03}
          enterDelay={8 + i * 6}
          size={70}
        />
      ))}

      {/* Text - BIGGER */}
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          textAlign: 'center',
        }}
      >
        <TypewriterText
          text="Assemble a council of AI models"
          startFrame={25}
          speed={2}
          style={{
            color: colors.textPrimary,
            fontSize: 52,
            fontWeight: 700,
            textShadow: `0 0 30px ${colors.accentSecondary}30`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
