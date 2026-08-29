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
    a: 'No. You can browse, pick, and start building without creating an account. An account is only needed to save your work.',
  },
  {
    q: 'Can I use these templates for any industry?',
    a: 'Yes. Templates range from ATS-friendly single-column formats for technical roles to expressive layouts for creative fields.',
  },
  {
    q: 'What does the AI feedback actually do?',
    a: 'It reads your resume like a recruiter — flagging weak bullet points, vague language, missing metrics, and sections likely to get skipped.',
  },
  {
    q: 'Is my resume data stored on your servers?',
    a: 'No. Everything stays in your browser unless you explicitly save it to an account.',
  },
  {
    q: 'Can I upload my existing resume?',
    a: 'Yes. Use "Upload Yours" to bring in a PDF or document. The AI will review it without requiring you to rebuild anything.',
  },
  {
    q: 'Can I export my resume as a PDF?',
    a: 'Yes — clean PDF export with no watermarks or forced branding.',
  },
  {
    q: 'Are the templates ATS-compatible?',
    a: 'The ATS and General templates are designed to pass applicant tracking systems. Creative templates prioritise visual impact over ATS compatibility.',
  },
  {
    q: 'How is this different from other resume builders?',
    a: 'Most builders help you format. This one also tells you when your content is weak — honestly, with no paywall.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span
          className="text-sm font-semibold text-white"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          {q}
        </span>
        <span className="shrink-0 text-white/50">
          {open ? <Minus size={16} /> : <Plus size={16} />}
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: open ? 320 : 0 }}
      >
        <p
          className="pb-5 text-sm leading-relaxed text-white/55"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
        >
          {a}
        </p>
      </div>
    </div>
  );
}

export default function FAQMobile() {
  return (
    <section
      className={`relative z-10 mb-20 w-full px-5 ${poppins.variable} ${futuraDisplay.variable}`}
    >
      <h2
        className="mb-8 text-center text-4xl leading-none text-white"
        style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
      >
        FAQ
      </h2>
      <div>
        {FAQS.map((item, i) => (
          <FAQItem key={i} q={item.q} a={item.a} />
        ))}
      </div>
    </section>
  );
}
