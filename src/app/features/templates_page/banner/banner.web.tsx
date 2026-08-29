'use client';

import Image from 'next/image';
import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';
import SpecularButton from '@/components/specular_button';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

export default function BannerWeb() {
  return (
    <>
    <div
      className={`relative z-10 w-screen overflow-hidden bg-white ${poppins.variable} ${futuraDisplay.variable}`}
      style={{ borderRadius: '0 0 2.5rem 2.5rem', minHeight: 300 }}
    >
      {/* Sign in — top-right, wider specular style */}
      <div className="absolute right-8 top-6 z-20">
        <SpecularButton
          radius={999}
          size="md"
          tint="#0b0d12"
          tintOpacity={1}
          textColor="#f5f5f5"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600, minWidth: 160 }}
        >
          Sign in
        </SpecularButton>
      </div>

      {/* Two-column layout */}
      <div className="flex h-full w-full items-center" style={{ minHeight: 300 }}>

        {/* Left — pill + Denise */}
        <div
          className="relative shrink-0"
          style={{ width: 570, height: 170, marginLeft: '8%', marginBottom: 28, overflow: 'visible', alignSelf: 'flex-end' }}
        >
          <div className="absolute inset-0 border-2 border-black/30" style={{ borderRadius: 9999 }} />
          <div className="absolute bottom-0 left-0" style={{ width: 380, pointerEvents: 'none' }}>
            <Image
              src="/assets/images/denise_hr_laptop.svg"
              alt="Denise at her laptop"
              width={380}
              height={430}
              priority
              className="block"
            />
          </div>
        </div>

        {/* Right — text + extras */}
        <div className="flex flex-1 flex-col justify-between self-stretch py-8 pl-12 pr-12">

          {/* Top spacer to push heading toward center */}
          <div />

          {/* Heading + subtext */}
          <div>
            <h1
              className="leading-none text-black"
              style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800, fontSize: 'clamp(3.5rem, 6vw, 7rem)' }}
            >
              Let&rsquo;s get started
            </h1>
            <p
              className="mt-6 leading-snug text-black/60"
              style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400, fontSize: 'clamp(1.1rem, 1.6vw, 1.5rem)' }}
            >
              A good template won&rsquo;t save a bad bullet point.
              <br />
              But let&rsquo;s start somewhere.
            </p>
          </div>

          {/* Bottom row — stats / badges */}
          <div className="flex items-center gap-6">
            {/* Divider */}
            <div className="h-px flex-1 bg-black/10" />

            {/* Stat: template count */}
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-2xl leading-none text-black"
                style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
              >
                5
              </span>
              <span
                className="text-xs uppercase tracking-widest text-black/40"
                style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
              >
                Templates
              </span>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-black/15" />

            {/* Free badge */}
            <span
              className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-widest text-black/50"
              style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
            >
              Free to use
            </span>

            {/* Divider */}
            <div className="h-4 w-px bg-black/15" />

            {/* No sign-up note */}
            <span
              className="text-xs text-black/40"
              style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
            >
              No account required
            </span>
          </div>

        </div>
      </div>
    </div>

    {/* "Templates" stamp — centered, tilted, overlapping the dark bg. */}
    <div className={`relative z-20 flex justify-center ${futuraDisplay.variable}`} style={{ marginTop: 32 }}>
      <span
        className="inline-block -rotate-2 rounded-md bg-white px-20 py-5 text-black shadow-lg tracking-widest"
        style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800, fontSize: 'clamp(4rem, 7vw, 7rem)', lineHeight: 1 }}
      >
        Templates
      </span>
    </div>
    </>
  );
}
