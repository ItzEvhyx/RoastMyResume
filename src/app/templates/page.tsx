'use client';

import { useEffect, useState } from 'react';
import GridGlowBackground from '@/rb_components/grid_glow_background';
import Threads from '@/components/Threads';
import { useMediaQuery } from '@/lib/use_media_query';
import BannerWeb from '@/app/features/templates_page/banner/banner.web';
import BannerMobile from '@/app/features/templates_page/banner/banner.mobile';
import TemplatesAreaWeb from '@/app/features/templates_page/templates_area/templates.area.web';

export default function TemplatesPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [ready, setReady] = useState(false);

  // Trigger the entry animation on the next frame after mount so the
  // initial hidden state has been painted before we start animating.
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <main className="relative min-h-screen w-full bg-black">
      <GridGlowBackground />

      {/* Entry wrapper — fades in and drifts up from 18px on mount */}
      <div
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 0.55s ease-out, transform 0.55s ease-out',
        }}
      >
        {/* Banner — flush to top */}
        {isMobile === undefined ? null : isMobile ? <BannerMobile /> : <BannerWeb />}

        {/* Threads — full viewport width */}
        <div className="relative z-10 w-screen" style={{ height: isMobile ? 160 : 240 }}>
          <Threads
            color={[1, 1, 1]}
            amplitude={1.2}
            distance={0.3}
            enableMouseInteraction={!isMobile}
          />
        </div>

        {/* Content area */}
        {isMobile === undefined ? null : !isMobile && <TemplatesAreaWeb />}
      </div>
    </main>
  );
}
