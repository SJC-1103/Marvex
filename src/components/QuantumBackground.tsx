import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  radius: number;
  color: string;
  alpha: number;
  pulsePhase: number;
  pulseSpeed: number;
}

export const QuantumBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates for gentle interactive quantum field disturbance
    let mouseX = -1000;
    let mouseY = -1000;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Reduced motion check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Elegant quantum node count
    const nodeCount = Math.min(50, Math.floor((width * height) / 30000));
    const particles: Particle[] = [];

    // Refined institutional palette: ice cyan, slate indigo, titanium silver
    const palette = [
      'rgba(56, 189, 248, ',  // ice cyan
      'rgba(99, 102, 241, ',  // royal indigo
      'rgba(129, 140, 248, ', // lavender slate
      'rgba(226, 232, 240, ', // titanium white
    ];

    for (let i = 0; i < nodeCount; i++) {
      const baseRadius = Math.random() * 1.5 + 0.8;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (prefersReducedMotion ? 0.05 : 0.25),
        vy: (Math.random() - 0.5) * (prefersReducedMotion ? 0.05 : 0.25),
        baseRadius,
        radius: baseRadius,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: Math.random() * 0.35 + 0.1,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.015 + 0.008,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Deep obsidian cosmic gradient with subtle center focal glow
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.2,
        150,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, '#0c1222');
      bgGrad.addColorStop(0.45, '#080c16');
      bgGrad.addColorStop(1, '#05070d');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Connect proximal nodes with delicate, ultra-thin filaments
      const maxConnectDist = 130;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDist) {
            const filamentAlpha = (1 - dist / maxConnectDist) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${filamentAlpha})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }

      // Update and render nodes
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges smoothly
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Gentle interactive repulsion from cursor
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);
        if (distToMouse < 120 && distToMouse > 0) {
          const force = (1 - distToMouse / 120) * 0.5;
          p.x += (dx / distToMouse) * force;
          p.y += (dy / distToMouse) * force;
        }

        // Subdued breathing pulse
        const dynamicAlpha = Math.max(0.08, Math.min(0.55, p.alpha + Math.sin(time + p.pulsePhase) * 0.1));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${dynamicAlpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-90"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
