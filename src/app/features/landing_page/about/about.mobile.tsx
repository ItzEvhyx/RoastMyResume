'use client';

import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import { Check } from 'lucide-react';
import ResumeRoastAnimation from '@/rb_components/resume_roast_animation';
import Reveal from '@/rb_components/reveal';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

const futuraStack = 'var(--font-futura-display), sans-serif';

export default function AboutMobile() {
  return (
    <section
      className={`relative z-10 flex flex-col gap-6 px-5 py-14 ${poppins.variable} ${futuraDisplay.variable}`}
    >
      <Reveal
        as="h2"
        className="text-6xl leading-none text-white"
        style={{ fontFamily: futuraStack, fontWeight: 800 }}
      >
        About
      </Reveal>

      {/* Roast animation — fixed height box since it fills its container */}
      <Reveal delay={100} className="h-[380px] w-full">
        <ResumeRoastAnimation />
      </Reveal>

      <Reveal
        as="p"
        delay={180}
        className="text-base leading-relaxed text-white/85"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 300 }}
      >
        A resume builder that doesn&apos;t just help you write a resume — it
        tells you the truth about it. Users build their resume on a
        drag-and-drop canvas, choosing from field-specific templates and
        arranging sections visually instead of fighting with Word formatting.
        Once it&apos;s built — or if you just upload an existing resume — you
        hand it over to the AI for feedback.
      </Reveal>

      <ul
        className="flex flex-col gap-3 text-base text-white/90"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
      >
        {[
          'No account required to start building',
          'Feedback generated in seconds, not days',
          'Nothing saved to a server — it stays in your browser',
        ].map((line, i) => (
          <Reveal
            as="li"
            key={line}
            delay={260 + i * 80}
            className="flex items-center gap-3"
          >
            <Check className="h-5 w-5 shrink-0 text-white" strokeWidth={2.5} aria-hidden="true" />
            <span>{line}</span>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
