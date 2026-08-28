'use client';

import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-poppins',
});

// Same fallback stack as Hero.tsx / About.tsx / Features.tsx
const futuraStack = "'Futura', 'Century Gothic', 'Poppins', sans-serif";

export default function Sample() {
  return (
    <section
      className={`relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-12 px-6 py-24 md:flex-row md:items-center md:gap-16 ${poppins.variable}`}
    >
      {/* Left — heading + copy */}
      <div className="flex w-full flex-col md:w-1/2">
        <h2
          className="mb-4 text-5xl leading-none text-white md:text-6xl"
          style={{ fontFamily: futuraStack, fontWeight: 800 }}
        >
          See a sample
        </h2>

        <p
          className="mb-8 text-base leading-relaxed text-white/80 md:text-lg"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 300 }}
        >
          Not sure what to expect? Take a look at a real resume that went
          through the wringer. Below is the before, the AI&apos;s honest
          breakdown, and the cleaned-up after — so you know exactly what kind
          of feedback you&apos;re signing up for.
        </p>

        <button
          className="w-fit rounded-full bg-white px-8 py-3 text-base text-black transition-transform hover:-translate-y-0.5"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
        >
          View sample &gt;
        </button>
      </div>

      {/* Right — sample resume placeholder */}
      <div className="flex w-full shrink-0 justify-center md:w-1/2 md:justify-end">
        <div data-speed="0.85" className="aspect-[1414/2000] w-full max-w-sm bg-white" />
      </div>
    </section>
  );
}
