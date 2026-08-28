'use client';

import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-poppins',
});

// Same fallback stack as Hero.tsx — swap for next/font/local once you have
// licensed Futura files, or swap to Archivo Black if you go that route.
const futuraStack = "'Futura', 'Century Gothic', 'Poppins', sans-serif";

export default function About() {
  return (
    <section
      className={`relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-12 px-6 py-24 md:flex-row md:items-center md:gap-16 ${poppins.variable}`}
    >
      {/* Left — image placeholder */}
      <div className="flex w-full shrink-0 justify-center md:w-auto md:justify-start">
        <div data-speed="0.8" className="aspect-square w-full max-w-md bg-white md:w-[420px]" />
      </div>

      {/* Right — heading, copy, and two smaller placeholders */}
      <div className="flex w-full flex-col">

        <h2
          className="mb-4 text-5xl leading-none text-white md:text-6xl"
          style={{ fontFamily: futuraStack, fontWeight: 800 }}
        >
          About
        </h2>

        <p
          className="mb-8 text-justify text-base leading-relaxed text-white/80 md:text-lg"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 300 }}
        >
          A resume builder that doesn&apos;t just help you write a resume — it
          tells you the truth about it. Users build their resume on a
          drag-and-drop canvas, choosing from field-specific templates and
          arranging sections visually instead of fighting with Word
          formatting. Once it&apos;s built — or if you just upload an
          existing resume — you hand it over to the AI for feedback.
        </p>

        {/* Two smaller placeholders */}
        <div className="flex gap-4">
          <div className="aspect-[3/2] flex-[2] bg-white" />
          <div className="aspect-[3/2] flex-1 border border-white/40 bg-transparent" />
        </div>

      </div>
    </section>
  );
}