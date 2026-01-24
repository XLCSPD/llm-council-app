import { memo } from 'react';

/**
 * AnimatedBackground
 *
 * Creates a living, breathing atmosphere with floating gradient orbs.
 * The effect is subtle but adds significant depth and premium feel
 * to the deliberation space.
 *
 * Uses Tailwind animations defined in tailwind.config.js:
 * - animate-float (6s)
 * - animate-float-delayed (8s, 2s delay)
 * - animate-float-slow (10s, 4s delay)
 */
export const AnimatedBackground = memo(function AnimatedBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Primary teal orb - top left */}
      <div
        className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full
          bg-gradient-radial from-teal-900/20 via-teal-900/5 to-transparent
          blur-3xl animate-float"
      />

      {/* Secondary cyan orb - bottom right */}
      <div
        className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full
          bg-gradient-radial from-cyan-900/15 via-cyan-900/5 to-transparent
          blur-3xl animate-float-delayed"
      />

      {/* Tertiary indigo orb - center */}
      <div
        className="absolute top-[40%] left-[25%] w-[50%] h-[50%] rounded-full
          bg-gradient-radial from-indigo-900/10 via-indigo-900/3 to-transparent
          blur-3xl animate-float-slow"
      />

      {/* Subtle ambient light from top */}
      <div
        className="absolute -top-[10%] left-[30%] w-[40%] h-[30%] rounded-full
          bg-gradient-radial from-white/[0.02] to-transparent
          blur-2xl"
      />
    </div>
  );
});
