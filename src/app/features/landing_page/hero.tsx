// src/app/features/landing_page/hero.tsx
'use client';

import { Poppins, VT323 } from 'next/font/google';
import localFont from 'next/font/local';
import ResumeCardStack from '@/rb_components/resume_card_stack';
import RadialGlowButton from '@/components/ui/radial_glow_button';
import SpecularButton from '@/components/specular_button';

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
  src: '../../../../public/assets/fonts/futura_display/Futura Display.ttf',
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

export default function Hero() {
  return (
    <div
      className={`relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center gap-12 px-6 py-16 md:flex-row md:items-center md:justify-start md:gap-10 ${poppins.variable} ${vt323.variable} ${futuraDisplay.variable}`}
    >
      {/* Left — stacked resume templates */}
      <div className="flex shrink-0 justify-center md:justify-start">
        <ResumeCardStack items={RESUME_TEMPLATES} cardWidth={460} />
      </div>

      {/* Right — landing copy */}
      <div className="flex w-full flex-col items-center text-center md:-ml-12 md:w-auto md:items-start md:text-left">

        {/* Eyebrow */}
        <p
          className="mb-3 text-lg italic text-white/60 md:text-xl"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
        >
          - Resume Builder + AI Feedback
        </p>

        {/* Headline */}
        <h1
          className="mb-5 flex flex-col gap-1 text-6xl leading-[0.95] text-white md:text-8xl"
          style={{ fontFamily: futuraStack, fontWeight: 800 }}
        >
          <span>Build it clean.</span>
          <span className="inline-flex flex-wrap items-center gap-4">
            <span className="italic text-white/70" style={{ fontWeight: 400 }}>
              Get it
            </span>
            <span
              className="inline-block -rotate-2 rounded-md bg-white px-6 py-1 text-black"
              style={{ fontFamily: futuraStack, fontWeight: 800 }}
            >
              ROASTED
            </span>
          </span>
        </h1>

        {/* Body copy */}
        <p
          className="mb-10 max-w-xl text-lg leading-relaxed text-white/70 md:text-2xl"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 300 }}
        >
          Design your resume on an open canvas, then hand it to the AI. Ask for
          the honest version or the brutal one — either way, you&apos;ll know
          exactly what to fix before a recruiter does.
        </p>

        {/* Buttons */}
        <div className="mb-6 flex flex-wrap items-center gap-6">
          <RadialGlowButton
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
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
          >
            See Sample &gt;
          </SpecularButton>
        </div>

        {/* Stat line */}
        <div className="flex items-baseline gap-4" style={{ fontFamily: 'var(--font-vt323)' }}>
          <span className="text-5xl text-white md:text-6xl">40,301</span>
          <span className="text-base uppercase tracking-widest text-white/60 md:text-lg">
            Resumes reviewed and roasted
          </span>
        </div>

      </div>
    </div>
  );
}