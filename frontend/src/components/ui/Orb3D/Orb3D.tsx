import { memo, Suspense, useRef, useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { IntelligenceOrb } from './IntelligenceOrb';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useOrbPerformance } from './hooks/useOrbPerformance';
import type { Orb3DProps, OrbSceneProps, MousePosition } from './types';

/**
 * Simple fallback shown while shaders compile
 */
function OrbFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 24, 24]} />
      <meshBasicMaterial color={0x5eead4} transparent opacity={0.3} />
    </mesh>
  );
}

/**
 * Scene content with particle orb and post-processing
 */
function OrbScene({ isActive, reducedMotion, settings, mousePos, mouseInfluence }: OrbSceneProps) {
  return (
    <>
      {/* Main particle orb */}
      <Suspense fallback={<OrbFallback />}>
        <IntelligenceOrb
          isActive={isActive}
          reducedMotion={reducedMotion}
          particleCount={settings.particleCount}
          pointSize={settings.pointSize}
          mousePos={mousePos}
          mouseInfluence={mouseInfluence}
        />
      </Suspense>

      {/* Post-processing bloom (isolated to this Canvas) */}
      {settings.enableBloom && (
        <EffectComposer>
          <Bloom
            intensity={settings.bloomIntensity}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.05}
            mipmapBlur={settings.bloomMipmapBlur}
          />
        </EffectComposer>
      )}
    </>
  );
}

/**
 * 3D Particle Intelligence Orb Component
 *
 * A premium animated orb using WebGL with thousands of glowing particles
 * arranged on a sphere with organic wave-like morphing animation.
 *
 * Props:
 * - size: Width/height in pixels (default: 200)
 * - isActive: Whether animation is running (default: true)
 * - className: Additional CSS classes
 * - quality: Override auto-detected quality ('low' | 'medium' | 'high')
 *
 * @example
 * <Orb3D size={180} isActive={true} />
 */
export const Orb3D = memo(function Orb3D({
  size = 200,
  isActive = true,
  className = '',
  quality,
}: Orb3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const settings = useOrbPerformance(quality);

  // Track document visibility for pausing
  const [isVisible, setIsVisible] = useState(true);

  // Mouse tracking state
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [mouseInfluence, setMouseInfluence] = useState(0);
  const mouseInfluenceRef = useRef(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Smooth interpolation of mouse influence
  useEffect(() => {
    const targetInfluence = isHovered && !reducedMotion ? 1 : 0;
    let animationId: number;

    const animate = () => {
      const current = mouseInfluenceRef.current;
      const diff = targetInfluence - current;

      if (Math.abs(diff) > 0.001) {
        // Smooth lerp: faster when entering, slower when leaving
        const speed = diff > 0 ? 0.08 : 0.04;
        mouseInfluenceRef.current = current + diff * speed;
        setMouseInfluence(mouseInfluenceRef.current);
        animationId = requestAnimationFrame(animate);
      } else {
        mouseInfluenceRef.current = targetInfluence;
        setMouseInfluence(targetInfluence);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isHovered, reducedMotion]);

  // Mouse event handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || reducedMotion) return;

    const rect = containerRef.current.getBoundingClientRect();
    // Convert to normalized coordinates (-1 to 1)
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    setMousePos({ x, y });
  }, [reducedMotion]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Effective active state combines prop, visibility, and reduced motion
  const effectiveActive = isActive && isVisible;

  // Camera distance to frame the orb nicely
  const cameraZ = 2.8;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Canvas
        camera={{ position: [0, 0, cameraZ], fov: 50 }}
        gl={{
          antialias: settings.antialias,
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        }}
        dpr={[1, settings.dprMax]}
        frameloop={effectiveActive ? 'always' : 'demand'}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <OrbScene
          isActive={effectiveActive}
          reducedMotion={reducedMotion}
          settings={settings}
          mousePos={mousePos}
          mouseInfluence={mouseInfluence}
        />
      </Canvas>
    </div>
  );
});
