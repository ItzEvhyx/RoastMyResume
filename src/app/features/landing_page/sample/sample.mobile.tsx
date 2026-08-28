'use client';

import Image from 'next/image';
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
      className={`relative z-10 flex flex-col px-5 py-14 ${poppins.variable} ${futuraDisplay.variable}`}
    >
      {/* Eyebrow */}
      <p
        className="mb-1 text-base italic text-white/60"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
      >
        - One tool, does two things
      </p>

      {/* Headline */}
      <h2
        className="mb-6 text-4xl leading-[1.05] text-white"
        style={{ fontFamily: futuraStack, fontWeight: 800 }}
      >
        Design it your way.
        <br />
        Review it your way.
      </h2>

      {/* Two stacked containers */}
      <div className="flex flex-col gap-6">

        {/* ---------------- BUILD CARD (white) ---------------- */}
        <div className="relative rounded-2xl bg-white pt-24">
          <div className="absolute left-1/2 top-5 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black px-6 py-3">
            <span
              className="text-xl tracking-widest text-white"
              style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
            >
              Build
            </span>
            <Image src="/assets/icons/build_resume_icon.svg" alt="" width={36} height={36} />
          </div>
          <div className="min-h-[280px] p-6" />
        </div>

        {/* ---------------- REVIEW CARD (dark) ---------------- */}
        <div className="relative rounded-2xl border-[3px] border-white bg-[#171717] pt-24">
          <div className="absolute left-1/2 top-5 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white px-6 py-3">
            <span
              className="text-xl tracking-widest text-black"
              style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
            >
              Review
            </span>
            <Image src="/assets/icons/review_resume_icon.svg" alt="" width={36} height={36} />
          </div>
          <div className="min-h-[280px] p-6" />
        </div>

      </div>
    </section>
  );
}
