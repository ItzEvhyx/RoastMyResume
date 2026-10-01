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

export default function FooterMobile() {
  return (
    <footer
      className={`relative z-10 w-full overflow-visible bg-white ${poppins.variable} ${futuraDisplay.variable}`}
      style={{ borderRadius: '1.75rem 1.75rem 0 0', height: 220 }}
    >
      {/* Left-aligned content */}
      <div className="absolute bottom-0 left-0 z-10 flex flex-col px-6 pb-5 pt-5">

        {/* Wordmark */}
        <div className="mb-2 flex items-center gap-2">
          <Image src="/assets/logos/rmr_logo.png" alt="RoastMyResume" width={28} height={28} className="h-6 w-auto" />
          <span
            className="text-2xl leading-none text-black"
            style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
          >
            Roast<span className="text-black/35">My</span>Resume
          </span>
        </div>

        {/* Tagline */}
        <p className="mb-3 text-xs leading-snug text-black/50 max-w-[200px]"
          style={{ fontFamily: 'var(--font-poppins)' }}>
          Build it clean. Get it roasted. Know exactly what to fix before a recruiter does.
        </p>

        {/* Nav — row 1: Templates + Build */}
        <div className="flex gap-5 mb-1">
          {['Templates', 'Build'].map(label => (
            <a key={label} href="#"
              className="text-xs font-semibold text-black/60 hover:text-black transition-colors"
              style={{ fontFamily: 'var(--font-poppins)' }}>
              {label}
            </a>
          ))}
        </div>

        {/* Nav — row 2: Review + Export PDF */}
        <div className="flex gap-5 mb-3">
          {['Review', 'Export PDF'].map(label => (
            <a key={label} href="#"
              className="text-xs font-semibold text-black/60 hover:text-black transition-colors"
              style={{ fontFamily: 'var(--font-poppins)' }}>
              {label}
            </a>
          ))}
        </div>

        {/* Divider */}
        <div className="mb-2 h-px w-[200px] bg-black/10" />

        {/* Legal — all on one line */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] text-black/35" style={{ fontFamily: 'var(--font-poppins)' }}>
            © {new Date().getFullYear()} RoastMyResume.
          </span>
          <a href="/legal_terms?doc=privacy" className="text-[10px] text-black/35 hover:text-black/60 transition-colors"
            style={{ fontFamily: 'var(--font-poppins)' }}>Privacy Policy</a>
          <a href="/legal_terms?doc=terms" className="text-[10px] text-black/35 hover:text-black/60 transition-colors"
            style={{ fontFamily: 'var(--font-poppins)' }}>Terms of Service</a>
        </div>
      </div>

      {/* Denise — above the banner so she isn’t cropped by the white panel */}
      <div className="pointer-events-none absolute bottom-0 z-20 overflow-visible" style={{ right: '1%' }}>
        <Image
          src="/assets/images/denise_footer_img.png"
          alt="Denise from HR"
          width={175}
          height={205}
          className="relative z-20 block"
          style={{ objectFit: 'contain', objectPosition: 'bottom' }}
        />
      </div>
    </footer>
  );
}
