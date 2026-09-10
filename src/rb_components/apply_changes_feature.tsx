'use client';

import { useEffect, useRef } from 'react';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import gsap from 'gsap';
import { HiCheckCircle, HiArrowPath } from 'react-icons/hi2';
import {
  registerFeatureStep,
  requestSequenceStart,
} from '@/rb_components/feature_sequence';

/** Play order within the Features sequence. */
const ORDER = 2;

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
 * "Apply changes" feature card animation.
 *
 * Sequence (plays once per page load, then persists):
 *   1. A black "Apply Denise's fixes" button appears.
 *   2. A cursor drags to it and presses it.
 *   3. A radial tick spinner + shimmer "Applying A.I recommendations..."
 *   4. Pops out.
 *   5. "Changes applied successfully!" pops up from center with a check icon.
 *   6. Pops out.
 *   7. Final: header "Apply changes" + body + icon settles in.
 *
 * Module-level flag prevents replay on remount; a reload resets it.
 */
let hasPlayed = false;

// Radial spinner made of ticks (spoke style).
const TICKS = Array.from({ length: 24 });

export default function ApplyChangesFeature({ className = '' }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = gsap.utils.selector(root);
    const button = q('[data-button]');
    const cursor = q('[data-cursor]');
    const applying = q('[data-applying]');
    const spinner = q('[data-spinner]');
    const success = q('[data-success]');
    const content = q('[data-content]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const showFinal = () => {
      gsap.set([button, cursor, applying, success], { autoAlpha: 0 });
      gsap.set(content, { autoAlpha: 1, y: 0 });
    };

    if (reduce || hasPlayed) {
      showFinal();
      return;
    }

    gsap.set(button, { autoAlpha: 0, scale: 0.9, xPercent: -50, yPercent: -50, left: '50%', top: '50%' });
    gsap.set(cursor, { autoAlpha: 0, xPercent: -50, yPercent: -50, left: '85%', top: '85%' });
    gsap.set(applying, { autoAlpha: 0 });
    gsap.set(success, { autoAlpha: 0, scale: 0.85 });
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

      // 1. Green button appears
      tl.to(button, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)' });

      // 2. Cursor drags to the button and presses
      tl.to(cursor, { autoAlpha: 1, duration: 0.2 }, '<');
      tl.to(cursor, { left: '50%', top: '50%', duration: 0.7, ease: 'power2.inOut' });
      tl.to(cursor, { scale: 0.85, duration: 0.1 });
      tl.to(button, { scale: 0.94, duration: 0.1 }, '<');
      tl.to([cursor, button], { scale: 1, duration: 0.1 });

      // 3. Button + cursor out, spinner + shimmer text in.
      //    Spin the ticks as part of the timeline (finite rotations over the
      //    hold) so there's no separate tween to manage/kill.
      tl.to([button, cursor], { autoAlpha: 0, duration: 0.25 });
      tl.to(applying, { autoAlpha: 1, duration: 0.25 }, '-=0.1');
      tl.to(
        spinner,
        { rotation: 360 * 2, duration: 1.9, ease: 'none', transformOrigin: '50% 50%' },
        '<'
      );

      // 4. Applying pops out
      tl.to(applying, { autoAlpha: 0, duration: 0.25 });

      // 5. Success pops in from center
      tl.to(success, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }, '+=0.05');
      tl.to({}, { duration: 1.1 });

      // 6. Success pops out
      tl.to(success, { autoAlpha: 0, scale: 0.9, duration: 0.3 });

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
      <style>{`
        @keyframes ac-shimmer {
          0% { background-position: -150% 0; }
          100% { background-position: 250% 0; }
        }
        .ac-shimmer-text {
          background: linear-gradient(100deg, #9ca3af 0%, #9ca3af 40%, #111 50%, #9ca3af 60%, #9ca3af 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text; background-clip: text; color: transparent;
          animation: ac-shimmer 1.6s linear infinite;
        }
      `}</style>

      {/* Green button */}
      <button
        data-button
        className="pointer-events-none absolute z-20 rounded-full bg-black px-6 py-3 text-base font-semibold text-white shadow-lg"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
      >
        Apply Denise&rsquo;s fixes
      </button>

      {/* Cursor (transient) */}
      <div data-cursor className="pointer-events-none absolute z-30 text-black">
        <svg viewBox="0 0 24 24" className="h-7 w-7 drop-shadow" fill="currentColor">
          <path d="M4 2l7 18 2.5-7.5L21 10 4 2z" />
        </svg>
      </div>

      {/* Applying stage — radial tick spinner + shimmer text */}
      <div data-applying className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
        <svg data-spinner viewBox="0 0 100 100" className="h-16 w-16">
          {TICKS.map((_, i) => {
            const angle = (i / TICKS.length) * 360;
            const opacity = 0.15 + (i / TICKS.length) * 0.85;
            return (
              <rect
                key={i}
                x="47.5"
                y="6"
                width="5"
                height="16"
                rx="2.5"
                fill="#111"
                opacity={opacity}
                transform={`rotate(${angle} 50 50)`}
              />
            );
          })}
        </svg>
        <p className="ac-shimmer-text text-base font-semibold" style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}>
          Applying A.I recommendations...
        </p>
      </div>

      {/* Success message */}
      <div data-success className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 px-6 text-center">
        <HiCheckCircle className="h-12 w-12 text-green-500" />
        <p className="text-lg font-semibold text-neutral-800" style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}>
          Changes applied successfully!
        </p>
      </div>

      {/* Final content — icon on the LEFT, text stacked to its right */}
      <div data-content className="absolute inset-0 z-10 flex items-center justify-start gap-3 px-5 text-left md:gap-5 md:px-8">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-black text-white md:h-16 md:w-16 md:rounded-2xl">
          <HiArrowPath className="h-6 w-6 md:h-9 md:w-9" />
        </span>
        <div className="flex flex-col gap-1 md:gap-2">
          <h3 className="text-xl leading-none text-black md:text-4xl" style={{ fontFamily: futuraStack, fontWeight: 800 }}>
            Apply Denise&rsquo;s fixes
          </h3>
          <p
            className="text-xs leading-snug text-neutral-600 md:text-lg"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
          >
            Fix what Denise flagged right on the canvas — no starting over, no
            copy-pasting into a new doc.
          </p>
        </div>
      </div>
    </div>
  );
}
