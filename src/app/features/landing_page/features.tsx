'use client';

import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-poppins',
});

// Same fallback stack as Hero.tsx / About.tsx
const futuraStack = "'Futura', 'Century Gothic', 'Poppins', sans-serif";

export default function Features() {
  return (
    <section
      className={`relative z-10 mx-auto w-full max-w-7xl px-6 py-24 ${poppins.variable}`}
    >
      <h2
        className="mb-10 text-4xl leading-none text-white md:text-5xl"
        style={{ fontFamily: futuraStack, fontWeight: 800 }}
      >
        The resume feedback you actually need
      </h2>

      {/*
        6 cells, auto-placed by CSS grid:
        1. left-big  -> col 1, spans rows 1–3
        2. right-1   -> col 2, row 1
        3. right-2   -> col 2, row 2
        4. right-3   -> col 2, row 3
        5. left-bottom -> col 1, row 4 (only free cell left in col 1)
        6. right-4   -> col 2, row 4
        Order of the divs below is what drives this — don't reorder them.
      */}
      <div className="grid h-[520px] grid-cols-1 grid-rows-[repeat(6,1fr)] gap-4 md:h-[600px] md:grid-cols-2 md:grid-rows-4">
        <div className="row-span-1 bg-white md:row-span-3" />
        <div className="bg-white" />
        <div className="bg-white" />
        <div className="bg-white" />
        <div className="bg-white" />
        <div className="bg-white" />
      </div>
    </section>
  );
}