'use client';

import { useEffect, useRef } from 'react';

interface StitchCanvasBackgroundProps {
  dotSize?: number;
  gap?: number;
  baseDotColor?: string;
  glowDotColor?: string;
  glowRadius?: number;
  ambientRadius?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * StitchCanvasBackground
 *
 * Recreates the Google Stitch canvas background:
 * - Deep dark slate/charcoal workspace canvas (#0e1015)
 * - Faint orthogonal dotted grid spanning the canvas
 * - Smooth spotlight glow that tracks cursor movements, illuminating the surrounding dots
 * - Soft ambient light halo for cinematic depth
 * - GPU accelerated CSS custom properties for 120fps fluid tracking with zero React re-render overhead
 */
export default function StitchCanvasBackground({
  dotSize = 1.25,
  gap = 24,
  baseDotColor = 'rgba(255, 255, 255, 0.12)',
  glowDotColor = 'rgba(255, 255, 255, 0.85)',
  glowRadius = 260,
  ambientRadius = 480,
  className = '',
  children,
}: StitchCanvasBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerMove = (e: PointerEvent) => {
      container.style.setProperty('--cursor-x', `${e.clientX}px`);
      container.style.setProperty('--cursor-y', `${e.clientY}px`);
      container.style.setProperty('--glow-opacity', '1');
    };

    const onPointerLeave = () => {
      container.style.setProperty('--glow-opacity', '0');
    };

    const onPointerEnter = (e: PointerEvent) => {
      container.style.setProperty('--cursor-x', `${e.clientX}px`);
      container.style.setProperty('--cursor-y', `${e.clientY}px`);
      container.style.setProperty('--glow-opacity', '1');
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('pointerenter', onPointerEnter);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('pointerenter', onPointerEnter);
    };
  }, []);

  const baseDotGradient = `radial-gradient(circle, ${baseDotColor} ${dotSize}px, transparent ${dotSize}px)`;
  const glowDotGradient = `radial-gradient(circle, ${glowDotColor} ${dotSize + 0.25}px, transparent ${dotSize + 0.25}px)`;

  return (
    <div
      ref={containerRef}
      className={`relative h-[100dvh] min-h-0 w-full select-none overflow-hidden bg-[#0e1015] ${className}`}
      style={
        {
          '--cursor-x': '50vw',
          '--cursor-y': '50vh',
          '--glow-opacity': '0',
        } as React.CSSProperties
      }
    >
      {/* 1. Base Faint Dot Grid — Always visible across entire canvas */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: baseDotGradient,
          backgroundSize: `${gap}px ${gap}px`,
          backgroundPosition: '0 0',
        }}
      />

      {/* 2. Bright Glowing Dots — Masked to cursor radius */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 ease-out"
        style={{
          opacity: 'var(--glow-opacity, 0)' as unknown as number,
          backgroundImage: glowDotGradient,
          backgroundSize: `${gap}px ${gap}px`,
          backgroundPosition: '0 0',
          WebkitMaskImage: `radial-gradient(${glowRadius}px circle at var(--cursor-x, 50vw) var(--cursor-y, 50vh), black 0%, rgba(0,0,0,0.5) 45%, transparent 80%)`,
          maskImage: `radial-gradient(${glowRadius}px circle at var(--cursor-x, 50vw) var(--cursor-y, 50vh), black 0%, rgba(0,0,0,0.5) 45%, transparent 80%)`,
        }}
      />

      {/* 3. Soft Ambient Spotlight Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 ease-out"
        style={{
          opacity: 'var(--glow-opacity, 0)' as unknown as number,
          background: `radial-gradient(${ambientRadius}px circle at var(--cursor-x, 50vw) var(--cursor-y, 50vh), rgba(255, 255, 255, 0.045) 0%, rgba(255, 255, 255, 0.015) 40%, transparent 75%)`,
        }}
      />

      {/* 4. Canvas Children / Placed components */}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
