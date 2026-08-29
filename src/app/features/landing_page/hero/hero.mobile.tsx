'use client';

import { Poppins, VT323 } from 'next/font/google';
import localFont from 'next/font/local';
import ResumeCardStack from '@/rb_components/resume_card_stack';
import RadialGlowButton from '@/components/ui/radial_glow_button';
import SpecularButton from '@/components/specular_button';
import Reveal from '@/rb_components/reveal';
import { scrollToSection } from '@/rb_components/section_scroll';
import { openDeniseModal } from '@/rb_components/denise_modal_store';

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

const futuraStack = 'var(--font-futura-display), sans-serif';

export default function HeroMobile() {
  return (
    <section
      className={`relative z-10 flex flex-col items-center gap-8 px-5 pb-16 pt-20 text-center ${poppins.variable} ${vt323.variable} ${futuraDisplay.variable}`}
    >
      {/* Card stack — smaller so it fits a phone width. The stack reserves
          space to its right for the offset cards, so nudge it right by half
          that reserve (|offsetX| * visible / 2 = 26px) to visually center the
          front card on screen. */}
      <Reveal className="flex justify-center">
        <ResumeCardStack
          items={RESUME_TEMPLATES}
          cardWidth={220}
          className="translate-x-[26px]"
        />
      </Reveal>

      {/* Eyebrow */}
      <Reveal
        as="p"
        delay={80}
        className="text-sm italic text-white/60"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
      >
        - Resume Builder + AI Feedback
      </Reveal>

      {/* Headline */}
      <Reveal
        as="h1"
        delay={160}
        className="flex flex-col items-center gap-1 text-5xl leading-[0.95] text-white"
        style={{ fontFamily: futuraStack, fontWeight: 800 }}
      >
        <span>Build it clean.</span>
        <span className="inline-flex flex-wrap items-center justify-center gap-3">
          <span className="italic text-white/70" style={{ fontWeight: 400 }}>
            Get it
          </span>
          <span
            className="inline-block -rotate-2 rounded-md bg-white px-4 py-1 text-black"
            style={{ fontFamily: futuraStack, fontWeight: 800 }}
          >
            ROASTED
          </span>
        </span>
      </Reveal>

      {/* Body copy */}
      <Reveal
        as="p"
        delay={240}
        className="max-w-md text-base leading-relaxed text-white/70"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 300 }}
      >
        Design your resume on an open canvas, then hand it to the AI. Ask for
        the honest version or the brutal one — either way, you&apos;ll know
        exactly what to fix before a recruiter does.
      </Reveal>

      {/* Buttons — stacked full width on phones */}
      <Reveal delay={320} className="flex w-full max-w-xs flex-col items-stretch gap-3">
        <RadialGlowButton
          onClick={openDeniseModal}
          className="!min-h-0 !min-w-0 w-full px-8 py-3.5 !text-base"
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
          size="md"
          tint="#0b0d12"
          tintOpacity={1}
          textColor="#f5f5f5"
          className="w-full"
          onClick={() => scrollToSection('sample')}
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
        >
          See Sample &gt;
        </SpecularButton>
      </Reveal>

      {/* Stat line */}
      <Reveal
        delay={400}
        className="flex flex-col items-center gap-1"
        style={{ fontFamily: 'var(--font-vt323)' }}
      >
        <span className="text-4xl text-white">40,301</span>
        <span className="text-xs uppercase tracking-widest text-white/60">
          Resumes reviewed and roasted
        </span>
      </Reveal>
    </section>
  );
}
