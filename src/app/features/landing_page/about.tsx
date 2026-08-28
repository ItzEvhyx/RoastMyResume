'use client';

import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import { Check } from 'lucide-react';
import ResumeRoastAnimation from '@/rb_components/resume_roast_animation';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-poppins',
});

// Futura Display — loaded from the local .ttf file (same as Hero).
const futuraDisplay = localFont({
  src: '../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

const futuraStack = 'var(--font-futura-display), sans-serif';

export default function About() {
  return (
    <section
      className={`relative z-10 mx-auto flex w-full max-w-6xl items-stretch gap-8 px-6 md:pl-20 ${poppins.variable} ${futuraDisplay.variable}`}
    >
      {/* Left — transparent stage where a resume writes itself and gets
          roasted. Stretches to the height of the right column so their tops
          and bottoms line up. */}
      <div
        data-speed="0.85"
        className="w-[48%] shrink-0 self-stretch"
      >
        <ResumeRoastAnimation />
      </div>

      {/* Right — heading, copy, then a row of two smaller placeholders */}
      <div className="flex flex-1 flex-col">
        <h2
          className="mb-4 text-7xl leading-none text-white md:text-8xl"
          style={{ fontFamily: futuraStack, fontWeight: 800 }}
        >
          About
        </h2>

        <p
          className="text-justify text-lg leading-relaxed text-white/85 md:text-2xl"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 300 }}
        >
          A resume builder that doesn&apos;t just help you write a resume — it
          tells you the truth about it. Users build their resume on a
          drag-and-drop canvas, choosing from field-specific templates and
          arranging sections visually instead of fighting with Word
          formatting. Once it&apos;s built — or if you just upload an
          existing resume — you hand it over to the AI for feedback.
        </p>

        {/* Checklist, pushed to the bottom of the column */}
        <ul
          className="mt-auto flex flex-col gap-3 pt-8 text-lg text-white/90 md:text-xl"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
        >
          {[
            'No account required to start building',
            'Feedback generated in seconds, not days',
            'Nothing saved to a server — it stays in your browser',
          ].map((line) => (
            <li key={line} className="flex items-center gap-3">
              <Check className="h-6 w-6 shrink-0 text-white" strokeWidth={2.5} aria-hidden="true" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
