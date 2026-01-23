import React, { useMemo } from 'react';
import { useCurrentFrame, interpolate, random } from 'remotion';
import { colors } from '../styles/colors';

interface ParticleFieldProps {
  count?: number;
  seed?: number;
  style?: React.CSSProperties;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  delay: number;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({
  count = 50,
  seed = 42,
  style = {},
}) => {
  const frame = useCurrentFrame();

  // Generate particles once
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      x: random(`x-${seed}-${i}`) * 100,
      y: random(`y-${seed}-${i}`) * 100,
      size: random(`size-${seed}-${i}`) * 3 + 1,
      speed: random(`speed-${seed}-${i}`) * 0.5 + 0.1,
      opacity: random(`opacity-${seed}-${i}`) * 0.5 + 0.1,
      delay: random(`delay-${seed}-${i}`) * 100,
    }));
  }, [count, seed]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        ...style,
      }}
    >
      {particles.map((particle, i) => {
        // Floating motion
        const yOffset = Math.sin((frame + particle.delay) * particle.speed * 0.05) * 20;
        const xOffset = Math.cos((frame + particle.delay) * particle.speed * 0.03) * 10;

        // Twinkle effect
        const twinkle = interpolate(
          Math.sin((frame + particle.delay) * 0.1),
          [-1, 1],
          [particle.opacity * 0.5, particle.opacity]
        );

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              background: colors.accentSecondary,
              opacity: twinkle,
              transform: `translate(${xOffset}px, ${yOffset}px)`,
              boxShadow: `0 0 ${particle.size * 2}px ${colors.accentSecondary}40`,
            }}
          />
        );
      })}
    </div>
  );
};
