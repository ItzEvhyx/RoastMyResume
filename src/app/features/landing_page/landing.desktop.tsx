'use client';

import Hero from '@/app/features/landing_page/hero/hero.web';
import About from '@/app/features/landing_page/about/about.web';
import Features from '@/app/features/landing_page/features/features.web';
import Sample from '@/app/features/landing_page/sample/sample.web';
import HorizontalScroll, { Panel } from '@/rb_components/horizontal_scroll';
import GridGlowBackground from '@/rb_components/grid_glow_background';

/**
 * Desktop landing experience: a GSAP-pinned horizontal-scroll track that pans
 * through the sections. This tree only mounts on wide viewports, so its
 * pinning/parallax never runs on mobile.
 */
export default function LandingDesktop() {
  return (
    <main className="relative w-full bg-black">
      {/* Fixed grid + cursor glow, shared behind every section */}
      <GridGlowBackground />

      {/* Everything scrolls horizontally: scrolling down pans the track
          right-to-left through hero -> about -> features -> sample. */}
      <HorizontalScroll weight={1.6}>
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
