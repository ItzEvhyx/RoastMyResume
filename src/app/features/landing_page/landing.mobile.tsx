'use client';

import { useEffect } from 'react';
import HeroMobile from '@/app/features/landing_page/hero/hero.mobile';
import AboutMobile from '@/app/features/landing_page/about/about.mobile';
import FeaturesMobile from '@/app/features/landing_page/features/features.mobile';
import SampleMobile from '@/app/features/landing_page/sample/sample.mobile';
import ContactsMobile from '@/app/features/landing_page/contacts/contacts.mobile';
import GridGlowBackground from '@/rb_components/grid_glow_background';

/**
 * Mobile landing experience: a normal vertical scroll through the sections.
 * No horizontal pinning — this tree only mounts on narrow viewports, fully
 * isolated from the desktop tree.
 */
export default function LandingMobile() {
  // Hide the document scrollbar only while the mobile tree is mounted; the
  // class is removed on unmount so the desktop tree is never affected.
  useEffect(() => {
    const el = document.documentElement;
    el.classList.add('no-scrollbar');
    return () => el.classList.remove('no-scrollbar');
  }, []);

  return (
    <main className="relative w-full overflow-x-hidden bg-black">
      {/* Same grid background (the cursor glow is simply inert on touch). */}
      <GridGlowBackground />

      <div className="relative z-10 flex flex-col">
        <HeroMobile />
        <AboutMobile />
        <FeaturesMobile />
        <SampleMobile />
        <ContactsMobile />
      </div>
    </main>
  );
}
