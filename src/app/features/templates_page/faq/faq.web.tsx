'use client';

import { useState } from 'react';
import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';
import { Plus, Minus } from 'lucide-react';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

const FAQS = [
  {
    q: 'Do I need an account to use the templates?',
    a: 'No. You can browse, pick, and start building a resume from any template without creating an account. An account is only needed if you want to save your work and come back to it later.',
  },
  {
    q: 'Can I use these templates for any industry?',
    a: 'Yes. The templates cover a range of layouts — from ATS-friendly single-column formats for technical roles to more expressive designs for creative fields. Pick the one that matches the tone of the job you\'re applying for.',
  },
  {
    q: 'What does the AI feedback actually do?',
    a: 'After you build a resume, the AI reads it like a recruiter would. It flags weak bullet points, vague language, missing metrics, and sections that are likely to get skipped — then tells you exactly what to fix.',
  },
  {
    q: 'Is my resume data stored on your servers?',
    a: 'No. Everything you build stays in your browser. Nothing is sent to or stored on our servers unless you explicitly save it to an account.',
  },
  {
    q: 'How is this different from other resume builders?',
    a: 'Most resume builders help you format. This one also tells you when your content is weak. The design canvas is open-ended, the feedback is honest, and nothing is hidden behind a paywall.',
  },
  {
    q: 'Can I export my resume as a PDF?',
    a: 'Yes. Once you\'re done building, you can export a clean PDF directly from the editor — no watermarks, no forced branding.',
  },
  {
    q: 'Are the templates ATS-compatible?',
    a: 'ATS Friendly templates are single-column with plain text and dividers so applicant tracking systems can parse them cleanly. Business, Tech, and Generic layouts can use sidebars, shapes, and icons for a stronger visual impression — pick based on your target role.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border-b border-white/10 transition-colors duration-150 hover:border-white/20"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span
          className="text-base font-semibold text-white md:text-lg"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          {q}
        </span>
        <span className="shrink-0 text-white/50 transition-transform duration-200">
          {open ? <Minus size={18} /> : <Plus size={18} />}
        </span>
      </button>

      {/* Answer — animates height via max-height trick */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: open ? 400 : 0 }}
      >
        <p
          className="pb-6 text-sm leading-relaxed text-white/55 md:text-base"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
        >
          {a}
        </p>
      </div>
    </div>
  );
}

export default function FAQWeb() {
  return (
    <section
      className={`relative z-10 mx-auto mb-24 w-full max-w-3xl px-8 ${poppins.variable} ${futuraDisplay.variable}`}
    >
      {/* Heading */}
      <h2
        className="mb-10 text-center text-5xl leading-none text-white md:text-6xl"
        style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
      >
        FAQ
      </h2>

      {/* Items */}
      <div>
        {FAQS.map((item, i) => (
          <FAQItem key={i} q={item.q} a={item.a} />
        ))}
      </div>
    </section>
  );
}
