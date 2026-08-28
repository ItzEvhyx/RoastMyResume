'use client';

import { useMediaQuery } from '@/lib/use_media_query';
import LandingDesktop from '@/app/features/landing_page/landing.desktop';
import LandingMobile from '@/app/features/landing_page/landing.mobile';

/**
 * Device switch: renders exactly one landing tree based on viewport width, so
 * the desktop (GSAP horizontal-scroll) and mobile (vertical) experiences are
 * fully isolated — only one mounts at a time.
 *
 * Breakpoint: below 768px = mobile (matches Tailwind's default `md`).
 */
export default function LandingPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Until mount we don't know the viewport (SSR has none). Render a plain
  // black shell to avoid a hydration mismatch / layout flash.
  if (isMobile === undefined) {
    return <main className="min-h-screen w-full bg-black" />;
  }

  return isMobile ? <LandingMobile /> : <LandingDesktop />;
}
