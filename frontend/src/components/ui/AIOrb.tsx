import { useEffect, useRef, memo } from 'react';

interface AIOrbProps {
  size?: number;
  isActive?: boolean;
  className?: string;
}

// Memoized AIOrb to prevent unnecessary re-renders
export const AIOrb = memo(function AIOrb({ size = 200, isActive = true, className = '' }: AIOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let time = 0;

    // Reduced particle count for better performance (25 instead of 50)
    const PARTICLE_COUNT = 25;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      hue: number;
    }> = [];

    // Create particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * size * 0.3 + size * 0.1;
      particles.push({
        x: size / 2 + Math.cos(angle) * radius,
        y: size / 2 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.3,
        hue: Math.random() * 30 + 165, // Teal to cyan range
      });
    }

    // Pre-calculate constants
    const centerX = size / 2;
    const centerY = size / 2;
    const maxDist = size * 0.4;
    const connectionDist = size * 0.15;
    const connectionDistSq = connectionDist * connectionDist; // Use squared distance to avoid sqrt

    const animate = () => {
      // Skip animation if not active or tab not visible
      if (!isActive || !isVisibleRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, size, size);
      time += 0.02;

      // Draw outer glow (cached gradient would be even better but creates on each size change)
      const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
      outerGlow.addColorStop(0, 'rgba(13, 148, 136, 0.3)');
      outerGlow.addColorStop(0.5, 'rgba(94, 234, 212, 0.1)');
      outerGlow.addColorStop(1, 'rgba(13, 148, 136, 0)');
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, size, size);

      // Draw core orb
      const orbRadius = size * 0.25 + Math.sin(time) * size * 0.02;
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, orbRadius);
      coreGradient.addColorStop(0, 'rgba(94, 234, 212, 0.9)');
      coreGradient.addColorStop(0.5, 'rgba(13, 148, 136, 0.7)');
      coreGradient.addColorStop(1, 'rgba(13, 148, 136, 0.2)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      // Batch connection lines for better performance
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(94, 234, 212, 0.2)';
      ctx.lineWidth = 0.5;

      // Draw particles and collect connection lines
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p) continue;

        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Apply orbital velocity
        const angle = Math.atan2(dy, dx);
        const orbitSpeed = 0.001 * (1 + (size * 0.3 - dist) / (size * 0.3));
        p.x = centerX + Math.cos(angle + orbitSpeed) * dist;
        p.y = centerY + Math.sin(angle + orbitSpeed) * dist;

        // Add some randomness
        p.x += p.vx;
        p.y += p.vy;

        // Keep particles in bounds
        if (dist > maxDist) {
          p.x = centerX + (dx / dist) * maxDist;
          p.y = centerY + (dy / dist) * maxDist;
        }

        // Draw particle
        const pulseFactor = Math.sin(time * 2 + i) * 0.3 + 0.7;
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity * pulseFactor})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * pulseFactor, 0, Math.PI * 2);
        ctx.fill();

        // Draw connection lines using squared distance (avoid sqrt)
        // Only check nearby particles (limited to reduce O(n²) complexity)
        for (let j = i + 1; j < Math.min(i + 8, particles.length); j++) {
          const p2 = particles[j];
          if (!p2) continue;

          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const distSq = cdx * cdx + cdy * cdy;

          if (distSq < connectionDistSq) {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
          }
        }
      }
      ctx.stroke();

      // Draw inner ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.35, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(94, 234, 212, ${0.2 + Math.sin(time * 2) * 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      animationRef.current = requestAnimationFrame(animate);
    };

    // Handle visibility change to pause animation when tab is hidden
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [size, isActive]);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, willChange: 'contents' }}
        className="animate-float"
      />
      {/* Center glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(94, 234, 212, 0.1) 0%, transparent 50%)',
        }}
      />
    </div>
  );
});
