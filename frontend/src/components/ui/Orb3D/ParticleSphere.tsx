import { useRef, useMemo, useEffect } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Shader material for the central gradient sphere
const GradientSphereMaterial = shaderMaterial(
  {
    uTime: 0,
    uMousePos: new THREE.Vector2(0, 0),
    uMouseInfluence: 0.0,
  },
  // Vertex shader
  `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader - radial gradient with glow
  `
    uniform float uTime;
    uniform vec2 uMousePos;
    uniform float uMouseInfluence;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      // Calculate view-space normal for rim lighting
      vec3 viewDir = normalize(-vPosition);
      float rimLight = 1.0 - max(dot(viewDir, vNormal), 0.0);
      rimLight = pow(rimLight, 2.0);

      // Radial gradient from center
      float distFromCenter = length(vUv - 0.5) * 2.0;

      // Core colors
      vec3 coreColor = vec3(0.4, 0.95, 0.85);    // Bright cyan center
      vec3 midColor = vec3(0.25, 0.7, 0.65);     // Teal mid
      vec3 edgeColor = vec3(0.15, 0.45, 0.45);   // Darker teal edge

      // Create gradient
      vec3 color = mix(coreColor, midColor, smoothstep(0.0, 0.5, distFromCenter));
      color = mix(color, edgeColor, smoothstep(0.4, 1.0, distFromCenter));

      // Add rim glow
      vec3 rimColor = vec3(0.5, 1.0, 0.95);
      color = mix(color, rimColor, rimLight * 0.3);

      // Mouse interaction - brighten toward mouse
      vec3 mouseDir = normalize(vec3(uMousePos.x, uMousePos.y, 0.5));
      float mouseEffect = max(dot(vNormal, mouseDir), 0.0);
      mouseEffect = pow(mouseEffect, 2.0) * uMouseInfluence;
      color += vec3(0.2, 0.4, 0.35) * mouseEffect;

      // Soft edge fade
      float edgeFade = 1.0 - smoothstep(0.85, 1.0, distFromCenter);

      gl_FragColor = vec4(color, edgeFade * 0.95);
    }
  `
);

// Shader material for orbiting particles
const OrbitParticleMaterial = shaderMaterial(
  {
    uTime: 0,
    uPointSize: 3.0,
    uMousePos: new THREE.Vector2(0, 0),
    uMouseInfluence: 0.0,
    uReducedMotion: 0,
  },
  // Vertex shader
  `
    uniform float uTime;
    uniform float uPointSize;
    uniform vec2 uMousePos;
    uniform float uMouseInfluence;
    uniform float uReducedMotion;

    attribute float aAngle;
    attribute float aSpeed;
    attribute float aRadius;
    attribute float aSize;
    attribute float aPhase;

    varying float vAlpha;
    varying float vSize;

    void main() {
      float motionFactor = 1.0 - uReducedMotion;
      float time = uTime * motionFactor;

      // Calculate orbital position
      float angle = aAngle + time * aSpeed;
      float radius = aRadius;

      // Slight wobble in orbit
      float wobble = sin(angle * 3.0 + aPhase) * 0.02 * motionFactor;
      radius += wobble;

      // Position on orbit ring (XY plane - group rotation handles tilt)
      float zOffset = sin(angle * 2.0 + aPhase * 2.0) * 0.03;
      vec3 pos = vec3(
        cos(angle) * radius,
        sin(angle) * radius,
        zOffset
      );

      // Mouse interaction - particles attracted toward mouse
      vec3 mouseDir = normalize(vec3(uMousePos.x * 0.8, uMousePos.y * 0.8, 0.3));
      float mouseProximity = max(dot(normalize(pos), mouseDir), 0.0);
      mouseProximity = pow(mouseProximity, 3.0);
      pos += mouseDir * mouseProximity * uMouseInfluence * 0.15;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Size variation with mouse effect
      float sizeBoost = 1.0 + mouseProximity * uMouseInfluence * 0.5;
      gl_PointSize = uPointSize * aSize * sizeBoost * (200.0 / -mvPosition.z);
      gl_PointSize = clamp(gl_PointSize, 1.0, 15.0);

      // Alpha based on position and mouse
      vAlpha = 0.6 + sin(angle * 4.0 + time) * 0.2 + mouseProximity * uMouseInfluence * 0.3;
      vSize = aSize;
    }
  `,
  // Fragment shader
  `
    uniform float uMouseInfluence;

    varying float vAlpha;
    varying float vSize;

    void main() {
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);

      if (dist > 0.5) discard;

      // Soft glow
      float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
      alpha = pow(alpha, 1.5);

      // Particle color - cyan/teal
      vec3 color = vec3(0.4, 0.9, 0.85);

      // Brighter core
      float core = 1.0 - smoothstep(0.0, 0.25, dist);
      color = mix(color, vec3(0.7, 1.0, 0.95), core);

      gl_FragColor = vec4(color, alpha * vAlpha);
    }
  `
);

// Extend R3F with our custom materials
extend({ GradientSphereMaterial, OrbitParticleMaterial });

// TypeScript declarations
declare global {
  namespace JSX {
    interface IntrinsicElements {
      gradientSphereMaterial: JSX.IntrinsicElements['shaderMaterial'] & {
        uTime?: number;
        uMousePos?: THREE.Vector2;
        uMouseInfluence?: number;
      };
      orbitParticleMaterial: JSX.IntrinsicElements['shaderMaterial'] & {
        uTime?: number;
        uPointSize?: number;
        uMousePos?: THREE.Vector2;
        uMouseInfluence?: number;
        uReducedMotion?: number;
      };
    }
  }
}

export interface ParticleSphereProps {
  particleCount: number;
  pointSize: number;
  isActive: boolean;
  reducedMotion: boolean;
  mousePos: { x: number; y: number };
  mouseInfluence: number;
}

export function ParticleSphere({
  particleCount,
  pointSize,
  isActive,
  reducedMotion,
  mousePos,
  mouseInfluence,
}: ParticleSphereProps) {
  const sphereMatRef = useRef<THREE.ShaderMaterial>(null);
  const orbitMatRef = useRef<THREE.ShaderMaterial>(null);

  // Generate orbit particle attributes
  const orbitGeometry = useMemo(() => {
    const count = Math.floor(particleCount * 0.35); // Particles for orbit
    const angles = new Float32Array(count);
    const speeds = new Float32Array(count);
    const radii = new Float32Array(count);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Distribute particles around the orbit with some clustering
      angles[i] = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      speeds[i] = 0.1 + Math.random() * 0.06; // Orbit speed
      radii[i] = 1.15 + Math.random() * 0.18; // Orbit radius matching ring

      // More varied sizes - some large, most small
      const sizeRand = Math.random();
      if (sizeRand > 0.85) {
        sizes[i] = 1.5 + Math.random() * 1.0; // Large particles (15%)
      } else if (sizeRand > 0.5) {
        sizes[i] = 0.8 + Math.random() * 0.5; // Medium particles (35%)
      } else {
        sizes[i] = 0.3 + Math.random() * 0.4; // Small particles (50%)
      }

      phases[i] = Math.random() * Math.PI * 2;

      // Initial positions (will be overridden by shader)
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    return geo;
  }, [particleCount]);

  // Animation loop
  useFrame((_, delta) => {
    if (!isActive) return;

    // Update sphere material
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sphereMat = sphereMatRef.current as any;
    if (sphereMat?.uTime !== undefined) {
      sphereMat.uTime += delta;
    }

    // Update orbit material
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitMat = orbitMatRef.current as any;
    if (orbitMat?.uTime !== undefined) {
      orbitMat.uTime += delta;
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      orbitGeometry.dispose();
    };
  }, [orbitGeometry]);

  const mouseVec = useMemo(() => new THREE.Vector2(mousePos.x, mousePos.y), [mousePos.x, mousePos.y]);

  // Tilt angle for the orbital ring (like planetary rings viewed from slight angle)
  const orbitTilt = Math.PI * 0.4; // Tilt forward toward viewer

  return (
    <group>
      {/* Central gradient sphere */}
      <mesh>
        <sphereGeometry args={[0.8, 64, 64]} />
        <gradientSphereMaterial
          ref={sphereMatRef}
          uTime={0}
          uMousePos={mouseVec}
          uMouseInfluence={mouseInfluence}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Thin outer ring outline - tilted */}
      <mesh rotation={[orbitTilt, 0, 0]}>
        <ringGeometry args={[1.28, 1.32, 64]} />
        <meshBasicMaterial
          color={0x5eead4}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Orbiting particles - tilted to match ring */}
      <group rotation={[orbitTilt, 0, 0]}>
        <points geometry={orbitGeometry}>
          <orbitParticleMaterial
            ref={orbitMatRef}
            uTime={0}
            uPointSize={pointSize * 1.8}
            uMousePos={mouseVec}
            uMouseInfluence={mouseInfluence}
            uReducedMotion={reducedMotion ? 1 : 0}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </group>
  );
}
