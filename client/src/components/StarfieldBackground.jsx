import React, { useEffect, useRef } from 'react';

/**
 * High-performance, low-overhead space ambient canvas
 * Generates subtle star particles and slow cosmic drift without impacting CPU/GPU.
 */
export default function StarfieldBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Check user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Generate 65 subtle stars
    const starCount = 65;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      speed: (Math.random() * 0.15 + 0.05) * (prefersReducedMotion ? 0 : 1),
      pulseSpeed: Math.random() * 0.02 + 0.005,
      pulseDirection: Math.random() > 0.5 ? 1 : -1
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      stars.forEach((star) => {
        if (!prefersReducedMotion) {
          star.y -= star.speed;
          if (star.y < 0) {
            star.y = height;
            star.x = Math.random() * width;
          }

          // Gentle twinkle
          star.alpha += star.pulseSpeed * star.pulseDirection;
          if (star.alpha > 0.7) star.pulseDirection = -1;
          if (star.alpha < 0.15) star.pulseDirection = 1;
        }

        ctx.fillStyle = `rgba(147, 197, 253, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-40"
      aria-hidden="true"
    />
  );
}
