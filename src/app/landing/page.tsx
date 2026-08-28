'use client';

import { useEffect, useRef, useState } from 'react';
import Hero from '@/app/features/landing_page/hero';
import About from '@/app/features/landing_page/about';
import Features from '@/app/features/landing_page/features';
import Sample from '@/app/features/landing_page/sample';
import HorizontalScroll, { Panel } from '@/rb_components/horizontal_scroll';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      container.style.setProperty('--cursor-x', `${x}px`);
      container.style.setProperty('--cursor-y', `${y}px`);
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="relative w-full bg-black"
    >
      {/* Background layers are fixed so the grid + glow stay put behind every
          section, including while the horizontal-scroll section is pinned. */}

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

      {/* Bright grid — same pattern, but masked to a circle that follows the cursor */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 ease-out"
        style={{
          opacity: isHovering ? 1 : 0,
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.55) 1px, transparent 1px), ' +
            'linear-gradient(to bottom, rgba(255,255,255,0.55) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          WebkitMaskImage:
            ' radial-gradient(140px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), black 0%, transparent 75%)',
          maskImage:
            'radial-gradient(140px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), black 0%, transparent 75%)',
        }}
      />

      {/* Ambient glow blob — soft light behind the grid, adds depth to the highlight */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 ease-out"
        style={{
          opacity: isHovering ? 1 : 0,
          background:
              'radial-gradient(320px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), rgba(255,255,255,0.08), transparent 60%)',
        }}
      />

      {/* Everything scrolls horizontally: scrolling down pans the track
          right-to-left through hero -> about -> features -> sample, with a
          heavy/lazy feel and blur-in reveals. */}
      <HorizontalScroll smooth={1.4}>
        <Panel>
          <Hero />
        </Panel>
        <Panel>
          <About />
        </Panel>
        <Panel>
          <Features />
        </Panel>
        <Panel>
          <Sample />
        </Panel>
      </HorizontalScroll>
    </main>
  );
}
