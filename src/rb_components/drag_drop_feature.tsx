'use client';

import { useEffect, useRef } from 'react';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import gsap from 'gsap';
import { HiCursorArrowRays } from 'react-icons/hi2';
import {
  registerFeatureStep,
  requestSequenceStart,
} from '@/rb_components/feature_sequence';

/** Play order within the Features sequence. */
const ORDER = 0;

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
 * "Drag and drop" feature card animation.
 *
 * Sequence (plays once per page load, then persists):
 *   1. A text element sits at the upper-left corner of the container.
 *   2. A cursor grabs it and drags it toward the middle.
 *   3. Cursor + text block disappear.
 *   4. The final content pops up in the center...
 *   5. ...then settles / aligns to the left of the container.
 *
 * A module-level flag keeps it from replaying on remount within the same page
 * load; a full reload resets it. Reduced motion shows the final state.
 */
let hasPlayed = false;

export default function DragDropFeature({ className = '' }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = gsap.utils.selector(root);
    const cursor = q('[data-cursor]');
    const chip = q('[data-chip]');
    const content = q('[data-content]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const showFinal = () => {
      gsap.set(cursor, { autoAlpha: 0 });
      gsap.set(chip, { autoAlpha: 0 });
      gsap.set(content, { autoAlpha: 1, scale: 1, xPercent: 0, yPercent: 0, left: 0, top: 0 });
    };

    if (reduce || hasPlayed) {
      showFinal();
      return;
    }

    // Initial state: chip at upper-left, cursor near it, content hidden and
    // centered (it will pop in the middle, then slide to the left resting spot).
    gsap.set(content, { autoAlpha: 0, scale: 0.9, xPercent: -50, yPercent: -50, left: '50%', top: '50%' });
    gsap.set(chip, { autoAlpha: 0, xPercent: -50, yPercent: -50, left: '16%', top: '20%', scale: 1 });
    gsap.set(cursor, { autoAlpha: 0, xPercent: -50, yPercent: -50, left: '10%', top: '14%' });

    let tl: gsap.core.Timeline | null = null;

    // Starts the animation; resolves when it has finished settling. If it has
    // already played (or reduced motion), resolves immediately in final state.
    const play = () =>
      new Promise<void>((resolve) => {
        if (hasPlayed) {
          showFinal();
          resolve();
          return;
        }
        hasPlayed = true;

        tl = gsap.timeline({ onComplete: () => resolve() });

        // 1. Chip + cursor appear at the upper-left corner
        tl.to(chip, { autoAlpha: 1, duration: 0.25 });
        tl.to(cursor, { autoAlpha: 1, left: '16%', top: '20%', duration: 0.4, ease: 'power2.out' }, '<');
        tl.to(cursor, { scale: 0.85, duration: 0.12 }); // "grab"

        // 2. Drag chip + cursor toward the middle
        tl.to([chip, cursor], { left: '50%', top: '50%', duration: 0.9, ease: 'power2.inOut' }, '+=0.05');

        // 3. Cursor + text block disappear
        tl.to(cursor, { scale: 1, duration: 0.1 });
        tl.to([cursor, chip], { autoAlpha: 0, duration: 0.3 }, '+=0.05');

        // 4. Final content pops up in the center
        tl.to(content, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, '-=0.1');

        // 5. ...then settles / aligns to the left of the container
        tl.to(content, { left: 0, top: 0, xPercent: 0, yPercent: 0, duration: 0.55, ease: 'power3.inOut' }, '+=0.3');
      });

    const unregister = registerFeatureStep({ order: ORDER, play });

    // When this card scrolls into view, ask the coordinator to run the
    // sequence (it starts once and drives every card in order).
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
      {/* Dragged text chip (transient) */}
      <div
        data-chip
        className="pointer-events-none absolute z-20 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-lg"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 500 }}
      >
        Section
      </div>

      {/* Cursor (transient) */}
      <div data-cursor className="pointer-events-none absolute z-30 text-black">
        <HiCursorArrowRays className="h-8 w-8 drop-shadow" />
      </div>

      {/* Final content — icon on the LEFT, text stacked to its right.
          Sizes scale up at md: so desktop is unchanged while mobile fits. */}
      <div data-content className="absolute inset-0 z-10 flex w-full items-center justify-start gap-3 px-5 text-left md:gap-5 md:px-8">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-black text-white md:h-16 md:w-16 md:rounded-2xl">
          <HiCursorArrowRays className="h-6 w-6 md:h-9 md:w-9" />
        </span>
        <div className="flex flex-col gap-1 md:gap-2">
          <h3 className="text-xl leading-none text-black md:text-2xl xl:text-4xl" style={{ fontFamily: futuraStack, fontWeight: 800 }}>
            Drag and drop
          </h3>
          <p
            className="text-xs leading-snug text-neutral-600 md:text-sm xl:text-lg"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
          >
            Place every section exactly where you want it — no rigid forms, no
            fighting margins.
          </p>
        </div>
      </div>
    </div>
  );
}
