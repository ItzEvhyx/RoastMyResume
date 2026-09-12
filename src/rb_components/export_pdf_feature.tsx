'use client';

import { useEffect, useRef } from 'react';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import gsap from 'gsap';
import { HiDocumentArrowDown, HiCheckCircle } from 'react-icons/hi2';
import {
  registerFeatureStep,
  requestSequenceStart,
} from '@/rb_components/feature_sequence';

/** Play order within the Features sequence. */
const ORDER = 3;

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

const futuraStack = 'var(--font-futura-display), sans-serif';

/**
 * "Export to PDF" feature card animation.
 *
 * Sequence (plays once per page load, then persists):
 *   1. A file icon appears in the center.
 *   2. A cursor hovers over it; an "Export to PDF" box appears.
 *   3. The cursor clicks.
 *   4. A progress bar loads 0 -> 100% smoothly.
 *   5. "File saved" + checkmark appears.
 *   6. Everything disappears.
 *   7. Final: header "Export to pdf" + body + icon settles in.
 *
 * Module-level flag prevents replay on remount; a reload resets it.
 */
let hasPlayed = false;

export default function ExportPdfFeature({ className = '' }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = gsap.utils.selector(root);
    const stage = q('[data-stage]');
    const file = q('[data-file]');
    const tooltip = q('[data-tooltip]');
    const cursor = q('[data-cursor]');
    const clickRing = q('[data-click-ring]');
    const progressWrap = q('[data-progress-wrap]');
    const progressBar = q('[data-progress-bar]');
    const saved = q('[data-saved]');
    const content = q('[data-content]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const showFinal = () => {
      gsap.set([stage, saved], { autoAlpha: 0 });
      gsap.set(content, { autoAlpha: 1, y: 0 });
    };

    if (reduce || hasPlayed) {
      showFinal();
      return;
    }

    gsap.set(stage, { autoAlpha: 1 });
    gsap.set(file, { autoAlpha: 0, scale: 0.9, color: '#9ca3af' });
    gsap.set(tooltip, { autoAlpha: 0, y: 6 });
    gsap.set(cursor, { autoAlpha: 0, xPercent: -50, yPercent: -50, left: '85%', top: '90%' });
    gsap.set(clickRing, { autoAlpha: 0, xPercent: -50, yPercent: -50 });
    gsap.set(progressWrap, { autoAlpha: 0 });
    gsap.set(progressBar, { scaleX: 0, transformOrigin: '0% 50%' });
    gsap.set(saved, { autoAlpha: 0, scale: 0.85 });
    gsap.set(content, { autoAlpha: 0, y: 12 });

    let tl: gsap.core.Timeline | null = null;

    const play = () =>
      new Promise<void>((resolve) => {
      if (hasPlayed) {
        showFinal();
        resolve();
        return;
      }
      hasPlayed = true;

      tl = gsap.timeline({ onComplete: () => resolve() });

      // 1. File icon appears
      tl.to(file, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(1.6)' });

      // 2. Cursor moves in, hovers over the file -> file highlights + tooltip
      tl.to(cursor, { autoAlpha: 1, duration: 0.2 }, '<');
      tl.to(cursor, { left: '50%', top: '54%', duration: 0.8, ease: 'power2.inOut' });
      tl.to(file, { color: '#000000', scale: 1.08, duration: 0.25, ease: 'power2.out' }); // hover highlight
      tl.to(tooltip, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, '-=0.1');
      tl.to({}, { duration: 0.5 }); // linger on the hover state

      // 3. Cursor clicks — clear press: cursor dips, file dips, ring pulses
      tl.to(cursor, { scale: 0.8, duration: 0.12, ease: 'power2.in' });
      tl.to(file, { scale: 0.92, duration: 0.12, ease: 'power2.in' }, '<');
      tl.fromTo(
        clickRing,
        { autoAlpha: 0.8, scale: 0.4 },
        { autoAlpha: 0, scale: 1.6, duration: 0.5, ease: 'power2.out' },
        '<'
      );
      tl.to([cursor, file], { scale: 1, duration: 0.15, ease: 'power2.out' });

      // 4. Tooltip + cursor out, progress bar loads 0 -> 100%
      tl.to([tooltip, cursor], { autoAlpha: 0, duration: 0.25 }, '+=0.1');
      tl.to(progressWrap, { autoAlpha: 1, duration: 0.2 }, '-=0.1');
      tl.to(progressBar, { scaleX: 1, duration: 1.5, ease: 'power1.inOut' });

      // 5. Everything on the stage out, "File saved" + check in
      tl.to(stage, { autoAlpha: 0, duration: 0.3 }, '+=0.1');
      tl.to(saved, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }, '-=0.1');
      tl.to({}, { duration: 1.1 });

      // 6. Saved out
      tl.to(saved, { autoAlpha: 0, scale: 0.9, duration: 0.3 });

      // 7. Final content settles in
      tl.to(content, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.05');
    });

    const unregister = registerFeatureStep({ order: ORDER, play });

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          requestSequenceStart();
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(root);

    return () => {
      io.disconnect();
      unregister();
      tl?.kill();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`relative h-full w-full overflow-hidden ${poppins.variable} ${futuraDisplay.variable} ${className}`}
      aria-hidden="true"
    >
      {/* Interactive stage — file icon, tooltip, cursor, progress bar */}
      <div data-stage className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
        {/* File icon (starts gray, highlights to black on hover) */}
        <div data-file className="relative text-neutral-400">
          <HiDocumentArrowDown className="h-14 w-14" />
          {/* Click ripple, centered on the icon */}
          <span
            data-click-ring
            className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 rounded-full border-2 border-black"
          />
        </div>

        {/* Tooltip */}
        <div
          data-tooltip
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white shadow-lg"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 500 }}
        >
          Export to PDF
        </div>

        {/* Progress bar */}
        <div data-progress-wrap className="mt-1 w-40">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
            <div data-progress-bar className="h-full w-full rounded-full bg-black" />
          </div>
        </div>

        {/* Cursor */}
        <div data-cursor className="pointer-events-none absolute z-30 text-black">
          <svg viewBox="0 0 24 24" className="h-7 w-7 drop-shadow" fill="currentColor">
            <path d="M4 2l7 18 2.5-7.5L21 10 4 2z" />
          </svg>
        </div>
      </div>

      {/* File saved message */}
      <div data-saved className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 px-6 text-center">
        <HiCheckCircle className="h-12 w-12 text-green-500" />
        <p className="text-lg font-semibold text-neutral-800" style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}>
          File saved
        </p>
      </div>

      {/* Final content — icon on the LEFT, text stacked to its right */}
      <div data-content className="absolute inset-0 z-10 flex items-center justify-start gap-3 px-5 text-left md:gap-5 md:px-8">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-black text-white md:h-16 md:w-16 md:rounded-2xl">
          <HiDocumentArrowDown className="h-6 w-6 md:h-9 md:w-9" />
        </span>
        <div className="flex flex-col gap-1 md:gap-2">
          <h3 className="text-xl leading-none text-black md:text-2xl xl:text-4xl" style={{ fontFamily: futuraStack, fontWeight: 800 }}>
            Export to pdf
          </h3>
          <p
            className="text-xs leading-snug text-neutral-600 md:text-sm xl:text-lg"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
          >
            One click, and your layout, fonts, and spacing lock in exactly as
            built.
          </p>
        </div>
      </div>
    </div>
  );
}
