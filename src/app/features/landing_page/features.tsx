'use client';

import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-poppins',
});

// Futura Display — loaded from the local .ttf file (same as Hero / About).
const futuraDisplay = localFont({
  src: '../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

const futuraStack = 'var(--font-futura-display), sans-serif';

export default function Features() {
  return (
    <section
      className={`relative z-10 mx-auto w-full max-w-7xl px-6 ${poppins.variable} ${futuraDisplay.variable}`}
    >
      <h2
        className="mb-6 text-center text-5xl leading-none text-white md:text-6xl"
        style={{ fontFamily: futuraStack, fontWeight: 800 }}
      >
        The resume feedback you actually need
      </h2>

      {/*
        Auto-placed by CSS grid (2 cols x 4 rows):
        1. left-big    -> col 1, rows 1–3
        2. right-1     -> col 2, row 1
        3. right-2     -> col 2, row 2
        4. right-3     -> col 2, row 3
        5. left-bottom -> col 1, row 4 (only free cell left in col 1)
        6. right-4     -> col 2, row 4
        Order of the divs below drives this — don't reorder them.
      */}
      <div className="grid h-[560px] grid-cols-1 grid-rows-[repeat(6,1fr)] gap-4 md:h-[620px] md:grid-cols-2 md:grid-rows-4">
        <div className="row-span-1 rounded-2xl bg-white md:row-span-3" />
        <div className="rounded-2xl bg-white" />
        <div className="rounded-2xl bg-white" />
        <div className="rounded-2xl bg-white" />
        <div className="rounded-2xl bg-white" />
        <div className="rounded-2xl bg-white" />
      </div>
    </section>
  );
}
