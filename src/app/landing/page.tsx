'use client';

import Hero from '@/app/features/landing_page/hero';
import About from '@/app/features/landing_page/about';
import Features from '@/app/features/landing_page/features';
import Sample from '@/app/features/landing_page/sample';
import HorizontalScroll, { Panel } from '@/rb_components/horizontal_scroll';
import GridGlowBackground from '@/rb_components/grid_glow_background';

export default function LandingPage() {
  return (
    <main className="relative w-full bg-black">
      {/* Fixed grid + cursor glow, shared behind every section */}
      <GridGlowBackground />

      {/* Everything scrolls horizontally: scrolling down pans the track
          right-to-left through hero -> about -> features -> sample. Direct
          1:1 scroll (no glide/snap), weighted heavier than default. */}
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
