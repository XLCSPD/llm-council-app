import type { PerformanceSettings } from './hooks/useOrbPerformance';

export interface MousePosition {
  x: number;
  y: number;
}

export interface Orb3DProps {
  /** Size in pixels (width and height) */
  size?: number;
  /** Whether the orb animation is active */
  isActive?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Override auto-detected quality level */
  quality?: 'low' | 'medium' | 'high';
}

export interface OrbSceneProps {
  isActive: boolean;
  reducedMotion: boolean;
  settings: PerformanceSettings;
  mousePos: MousePosition;
  mouseInfluence: number;
}

// Re-export for convenience
export type { PerformanceSettings };
