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

export default function FeaturesMobile() {
  return (
    <section
      className={`relative z-10 flex flex-col px-5 py-14 ${poppins.variable} ${futuraDisplay.variable}`}
    >
      <h2
        className="mb-6 text-center text-4xl leading-tight text-white"
        style={{ fontFamily: futuraStack, fontWeight: 800 }}
      >
        The resume feedback you actually need
      </h2>

      {/* Single-column stack of cards, phone-friendly */}
      <div className="flex flex-col gap-3">
        <div className="aspect-square w-full rounded-2xl bg-white" />
        <div className="aspect-[16/7] w-full rounded-2xl bg-white" />
        <div className="aspect-[16/7] w-full rounded-2xl bg-white" />
        <div className="aspect-[16/7] w-full rounded-2xl bg-white" />
      </div>
    </section>
  );
}
