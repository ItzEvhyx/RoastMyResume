'use client';

import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';

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

export default function SampleMobile() {
  return (
    <section
      className={`relative z-10 flex flex-col items-center gap-6 px-5 py-14 text-center ${poppins.variable} ${futuraDisplay.variable}`}
    >
      <h2
        className="text-5xl leading-none text-white"
        style={{ fontFamily: futuraStack, fontWeight: 800 }}
      >
        See a sample
      </h2>

      <p
        className="max-w-md text-base leading-relaxed text-white/80"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 300 }}
      >
        Not sure what to expect? Take a look at a real resume that went through
        the wringer. Below is the before, the AI&apos;s honest breakdown, and
        the cleaned-up after — so you know exactly what kind of feedback
        you&apos;re signing up for.
      </p>

      {/* Sample resume placeholder */}
      <div className="aspect-[1414/2000] w-full max-w-[260px] bg-white" />

      <button
        className="rounded-full bg-white px-8 py-3 text-base text-black transition-transform active:scale-95"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
      >
        View sample &gt;
      </button>
    </section>
  );
}
