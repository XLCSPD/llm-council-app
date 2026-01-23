import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Sequence } from 'remotion';
import { colors, springConfigs } from '../styles/colors';
import { GlassCard, ParticleField } from '../components';
import { loadFont, fontFamily } from '@remotion/google-fonts/Inter';

loadFont('normal', { weights: ['400', '600', '700', '800'] });

// Feature 1: 30+ Models - BIGGER & BOUNCIER
const ModelsFeature: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    fps,
    frame,
    config: springConfigs.elastic,
    delay: 3,
  });

  // Pulsing scale for the number
  const numberPulse = interpolate(
    Math.sin(frame * 0.12),
    [-1, 1],
    [1, 1.08]
  );

  const models = ['GPT-5', 'Claude', 'Gemini', 'Grok', 'Llama', 'DeepSeek', 'Mistral', '+23'];
  const modelColors = [
    colors.modelOpenAI,
    colors.modelAnthropic,
    colors.modelGoogle,
    colors.modelXAI,
    colors.modelMeta,
    colors.modelDeepSeek,
    '#FF6B6B',
    colors.accentSecondary,
  ];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 96,
          fontWeight: 800,
          color: colors.textPrimary,
          marginBottom: 20,
          opacity: progress,
          transform: `scale(${progress * numberPulse})`,
          textShadow: `0 0 40px ${colors.accentSecondary}40`,
        }}>
          30+
        </div>
        <div style={{
          fontSize: 40,
          color: colors.textSecondary,
          marginBottom: 40,
          opacity: progress,
          fontWeight: 600,
        }}>
          AI Models
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 16,
          maxWidth: 700,
        }}>
          {models.map((model, i) => {
            const modelProgress = spring({
              fps,
              frame,
              config: springConfigs.pop,
              delay: 12 + i * 3,
            });

            return (
              <div
                key={model}
                style={{
                  padding: '12px 24px',
                  background: `${modelColors[i]}25`,
                  border: `2px solid ${modelColors[i]}50`,
                  borderRadius: 24,
                  color: modelColors[i],
                  fontSize: 18,
                  fontWeight: 700,
                  opacity: modelProgress,
                  transform: `scale(${modelProgress})`,
                  boxShadow: `0 0 15px ${modelColors[i]}30`,
                }}
              >
                {model}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Feature 2: Real-time - BIGGER & MORE DYNAMIC
const RealtimeFeature: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    fps,
    frame,
    config: springConfigs.pop,
    delay: 3,
  });

  // Animated streaming dots - FASTER
  const dotOpacity = (i: number) => interpolate(
    Math.sin(frame * 0.4 + i * 0.7),
    [-1, 1],
    [0.3, 1]
  );

  const dotScale = (i: number) => interpolate(
    Math.sin(frame * 0.4 + i * 0.7),
    [-1, 1],
    [0.8, 1.3]
  );

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 30,
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: colors.accentSecondary,
                opacity: dotOpacity(i) * progress,
                transform: `scale(${dotScale(i)})`,
                boxShadow: `0 0 20px ${colors.accentSecondary}`,
              }}
            />
          ))}
        </div>
        <div style={{
          fontSize: 60,
          fontWeight: 800,
          color: colors.textPrimary,
          opacity: progress,
          transform: `scale(${progress})`,
          textShadow: `0 0 30px ${colors.accentSecondary}30`,
        }}>
          Real-Time Streaming
        </div>
        <div style={{
          fontSize: 26,
          color: colors.textSecondary,
          marginTop: 20,
          opacity: progress,
          fontWeight: 500,
        }}>
          Watch AI think in real-time
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Feature 3: Decision Memory - BIGGER & BOUNCIER
const MemoryFeature: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    fps,
    frame,
    config: springConfigs.elastic,
    delay: 3,
  });

  const keyPulse = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [1, 1.1]
  );

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          marginBottom: 30,
          opacity: progress,
          transform: `scale(${progress * keyPulse})`,
        }}>
          <GlassCard glow glowColor={`0 0 30px ${colors.accentSecondary}40`} style={{ padding: '16px 28px' }}>
            <span style={{ color: colors.accentSecondary, fontSize: 22, fontWeight: 700 }}>⌘K</span>
          </GlassCard>
        </div>
        <div style={{
          fontSize: 60,
          fontWeight: 800,
          color: colors.textPrimary,
          opacity: progress,
          transform: `scale(${progress})`,
          textShadow: `0 0 30px ${colors.accentPrimary}30`,
        }}>
          Decision Memory
        </div>
        <div style={{
          fontSize: 26,
          color: colors.textSecondary,
          marginTop: 20,
          opacity: progress,
          fontWeight: 500,
        }}>
          Every deliberation searchable & reusable
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const FeaturesScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.bgBase} 0%, ${colors.bgPrimary} 100%)`,
        fontFamily,
      }}
    >
      <ParticleField count={60} seed={9} style={{ opacity: 0.5 }} />

      <Sequence from={0} durationInFrames={40}>
        <ModelsFeature />
      </Sequence>

      <Sequence from={40} durationInFrames={40}>
        <RealtimeFeature />
      </Sequence>

      <Sequence from={80} durationInFrames={40}>
        <MemoryFeature />
      </Sequence>
    </AbsoluteFill>
  );
};
