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
      style={{ margin: '0 4% 5rem' }}
    >
      {/* Row 1: Heading + Quote — stacks below xl */}
      <div className="flex flex-col items-stretch gap-8 border-b border-black/10 px-6 py-10 md:px-10 md:py-12 xl:flex-row xl:items-center xl:gap-12 xl:px-16 xl:py-14">
        <div className="shrink-0 xl:ml-[8%]">
          <h2
            className="leading-tight text-black"
            style={{ fontFamily: futura, fontWeight: 800, fontSize: 'clamp(2rem, 4.5vw, 5rem)' }}
          >
            What makes a good
          </h2>
          <h2
            className="leading-none text-black"
            style={{ fontFamily: futura, fontWeight: 800, fontSize: 'clamp(2.75rem, 7vw, 7.5rem)' }}
          >
            RESUME?
          </h2>
        </div>

        <p
          className="min-w-0 flex-1 text-left leading-relaxed text-black/75 xl:text-center"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400, fontSize: 'clamp(1rem, 1.4vw, 1.35rem)' }}
        >
          Recruiters spend about 7 seconds on a first pass. A good resume isn&rsquo;t the one
          that lists the most — it&rsquo;s the one that gets read in those 7 seconds and still
          holds up on the second look.
        </p>
      </div>

      {/* Row 2: Three pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {PILLARS.map((pillar, i) => (
          <div
            key={pillar.label}
            className={`flex flex-col items-center px-8 py-10 md:px-10 md:py-12 xl:px-14 ${
              i < 2 ? 'border-b border-black/10 lg:border-b-0 lg:border-r lg:border-black/10' : ''
            }`}
          >
            <div className="mb-4 flex h-16 items-center justify-center lg:border-b-0">
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
