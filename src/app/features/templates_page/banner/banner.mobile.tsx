'use client';

import Image from 'next/image';
import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';

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

export default function BannerMobile() {
  return (
    <>
    <div
      className={`relative z-10 w-screen overflow-hidden bg-white ${poppins.variable} ${futuraDisplay.variable}`}
      style={{ borderRadius: '0 0 1.75rem 1.75rem', minHeight: 148 }}
    >
      {/* Sign in intentionally omitted on mobile — not enough space */}

      {/* Single row: pill+Denise left, text right — both centered on the same axis */}
      <div className="flex h-full w-full items-center" style={{ minHeight: 148, paddingTop: 8, paddingBottom: 16 }}>

        {/* Left — pill + Denise */}
        <div
          className="relative shrink-0"
          style={{ width: 140, height: 78, marginLeft: '5%', overflow: 'visible' }}
        >
          {/* Pill outline */}
          <div
            className="absolute inset-0 border-2 border-black/25"
            style={{ borderRadius: 9999 }}
          />
          {/* Denise */}
          <div className="absolute bottom-0 left-0" style={{ width: 120, pointerEvents: 'none' }}>
            <Image
              src="/assets/images/denise_hr_laptop.svg"
              alt="Denise at her laptop"
              width={120}
              height={135}
              priority
              className="block"
            />
          </div>
        </div>

        {/* Right — text left-aligned, vertically centered */}
        <div
          className="flex flex-col justify-center pl-4"
          style={{ flex: 1 }}
        >
          <h1
            className="leading-none text-black"
            style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800, fontSize: 'clamp(1.4rem, 5.5vw, 2rem)' }}
          >
            Let&rsquo;s get started
          </h1>
          <p
            className="mt-2 leading-snug text-black/55"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400, fontSize: 'clamp(0.75rem, 3vw, 0.9rem)' }}
          >
            A good template won&rsquo;t save<br />a bad bullet point.<br />But let&rsquo;s start somewhere.
          </p>
        </div>

      </div>
    </div>

    {/* Templates stamp */}
    <div className={`relative z-20 flex justify-center ${futuraDisplay.variable}`} style={{ marginTop: 24 }}>
      <span
        className="inline-block -rotate-2 rounded-md bg-white px-8 py-3 text-black shadow-lg tracking-widest"
        style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 8vw, 3rem)', lineHeight: 1 }}
      >
        Templates
      </span>
    </div>
    </>
  );
}
