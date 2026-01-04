import { useMemo } from 'react';

export interface PerformanceSettings {
  // Particle settings
  particleCount: number;
  pointSize: number;
  // Bloom settings
  enableBloom: boolean;
  bloomIntensity: number;
  bloomMipmapBlur: boolean;
  // General settings
  antialias: boolean;
  dprMax: number;
}

interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isSafari: boolean;
  isIOS: boolean;
  gpuTier: 'low' | 'medium' | 'high';
}

function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isSafari: false,
      isIOS: false,
      gpuTier: 'medium',
    };
  }

  const ua = navigator.userAgent;

  // Device type detection
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua) ||
    (navigator.maxTouchPoints > 0 && /Macintosh/i.test(ua)); // iPad in desktop mode
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.maxTouchPoints > 0 && /Macintosh/i.test(ua));

  // Estimate GPU tier based on available signals
  let gpuTier: 'low' | 'medium' | 'high' = 'medium';

  const dpr = window.devicePixelRatio || 1;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency || 4;

  // Low tier: mobile devices or low memory
  if (isMobile || (memory && memory < 4) || cores < 4) {
    gpuTier = 'low';
  }
  // High tier: high DPR desktop with good memory/cores
  else if (dpr >= 2 && (!memory || memory >= 8) && cores >= 8 && !isTablet) {
    gpuTier = 'high';
  }

  return { isMobile, isTablet, isSafari, isIOS, gpuTier };
}

// Cache capabilities to avoid re-detection
let cachedCapabilities: DeviceCapabilities | null = null;

/**
 * Hook to get performance settings based on device capabilities
 * Automatically adjusts quality for different devices (especially iPad Safari)
 */
export function useOrbPerformance(quality?: 'low' | 'medium' | 'high'): PerformanceSettings {
  return useMemo(() => {
    // Use cached capabilities or detect
    if (!cachedCapabilities) {
      cachedCapabilities = detectDeviceCapabilities();
    }
    const capabilities = cachedCapabilities;

    // Use provided quality or auto-detect
    const effectiveQuality = quality || capabilities.gpuTier;
    const isIPadSafari = capabilities.isTablet && capabilities.isSafari && capabilities.isIOS;

    // Performance presets for particle-based orb
    const presets = {
      low: {
        particleCount: 800,
        pointSize: 3.0,
        enableBloom: false,
        bloomIntensity: 0,
        bloomMipmapBlur: false,
        antialias: false,
        dprMax: 1,
      },
      medium: {
        particleCount: 2500,
        pointSize: 2.5,
        enableBloom: true,
        bloomIntensity: 0.7,
        bloomMipmapBlur: true,
        antialias: true,
        dprMax: 1.5,
      },
      high: {
        particleCount: 5000,
        pointSize: 2.0,
        enableBloom: true,
        bloomIntensity: 0.9,
        bloomMipmapBlur: true,
        antialias: true,
        dprMax: 2,
      },
    } as const satisfies Record<string, PerformanceSettings>;

    // Get base settings, defaulting to medium
    const baseSettings: PerformanceSettings =
      effectiveQuality in presets
        ? presets[effectiveQuality as keyof typeof presets]
        : presets.medium;

    // Special handling for iPad Safari
    if (isIPadSafari) {
      return {
        ...baseSettings,
        particleCount: 1500,
        pointSize: 2.8,
        enableBloom: true,
        bloomIntensity: 0.5,
        bloomMipmapBlur: false,
        antialias: false,
        dprMax: 1.5,
      };
    }

    return baseSettings;
  }, [quality]);
}
