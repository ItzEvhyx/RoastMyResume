'use client';

import { useEffect, useState } from 'react';
import GridGlowBackground from '@/rb_components/grid_glow_background';
import Threads from '@/components/Threads';
import { useMediaQuery } from '@/lib/use_media_query';
import BannerWeb from '@/app/features/templates_page/banner/banner.web';
import BannerMobile from '@/app/features/templates_page/banner/banner.mobile';
import TemplatesAreaWeb from '@/app/features/templates_page/templates_area/templates.area.web';
import TemplatesAreaMobile from '@/app/features/templates_page/templates_area/templates.area.mobile';
import TriviaWeb from '@/app/features/templates_page/trivia/trivia.web';
import TriviaMobile from '@/app/features/templates_page/trivia/trivia.mobile';

export default function TemplatesPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [ready, setReady] = useState(false);

  // Entry animation — paint the hidden state first, then animate in.
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Hide all scrollbars while this page is mounted.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add('no-scrollbar');
    body.classList.add('no-scrollbar');
    return () => {
      html.classList.remove('no-scrollbar');
      body.classList.remove('no-scrollbar');
    };
  }, []);


  return (
    <main className="no-scrollbar relative min-h-screen w-full bg-black">
      <GridGlowBackground />

      {/* Entry wrapper */}
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
        {isMobile === undefined ? null : isMobile ? <TemplatesAreaMobile /> : <TemplatesAreaWeb />}

        {/* Trivia banner */}
        {isMobile === undefined ? null : isMobile ? <TriviaMobile /> : <TriviaWeb />}
      </div>
    </main>
  );
}
