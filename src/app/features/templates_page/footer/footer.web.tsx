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
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Use',   href: '#' },
];

export default function FooterWeb() {
  return (
    <footer
      className={`relative z-10 w-full bg-white ${poppins.variable} ${futuraDisplay.variable}`}
      style={{ borderRadius: '2.5rem 2.5rem 0 0', height: 240 }}
    >
      {/* Left content */}
      <div className="absolute bottom-0 left-0 flex flex-col px-24 pb-5 pt-6">
        {/* Wordmark */}
        <div className="mb-3 flex items-center gap-3">
          <Image src="/assets/logos/rmr_logo.png" alt="RoastMyResume" width={36} height={36} className="h-8 w-auto" />
          <span
            className="text-3xl leading-none text-black"
            style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
          >
            Roast<span className="text-black/35">My</span>Resume
          </span>
        </div>

        {/* Tagline */}
        <p className="mb-4 text-sm leading-snug text-black/50 max-w-xs" style={{ fontFamily: 'var(--font-poppins)' }}>
          Build it clean. Get it roasted. Know exactly what to fix before a recruiter does.
        </p>

        {/* Nav */}
        <nav className="mb-3 flex gap-12">
          {NAV_LINKS.map(link => (
            <a key={link.label} href={link.href}
              className="text-sm font-semibold text-black/60 hover:text-black transition-colors"
              style={{ fontFamily: 'var(--font-poppins)' }}>
              {link.label}
            </a>
          ))}
        </nav>

        {/* Divider + legal */}
        <div className="mb-2 h-px w-full max-w-md bg-black/10" />
        <div className="flex items-center gap-8">
          <span className="text-xs text-black/35" style={{ fontFamily: 'var(--font-poppins)' }}>
            © {new Date().getFullYear()} RoastMyResume. All rights reserved.
          </span>
          {LEGAL_LINKS.map(link => (
            <a key={link.label} href={link.href}
              className="text-xs text-black/35 hover:text-black/60 transition-colors"
              style={{ fontFamily: 'var(--font-poppins)' }}>
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Denise — absolute, inset from right edge */}
      <div className="absolute bottom-0" style={{ right: '6%', overflow: 'visible' }}>
        <Image
          src="/assets/images/denise_footer_img.png"
          alt="Denise from HR"
          width={320}
          height={410}
          className="block"
          style={{ objectFit: 'contain', objectPosition: 'bottom', marginTop: -170 }}
        />
      </div>
    </footer>
  );
}
