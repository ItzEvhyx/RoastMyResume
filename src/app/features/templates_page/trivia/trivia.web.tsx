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

export default function TriviaWeb() {
  return (
    <section
      className={`relative z-10 mb-20 overflow-hidden rounded-3xl bg-white ${poppins.variable} ${futuraDisplay.variable}`}
      style={{ margin: '0 6% 5rem' }}
    >
      {/* Row 1: Heading right-of-center + Quote */}
      <div className="flex items-center gap-12 border-b border-black/10 px-16 py-14">
        {/* Left — pushed toward center with auto left margin */}
        <div className="shrink-0" style={{ marginLeft: '8%' }}>
          <h2
            className="leading-tight text-black"
            style={{ fontFamily: futura, fontWeight: 800, fontSize: 'clamp(2.8rem, 4.5vw, 5rem)' }}
          >
            What makes a good
          </h2>
          <h2
            className="leading-none text-black"
            style={{ fontFamily: futura, fontWeight: 800, fontSize: 'clamp(4rem, 7vw, 7.5rem)' }}
          >
            RESUME?
          </h2>
        </div>

        {/* Right — centered quote */}
        <p
          className="flex-1 text-center leading-relaxed text-black/75"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400, fontSize: 'clamp(1rem, 1.4vw, 1.35rem)' }}
        >
          Recruiters spend about 7 seconds on a first pass. A good resume isn&rsquo;t the one
          that lists the most — it&rsquo;s the one that gets read in those 7 seconds and still
          holds up on the second look.
        </p>
      </div>

      {/* Row 2: Three pillars */}
      <div className="grid grid-cols-3">
        {PILLARS.map((pillar, i) => (
          <div
            key={pillar.label}
            className="flex flex-col items-center px-14 py-12"
            style={{ borderRight: i < 2 ? '1px solid rgba(0,0,0,0.12)' : 'none' }}
          >
            <div className="mb-4 flex h-16 items-center justify-center">
              <Image src={pillar.icon} alt={pillar.label} width={64} height={64} />
            </div>
            <p
              className="mb-4 text-2xl tracking-widest text-black"
              style={{ fontFamily: futura, fontWeight: 800 }}
            >
              {pillar.label}
            </p>
            <p
              className="leading-relaxed text-black/65"
              style={{
                fontFamily: 'var(--font-poppins)',
                fontWeight: 400,
                textAlign: 'justify',
                fontSize: 'clamp(0.9rem, 1.1vw, 1.1rem)',
              }}
            >
              {pillar.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
