'use client';

import GridGlowBackground from '@/rb_components/grid_glow_background';
import { useMediaQuery } from '@/lib/use_media_query';
import BannerWeb from '@/app/features/templates_page/banner/banner.web';
import BannerMobile from '@/app/features/templates_page/banner/banner.mobile';

export default function TemplatesPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <main className="relative min-h-screen w-full bg-black">
      <GridGlowBackground />

      {/* Banner: flush to the very top edge, full viewport width */}
      {isMobile === undefined ? null : isMobile ? <BannerMobile /> : <BannerWeb />}
    </main>
  );
}
