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

const NAV_LINKS = [
  { label: 'Templates',  href: '#' },
  { label: 'Build',      href: '#' },
  { label: 'Review',     href: '#' },
  { label: 'Export PDF', href: '#' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/legal_terms?doc=privacy' },
  { label: 'Terms of Service', href: '/legal_terms?doc=terms' },
];

export default function FooterWeb() {
  return (
    <footer
      className={`relative z-10 flex w-full min-h-[200px] items-end overflow-visible bg-white lg:min-h-[240px] ${poppins.variable} ${futuraDisplay.variable}`}
      style={{ borderRadius: '2.5rem 2.5rem 0 0' }}
    >
      <div className="relative z-10 flex min-w-0 flex-1 flex-col px-6 pb-5 pt-6 md:px-12 lg:px-24">
        {/* Wordmark */}
        <div className="mb-3 flex items-center gap-3">
          <Image src="/assets/logos/rmr_logo.png" alt="RoastMyResume" width={36} height={36} className="h-8 w-auto" />
          <span
            className="text-2xl leading-none text-black md:text-3xl"
            style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
          >
            Roast<span className="text-black/35">My</span>Resume
          </span>
        </div>

        {/* Tagline */}
        <p className="mb-4 max-w-xs text-sm leading-snug text-black/50" style={{ fontFamily: 'var(--font-poppins)' }}>
          Build it clean. Get it roasted. Know exactly what to fix before a recruiter does.
        </p>

        {/* Nav */}
        <nav className="mb-3 flex flex-wrap gap-4 md:gap-8 lg:gap-12">
          {NAV_LINKS.map(link => (
            <a key={link.label} href={link.href}
              className="text-sm font-semibold text-black/60 transition-colors hover:text-black"
              style={{ fontFamily: 'var(--font-poppins)' }}>
              {link.label}
            </a>
          ))}
        </nav>

        {/* Divider + legal */}
        <div className="mb-2 h-px w-full max-w-md bg-black/10" />
        <div className="flex flex-wrap items-center gap-4 md:gap-8">
          <span className="text-xs text-black/35" style={{ fontFamily: 'var(--font-poppins)' }}>
            © {new Date().getFullYear()} RoastMyResume. All rights reserved.
          </span>
          {LEGAL_LINKS.map(link => (
            <a key={link.label} href={link.href}
              className="text-xs text-black/35 transition-colors hover:text-black/60"
              style={{ fontFamily: 'var(--font-poppins)' }}>
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Denise — breaks above the white banner; higher z so she isn’t cropped */}
      <div className="pointer-events-none relative z-20 hidden h-full w-[min(280px,28vw)] shrink-0 self-end overflow-visible lg:block xl:w-[320px]">
        <Image
          src="/assets/images/denise_footer_img.png"
          alt="Denise from HR"
          width={320}
          height={410}
          className="absolute bottom-0 right-0 z-20 block h-auto w-full max-w-[320px]"
          style={{ objectFit: 'contain', objectPosition: 'bottom' }}
        />
      </div>
    </footer>
  );
}
