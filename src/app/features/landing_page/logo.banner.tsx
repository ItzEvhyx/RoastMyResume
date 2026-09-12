// src/app/features/landing_page/logo.banner.tsx
'use client';

import { useEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import localFont from 'next/font/local';

// Futura Display — loaded from the local .ttf file (same face used in the hero).
const futuraDisplay = localFont({
  src: '../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

export interface LogoBannerProps {
  /**
   * The hero's root element. The banner only shows while this element is in
   * view, so it fades out once the user scrolls (or pans) past the hero.
   */
  watchRef?: RefObject<HTMLElement | null>;
}

/**
 * LogoBanner — the hero's wordmark, pinned to the top-left of the viewport.
 *
 * It's rendered by the hero (so it conceptually belongs to that section) but
 * portaled to `document.body`. That matters on desktop: the hero lives inside
 * a GSAP-pinned track that gets `translateX`'d as you scroll, and a transformed
 * ancestor would otherwise capture a `position: fixed` child and drag it along.
 * Portaling out of the track lets the banner stay truly fixed to the viewport,
 * so it doesn't move as the track pans away.
 *
 * Visibility is tied to the hero via `watchRef`: an IntersectionObserver fades
 * the banner out the moment the hero panel leaves the viewport, so it's only
 * seen on the hero section and nowhere else.
 *
 * Desktop only: hidden below `md`. The inner container mirrors the hero's
 * centered `max-w-7xl` + `px-6` layout so the wordmark's left edge lines up
 * with where the resume card stack begins.
 */
export default function LogoBanner({ watchRef }: LogoBannerProps) {
  // Portals need `document`, which doesn't exist during SSR — mount after
  // hydration. The flag is set from a microtask so it isn't a synchronous
  // setState in the effect body (which triggers cascading renders).
  const [mounted, setMounted] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  // Fade out whenever the hero scrolls / pans out of the viewport.
  useEffect(() => {
    const el = watchRef?.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [watchRef]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`pointer-events-none fixed left-0 top-0 z-50 hidden w-full transition-opacity duration-300 md:block ${futuraDisplay.variable}`}
      style={{ opacity: heroVisible ? 1 : 0 }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-6 pb-4 pt-6 md:gap-4 md:pb-5 md:pt-8 xl:pt-10">
        <Image
          src="/assets/logos/rmr_logo.png"
          alt="RoastMyResume logo"
          width={64}
          height={64}
          priority
          className="h-12 w-auto md:h-14 xl:h-16"
        />
        <span
          className="select-none text-4xl leading-none tracking-tight text-white md:text-5xl xl:text-6xl"
          style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
        >
          Roast<span className="text-white/40">My</span>Resume
        </span>
      </div>
    </div>,
    document.body
  );
}
