import Image from 'next/image';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import type { Metadata } from 'next';
import GridGlowBackground from '@/rb_components/grid_glow_background';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Page not found · Roast My Resume',
};

export default function NetworkErrorPage() {
  return (
    <main
      className={`relative min-h-screen w-full bg-black ${poppins.variable} ${futuraDisplay.variable}`}
    >
      <GridGlowBackground />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-10 px-6 py-16 md:flex-row md:justify-center md:gap-16 lg:gap-20">
        <div className="w-full max-w-[260px] shrink-0 overflow-hidden rounded-[1.75rem] bg-white shadow-[0_24px_80px_rgba(255,255,255,0.08)] sm:max-w-[320px] md:max-w-[380px]">
          <Image
            src="/assets/images/denise_404_error.png"
            alt="Denise looking through a magnifying glass"
            width={1008}
            height={1063}
            priority
            className="aspect-square h-auto w-full object-cover object-top"
          />
        </div>

        <div className="flex max-w-md flex-col items-center text-center md:items-start md:text-left">
          <p
            className="mb-3 text-xs uppercase tracking-[0.32em] text-white/45 sm:text-sm"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
          >
            Page not found
          </p>
          <h1
            className="text-7xl leading-none text-white sm:text-8xl md:text-9xl"
            style={{ fontFamily: 'var(--font-futura-display), sans-serif' }}
          >
            404
          </h1>
          <p
            className="mt-5 max-w-sm text-lg leading-relaxed text-white/70 sm:text-xl"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 300 }}
          >
            Denise looked everywhere. This page isn&apos;t here.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center rounded-full bg-white px-8 py-3.5 text-base text-black transition-transform hover:-translate-y-0.5"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
