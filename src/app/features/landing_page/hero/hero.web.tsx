// src/app/features/landing_page/hero.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Poppins, VT323 } from 'next/font/google';
import localFont from 'next/font/local';
import ResumeCardStack from '@/rb_components/resume_card_stack';
import RadialGlowButton from '@/components/ui/radial_glow_button';
import SpecularButton from '@/components/specular_button';
import { scrollToSection } from '@/rb_components/section_scroll';
import { openDeniseModal } from '@/rb_components/denise_modal_store';
import LogoBanner from '@/app/features/landing_page/logo.banner';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-poppins',
});

const vt323 = VT323({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-vt323',
});

// Futura Display — loaded from the local .ttf file.
const futuraDisplay = localFont({
  src: '../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

const RESUME_TEMPLATES = [
  { image: '/assets/resume_templates/ats_template.png', alt: 'ATS resume template' },
  { image: '/assets/resume_templates/business_template.png', alt: 'Business resume template' },
  { image: '/assets/resume_templates/creatives_template.png', alt: 'Creatives resume template' },
  { image: '/assets/resume_templates/general_template.png', alt: 'General resume template' },
  { image: '/assets/resume_templates/personal_branding_template.png', alt: 'Personal branding resume template' },
];

// Real Futura Display font, loaded locally above.
const futuraStack = 'var(--font-futura-display), sans-serif';

/** Matches clamp(280px, 28vw, 460px), also capped by viewport height so short laptops fit. */
function useHeroCardWidth(): number {
  const [width, setWidth] = useState(460);

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const byWidth = Math.min(460, Math.max(280, vw * 0.28));
      // A4 height ≈ width * 1.414; leave room for logo banner + padding.
      const byHeight = Math.max(240, (vh - 200) / 1.414);
      setWidth(Math.round(Math.min(byWidth, byHeight, 460)));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return width;
}

export default function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardWidth = useHeroCardWidth();

  return (
    <div
      ref={rootRef}
      className={`relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center gap-8 px-6 pb-12 pt-28 md:flex-row md:items-center md:justify-start md:gap-8 md:pb-16 md:pt-32 xl:gap-10 xl:py-16 xl:pt-36 ${poppins.variable} ${vt323.variable} ${futuraDisplay.variable}`}
    >
      {/* Fixed wordmark, portaled to the viewport. Visible only while this hero
          root is in view — it fades out once the track pans to another section. */}
      <LogoBanner watchRef={rootRef} />

      {/* Left — stacked resume templates */}
      <div className="flex shrink-0 justify-center md:justify-start">
        <ResumeCardStack items={RESUME_TEMPLATES} cardWidth={cardWidth} />
      </div>

      {/* Right — landing copy */}
      <div className="flex min-w-0 w-full flex-col items-center text-center md:w-auto md:items-start md:text-left xl:-ml-12">

        {/* Eyebrow */}
        <p
          className="mb-3 text-base italic text-white/60 md:text-lg xl:text-xl"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
        >
          - Resume Builder + AI Feedback
        </p>

        {/* Headline */}
        <h1
          className="mb-5 flex flex-col gap-1 text-5xl leading-[0.95] text-white md:text-6xl lg:text-7xl xl:text-8xl"
          style={{ fontFamily: futuraStack, fontWeight: 800 }}
        >
          <span>Build it clean.</span>
          <span className="inline-flex flex-wrap items-center gap-3 xl:gap-4">
            <span className="italic text-white/70" style={{ fontWeight: 400 }}>
              Get it
            </span>
            <span
              className="inline-block -rotate-2 rounded-md bg-white px-4 py-1 text-black md:px-5 xl:px-6"
              style={{ fontFamily: futuraStack, fontWeight: 800 }}
            >
              ROASTED
            </span>
          </span>
        </h1>

        {/* Body copy */}
        <p
          className="mb-8 max-w-xl text-base leading-relaxed text-white/70 md:mb-10 md:text-xl xl:text-2xl"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 300 }}
        >
          Design your resume on an open canvas, then hand it to the AI. Ask for
          the honest version or the brutal one — either way, you&apos;ll know
          exactly what to fix before a recruiter does.
        </p>

        {/* Buttons */}
        <div className="mb-6 flex flex-wrap items-center gap-4 xl:gap-6">
          <RadialGlowButton
            onClick={openDeniseModal}
            className="!min-h-0 !min-w-0 px-9 py-4 !text-lg transition-transform hover:-translate-y-0.5"
            style={{
              fontFamily: 'var(--font-poppins)',
              fontWeight: 600,
              borderRadius: 9999,
            }}
          >
            Get started &gt;
          </RadialGlowButton>
          <SpecularButton
            radius={999}
            size="lg"
            tint="#0b0d12"
            tintOpacity={1}
            textColor="#f5f5f5"
            onClick={() => scrollToSection('sample')}
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
          >
            See Sample &gt;
          </SpecularButton>
        </div>

        {/* Stat line */}
        <div className="flex items-baseline gap-3 xl:gap-4" style={{ fontFamily: 'var(--font-vt323)' }}>
          <span className="text-4xl text-white md:text-5xl xl:text-6xl">40,301</span>
          <span className="text-sm uppercase tracking-widest text-white/60 md:text-base xl:text-lg">
            Resumes reviewed and roasted
          </span>
        </div>

      </div>
    </div>
  );
}
