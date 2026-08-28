// src/rb_components/sample.web.tsx
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

export default function Sample() {
  return (
    <section
      className={`relative z-10 mx-auto w-full max-w-7xl px-6 py-24 ${poppins.variable} ${futuraDisplay.variable}`}
    >
      {/* Eyebrow */}
      <p
        className="mb-1 text-lg italic text-white/60"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
      >
        - One tool, does two things
      </p>

      {/* Headline */}
      <h2
        className="mb-6 text-5xl leading-[1.05] text-white md:text-6xl"
        style={{ fontFamily: futuraStack, fontWeight: 800 }}
      >
        Design it your way.
        <br />
        Review it your way.
      </h2>

      {/* Two containers */}
      <div className="flex flex-col gap-6 md:flex-row">

        {/* ---------------- BUILD CARD (white) ---------------- */}
        <div className="relative flex-1 rounded-2xl bg-white pt-28">
          {/* Notch pill — inside the container, near the top */}
          <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black px-6 py-3">
            <span
              className="text-2xl tracking-widest text-white"
              style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
            >
              Build
            </span>
            <Image
              src="/assets/icons/build_resume_icon.svg"
              alt=""
              width={40}
              height={40}
            />
          </div>

          {/* Card body — content TBD */}
          <div className="min-h-[420px] p-8" />
        </div>

        {/* ---------------- REVIEW CARD (dark) ---------------- */}
        <div className="relative flex-1 rounded-2xl border-[3px] border-white bg-[#171717] pt-28">
          {/* Notch pill — inside the container, near the top */}
          <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white px-6 py-3">
            <span
              className="text-2xl tracking-widest text-black"
              style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
            >
              Review
            </span>
            <Image
              src="/assets/icons/review_resume_icon.svg"
              alt=""
              width={40}
              height={40}
            />
          </div>

          {/* Card body — content TBD */}
          <div className="min-h-[420px] p-8" />
        </div>

      </div>
    </section>
  );
}