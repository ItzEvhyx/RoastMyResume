'use client';

import Image from 'next/image';
import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

const futura = 'var(--font-futura-display), sans-serif';

const PILLARS = [
  {
    label: 'Clarity',
    icon: '/assets/icons/clarity_icon.svg',
    body: "No jargon, no walls of text. If a stranger can't tell what you actually did in one read, neither can the recruiter.",
  },
  {
    label: 'Specificity',
    icon: '/assets/icons/specificity_icon.svg',
    body: '"Improved performance" says nothing. "Cut load time by 40%" says everything. Numbers and outcomes beat vague responsibilities every time.',
  },
  {
    label: 'Relevance',
    icon: '/assets/icons/relevance_icon.svg',
    body: "Not everything you've ever done belongs on every resume. The best ones are edited for the job, not just copy-pasted from the last application.",
  },
];

export default function TriviaMobile() {
  return (
    <section
      className={`relative z-10 mx-3 mb-16 overflow-hidden rounded-3xl bg-white ${poppins.variable} ${futuraDisplay.variable}`}
    >
      {/* Heading + quote */}
      <div className="border-b border-black/10 px-6 py-7">
        <h2
          className="leading-tight text-black"
          style={{ fontFamily: futura, fontWeight: 800, fontSize: 'clamp(1.6rem, 7vw, 2.2rem)' }}
        >
          What makes a good
        </h2>
        <h2
          className="leading-none text-black"
          style={{ fontFamily: futura, fontWeight: 800, fontSize: 'clamp(2.4rem, 10vw, 3.5rem)' }}
        >
          RESUME?
        </h2>
        <p
          className="mt-4 text-sm leading-relaxed text-black/70"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400, textAlign: 'center' }}
        >
          Recruiters spend about 7 seconds on a first pass. A good resume isn&rsquo;t the one
          that lists the most — it&rsquo;s the one that gets read in those 7 seconds and still
          holds up on the second look.
        </p>
      </div>

      {/* Pillars — stacked */}
      <div className="flex flex-col">
        {PILLARS.map((pillar, i) => (
          <div
            key={pillar.label}
            className="flex flex-col items-center px-6 py-7"
            style={{ borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.1)' : 'none' }}
          >
            <div className="mb-2 flex h-12 items-center justify-center">
              <Image src={pillar.icon} alt={pillar.label} width={44} height={44} />
            </div>
            <p
              className="mb-2 text-lg text-black"
              style={{ fontFamily: futura, fontWeight: 800 }}
            >
              {pillar.label}
            </p>
            <p
              className="text-sm leading-relaxed text-black/65"
              style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400, textAlign: 'justify' }}
            >
              {pillar.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
