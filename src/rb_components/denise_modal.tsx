'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import { useDeniseModalOpen, closeDeniseModal } from '@/rb_components/denise_modal_store';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

const futuraStack = 'var(--font-futura-display), sans-serif';

/** Heading + body copy shown beside Denise. The body is typed out char-by-char. */
const HEADING = "That's the spirit!";
const BODY = `Allow me to introduce myself
I am Denise, from HR.

Here to review your resume like I've got 400 more in this pile. Because I do thousands of applications each day and I'll make sure yours isnt thrown in the bin.`;

// Sequence timings (ms), each stage waits for the previous to settle.
const T_MODAL = 60; //  backdrop dim + modal card pop in
const T_VIDEO = 380; // video panel pops in
const T_TEXT = 760; //  text block pops in
const T_TYPE = 1080; // typewriter begins
const TYPE_SPEED = 44; // base ms per character

// Extra pauses (ms) added *after* certain characters so the typewriter breathes
// the way a person does when introducing themselves — a beat after commas, a
// longer stop after sentences, and a clear gap between paragraphs.
const PAUSE_AFTER: Record<string, number> = {
  ',': 260,
  '.': 520,
  '!': 520,
  '?': 520,
  '\n': 420,
};

// The intro pauses feel right, but the closing paragraph ("Here to review...")
// should rattle out twice as fast. Everything from this substring onward types
// at half the speed and half the pauses.
const FAST_MARKER = 'Here to review';
const FAST_FROM = BODY.indexOf(FAST_MARKER);
const FAST_FACTOR = 0.5;

/**
 * Precompute the reveal time of each character. A character's delay is the base
 * type speed plus any pause carried over from the *previous* character, so the
 * gap lands after punctuation rather than before the next word. Characters at
 * or past FAST_FROM use the halved (2x faster) pacing.
 */
function buildTypeSchedule(text: string): number[] {
  const times: number[] = [];
  let t = 0;
  for (let i = 0; i < text.length; i++) {
    const fast = FAST_FROM >= 0 && i >= FAST_FROM;
    const factor = fast ? FAST_FACTOR : 1;
    const step = TYPE_SPEED + (i > 0 ? PAUSE_AFTER[text[i - 1]] ?? 0 : 0);
    t += step * factor;
    times.push(t);
  }
  return times;
}

const TYPE_SCHEDULE = buildTypeSchedule(BODY);

type Stage = 'hidden' | 'modal' | 'video' | 'text' | 'typing' | 'done';

