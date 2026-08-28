'use client';

import { useEffect, useState } from 'react';

/**
 * Fixed, full-viewport grid background with a cursor-following glow.
 *
 * The pointer listener is attached to `window` (not a scroll container) and
 * writes viewport coordinates, so the glow tracks the cursor over every
 * section — including while a GSAP-pinned horizontal section is on screen.
 */
export default function GridGlowBackground() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const setVar = (x: number, y: number) => {
      const root = document.documentElement;
      root.style.setProperty('--cursor-x', `${x}px`);
      root.style.setProperty('--cursor-y', `${y}px`);
    };

    const onMove = (e: PointerEvent) => {
      setVar(e.clientX, e.clientY);
      setVisible(true);
    };
    const onLeave = () => setVisible(false);

    window.addEventListener('pointermove', onMove);
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <>
      {/* Base grid — faint, always visible across the whole page */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), ' +
            'linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      {/* Bright grid — same pattern, masked to a circle that follows the cursor */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.55) 1px, transparent 1px), ' +
            'linear-gradient(to bottom, rgba(255,255,255,0.55) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          WebkitMaskImage:
            'radial-gradient(140px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), black 0%, transparent 75%)',
          maskImage:
            'radial-gradient(140px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), black 0%, transparent 75%)',
        }}
      />

      {/* Ambient glow blob — soft light behind the grid, adds depth */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          background:
            'radial-gradient(320px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), rgba(255,255,255,0.08), transparent 60%)',
        }}
      />
    </>
  );
}
