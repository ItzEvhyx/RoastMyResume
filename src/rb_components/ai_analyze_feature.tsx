'use client';

import { useEffect, useRef } from 'react';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import gsap from 'gsap';
import { HiSparkles } from 'react-icons/hi2';
import {
  registerFeatureStep,
  requestSequenceStart,
} from '@/rb_components/feature_sequence';

/** Play order within the Features sequence. */
const ORDER = 1;

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
 * "Let Denise Analyze" feature card animation.
 *
 * Sequence (plays once per page load, then persists):
 *   1. Blurred text appears spanning the container via a typewriter reveal.
 *   2. A bar scanner sweeps top -> bottom.
 *   3. Everything disappears.
 *   4. An AI shimmer line shows in the center.
 *   5. The response writes in: header "Let Denise Analyze" + body, left-aligned
 *      with an icon.
 *   6. Persists.
 *
 * Module-level flag prevents replay on remount; a reload resets it.
 */
let hasPlayed = false;

export default function AiAnalyzeFeature({ className = '' }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = gsap.utils.selector(root);
    const scanStage = q('[data-scan-stage]');
    const blurLines = q('[data-blur-line]');
    const scanner = q('[data-scanner]');
    const thinking = q('[data-thinking]');
    const content = q('[data-content]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const showFinal = () => {
      gsap.set(scanStage, { autoAlpha: 0 });
      gsap.set(thinking, { autoAlpha: 0 });
      gsap.set(content, { autoAlpha: 1, y: 0 });
    };

    if (reduce || hasPlayed) {
      showFinal();
      return;
    }

    // Initial state
    gsap.set(scanStage, { autoAlpha: 1 });
    gsap.set(blurLines, { scaleX: 0, transformOrigin: '0% 50%' });
    gsap.set(scanner, { autoAlpha: 0, top: '0%' });
    gsap.set(thinking, { autoAlpha: 0 });
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

        // 1. Blurred text "types" across the container, line by line
        tl.to(blurLines, {
          scaleX: 1,
          duration: 0.3,
          stagger: 0.14,
          ease: 'steps(12)',
        });

        // 2. Bar scanner sweeps top -> bottom
        tl.to(scanner, { autoAlpha: 1, duration: 0.12 }, '+=0.1');
        tl.to(scanner, { top: '100%', duration: 0.9, ease: 'power1.inOut' });
        tl.to(scanner, { autoAlpha: 0, duration: 0.15 }, '-=0.1');

        // 3. Everything (blurred text) disappears
        tl.to(scanStage, { autoAlpha: 0, duration: 0.3 }, '-=0.15');

        // 4. AI shimmer line in the center
        tl.to(thinking, { autoAlpha: 1, duration: 0.3 }, '+=0.05');
        tl.to({}, { duration: 1.5 });
        tl.to(thinking, { autoAlpha: 0, duration: 0.3 });

        // 5. Response writes in (left-aligned final content), persists
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
        @keyframes ai-shimmer {
          0% { background-position: -150% 0; }
          100% { background-position: 250% 0; }
        }
        .ai-shimmer-text {
          background: linear-gradient(
            100deg,
            #9ca3af 0%, #9ca3af 40%, #111111 50%, #9ca3af 60%, #9ca3af 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: ai-shimmer 1.6s linear infinite;
        }
      `}</style>

      {/* Scan stage — blurred typewriter text + scanner line, fills container */}
      <div data-scan-stage className="absolute inset-0 z-10">
        <div className="flex h-full flex-col justify-center gap-3 px-8 blur-[3px]">
          {['92%', '78%', '85%', '64%', '80%'].map((w, i) => (
            <span
              key={i}
              data-blur-line
              className="h-3 rounded bg-neutral-400"
              style={{ width: w }}
            />
          ))}
        </div>
        {/* Bar scanner */}
        <div
          data-scanner
          className="pointer-events-none absolute left-0 z-20 h-[3px] w-full -translate-y-1/2 bg-black shadow-[0_0_16px_3px_rgba(0,0,0,0.4)]"
        />
      </div>

      {/* AI shimmer line, centered */}
      <p
        data-thinking
        className="ai-shimmer-text absolute inset-0 z-20 flex items-center justify-center px-8 text-center text-xl font-semibold"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
      >
        Denise is coming up with a comeback...
      </p>

      {/* Final content — icon on the LEFT, text stacked to its right.
          Sizes scale up at md: so desktop is unchanged while mobile fits. */}
      <div data-content className="absolute inset-0 z-10 flex items-center justify-start gap-3 px-5 text-left md:gap-5 md:px-8">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-black text-white md:h-16 md:w-16 md:rounded-2xl">
          <HiSparkles className="h-6 w-6 md:h-9 md:w-9" />
        </span>
        <div className="flex flex-col gap-1 md:gap-2">
          <h3 className="text-xl leading-none text-black md:text-2xl xl:text-4xl" style={{ fontFamily: futuraStack, fontWeight: 800 }}>
            Let Denise Analyze
          </h3>
          <p
            className="text-xs leading-snug text-neutral-600 md:text-sm xl:text-lg"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
          >
            Get a full breakdown of what&apos;s weak, what&apos;s missing, and
            what a recruiter would flag first.
          </p>
        </div>
      </div>
    </div>
  );
}