export default function DeniseModal() {
  const open = useDeniseModalOpen();
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<Stage>('hidden');
  const [typed, setTyped] = useState('');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const router = useRouter();

  const handleContinue = () => {
    closeDeniseModal();
    router.push('/templates');
  };

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Drive the staged reveal whenever the modal opens; tear it down on close.
  // All setState happens inside scheduled callbacks (never synchronously in
  // the effect body) so React can batch them without cascading renders.
  useEffect(() => {
    const push = (fn: () => void, delay: number) => {
      timers.current.push(setTimeout(fn, delay));
    };

    if (!open) {
      clearTimers();
      // Reset + keep the node mounted briefly so the exit transition can play.
      push(() => {
        setStage('hidden');
        setTyped('');
      }, 0);
      push(() => setMounted(false), 250);
      return clearTimers;
    }

    push(() => {
      setMounted(true);
      setTyped('');
      setStage('hidden');
    }, 0);

    push(() => setStage('modal'), T_MODAL);
    push(() => setStage('video'), T_VIDEO);
    push(() => setStage('text'), T_TEXT);
    push(() => setStage('typing'), T_TYPE);

    // Typewriter: schedule one timer per character using the precomputed
    // schedule (base speed + natural pauses) so it stays in sync with the
    // stage sequence and is fully cleared on close.
    push(() => {
      for (let i = 1; i <= BODY.length; i++) {
        timers.current.push(
          setTimeout(() => setTyped(BODY.slice(0, i)), TYPE_SCHEDULE[i - 1])
        );
      }
      // Once the last character settles, slide in the Continue button.
      const lastCharTime = TYPE_SCHEDULE[BODY.length - 1];
      timers.current.push(
        setTimeout(() => setStage('done'), lastCharTime + 400)
      );
    }, T_TYPE);

    return clearTimers;
  }, [open]);

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDeniseModal();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!mounted) return null;

  const showModal = stage !== 'hidden';
  const showVideo = stage === 'video' || stage === 'text' || stage === 'typing' || stage === 'done';
  const showText = stage === 'text' || stage === 'typing' || stage === 'done';
  const typing = stage === 'typing';
  const showContinue = stage === 'done';

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${poppins.variable} ${futuraDisplay.variable}`}
      role="dialog"
      aria-modal="true"
      aria-label="Meet Denise from HR"
    >
      {/* Dimmed backdrop */}
      <button
        aria-label="Close"
        onClick={closeDeniseModal}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 transition-opacity duration-300"
        style={{ opacity: open && showModal ? 1 : 0 }}
      />

      {/* Modal card
          Mobile  : single column, scrollable, video shrinks to a fixed height.
          Desktop : side-by-side (sm:flex-row), video fills the left third.   */}
      <div
        className="no-scrollbar relative flex w-full max-w-3xl flex-col overflow-y-auto rounded-3xl border border-white/40 shadow-2xl transition-all duration-300 ease-out sm:max-h-[90vh] sm:flex-row sm:overflow-hidden"
        style={{
          backgroundColor: '#171717',
          maxHeight: '92dvh',
          opacity: open && showModal ? 1 : 0,
          transform: open && showModal ? 'scale(1)' : 'scale(0.94)',
        }}
      >
        {/* Close button */}
        <button
          aria-label="Close"
          onClick={closeDeniseModal}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <span className="text-2xl leading-none">&times;</span>
        </button>

        {/* Left — muted intro video
            Mobile  : capped height, centered, doesn't dominate the screen.
            Desktop : fills the left 2/5 panel at natural aspect ratio.      */}
        <div
          className="flex shrink-0 items-center justify-center p-4 transition-all duration-500 ease-out sm:w-2/5 sm:p-5"
          style={{
            opacity: showVideo ? 1 : 0,
            transform: showVideo ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)',
          }}
        >
          <video
            src="/assets/videos/denise_hr_intro.mp4"
            muted
            autoPlay
            playsInline
            className="h-48 w-auto rounded-2xl object-cover sm:h-auto sm:w-full"
          />
        </div>

        {/* Right — heading + typewriter body + Continue button in-flow on mobile */}
        <div
          className="flex flex-1 flex-col px-5 pb-6 pt-2 transition-all duration-500 ease-out sm:justify-center sm:py-10 sm:pr-10"
          style={{
            opacity: showText ? 1 : 0,
            transform: showText ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          <h2
            className="mb-3 text-3xl leading-none text-white sm:mb-4 sm:text-4xl md:text-5xl"
            style={{ fontFamily: futuraStack, fontWeight: 800 }}
          >
            {HEADING}
          </h2>

          <p
            className="whitespace-pre-line text-sm leading-relaxed text-white/80 sm:text-base md:text-lg"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
          >
            {typed}
            {typing && typed.length < BODY.length && (
              <span className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[2px] animate-pulse bg-white/80 align-middle" />
            )}
          </p>

          {/* Continue button — in normal flow on mobile so it never overlaps
              the text. On desktop it switches to absolute bottom-right.      */}
          <div className="mt-5 flex justify-end sm:hidden">
            <button
              onClick={handleContinue}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-all duration-500 ease-out hover:bg-white/90 active:scale-95"
              style={{
                fontFamily: 'var(--font-poppins)',
                opacity: showContinue ? 1 : 0,
                transform: showContinue ? 'translateY(0)' : 'translateY(10px)',
                pointerEvents: showContinue ? 'auto' : 'none',
              }}
            >
              Continue
            </button>
          </div>
        </div>

        {/* Continue button — absolute bottom-right on desktop only */}
        <button
          onClick={handleContinue}
          className="absolute bottom-5 right-6 hidden rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-all duration-500 ease-out hover:bg-white/90 active:scale-95 sm:block"
          style={{
            fontFamily: 'var(--font-poppins)',
            opacity: showContinue ? 1 : 0,
            transform: showContinue ? 'translateY(0)' : 'translateY(10px)',
            pointerEvents: showContinue ? 'auto' : 'none',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
