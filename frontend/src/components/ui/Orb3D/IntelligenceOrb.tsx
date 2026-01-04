import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleSphere } from './ParticleSphere';
import type { MousePosition } from './types';

export interface IntelligenceOrbProps {
  isActive: boolean;
  reducedMotion: boolean;
  particleCount: number;
  pointSize: number;
  mousePos: MousePosition;
  mouseInfluence: number;
}

/**
 * The main 3D particle orb with organic wave animation
 * Includes gentle floating animation and passes settings to ParticleSphere
 */
export function IntelligenceOrb({
  isActive,
  reducedMotion,
  particleCount,
  pointSize,
  mousePos,
  mouseInfluence,
}: IntelligenceOrbProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Gentle floating animation (respects reduced motion)
  useFrame((state) => {
    if (!groupRef.current || reducedMotion || !isActive) return;

    const t = state.clock.elapsedTime;

    // Subtle Y-axis float
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.03;

    // Very slow rotation for organic feel
    groupRef.current.rotation.y = t * 0.03;
  });

  return (
    <group ref={groupRef}>
      <ParticleSphere
        particleCount={particleCount}
        pointSize={pointSize}
        isActive={isActive}
        reducedMotion={reducedMotion}
        mousePos={mousePos}
        mouseInfluence={mouseInfluence}
      />
    </group>
  );
}
