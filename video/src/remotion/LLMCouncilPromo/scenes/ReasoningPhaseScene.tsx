import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { colors, springConfigs } from '../styles/colors';
import { RoleCard, ParticleField, TypewriterText } from '../components';
import { loadFont, fontFamily } from '@remotion/google-fonts/Inter';

loadFont('normal', { weights: ['400', '600', '700', '800'] });

export const ReasoningPhaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase indicator - BOUNCY
  const phaseProgress = spring({
    fps,
    frame,
    config: springConfigs.bouncy,
    delay: 0,
  });

  const roles = [
    {
      role: 'thinker' as const,
      model: 'Claude Opus',
      response: 'The European market presents unique regulatory challenges, particularly GDPR compliance and varying consumer protection laws across member states...',
    },
    {
      role: 'critic' as const,
      model: 'GPT-5',
      response: 'While regulatory concerns are valid, the analysis overlooks the competitive landscape and existing market saturation in key sectors...',
    },
    {
      role: 'devils_advocate' as const,
      model: 'Gemini Pro',
      response: 'Consider the counterpoint: is this the right time for EU expansion given economic uncertainty and potential trade barriers...',
    },
    {
      role: 'synthesizer' as const,
      model: 'Claude Sonnet',
      response: 'Integrating all perspectives to form a balanced strategic recommendation with clear action items...',
    },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.bgBase} 0%, ${colors.bgPrimary} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <ParticleField count={50} seed={6} style={{ opacity: 0.4 }} />

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
          2
        </div>
        <span style={{ color: colors.textPrimary, fontWeight: 700, fontSize: 22 }}>
          Reasoning
        </span>
      </div>

      {/* Role cards in 2x2 grid - BIGGER with more gap */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 32,
          padding: 50,
          maxWidth: 1000,
        }}
      >
        {roles.map((r, i) => (
          <RoleCard
            key={r.role}
            role={r.role}
            modelName={r.model}
            enterDelay={10 + i * 10}
            showSpinner={frame < 55 + i * 8}
            responseText={frame > 45 + i * 8 ? r.response : undefined}
          />
        ))}
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
          text="Each model reasons independently"
          startFrame={20}
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
