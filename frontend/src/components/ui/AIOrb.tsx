import { useEffect, useRef } from 'react';

interface AIOrbProps {
  size?: number;
  isActive?: boolean;
  className?: string;
}

export function AIOrb({ size = 200, isActive = true, className = '' }: AIOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let animationId: number;
    let time = 0;

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
    for (let i = 0; i < 50; i++) {
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

    const animate = () => {
      if (!isActive) return;

      ctx.clearRect(0, 0, size, size);
      time += 0.02;

      // Draw outer glow
      const outerGlow = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2
      );
      outerGlow.addColorStop(0, 'rgba(13, 148, 136, 0.3)');
      outerGlow.addColorStop(0.5, 'rgba(94, 234, 212, 0.1)');
      outerGlow.addColorStop(1, 'rgba(13, 148, 136, 0)');
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, size, size);

      // Draw core orb
      const orbRadius = size * 0.25 + Math.sin(time) * size * 0.02;
      const coreGradient = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, orbRadius
      );
      coreGradient.addColorStop(0, 'rgba(94, 234, 212, 0.9)');
      coreGradient.addColorStop(0.5, 'rgba(13, 148, 136, 0.7)');
      coreGradient.addColorStop(1, 'rgba(13, 148, 136, 0.2)');

      ctx.beginPath();
      ctx.arc(size / 2, size / 2, orbRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      // Draw particles
      particles.forEach((p, i) => {
        // Orbit around center
        const centerX = size / 2;
        const centerY = size / 2;
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
        const maxDist = size * 0.4;
        if (dist > maxDist) {
          p.x = centerX + (dx / dist) * maxDist;
          p.y = centerY + (dy / dist) * maxDist;
        }

        // Draw particle
        const pulseFactor = Math.sin(time * 2 + i) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * pulseFactor, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity * pulseFactor})`;
        ctx.fill();

        // Draw connection lines
        particles.slice(i + 1).forEach(p2 => {
          const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
          if (d < size * 0.15) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(94, 234, 212, ${0.3 * (1 - d / (size * 0.15))})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      // Draw inner ring
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(94, 234, 212, ${0.2 + Math.sin(time * 2) * 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [size, isActive]);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
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
}
