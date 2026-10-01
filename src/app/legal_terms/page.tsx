import Link from 'next/link';
import { Poppins, Source_Serif_4 } from 'next/font/google';
import type { Metadata } from 'next';
import GridGlowBackground from '@/rb_components/grid_glow_background';
import LegalArticle from '@/app/features/legal_terms/legal.article';
import {
  LEGAL_EFFECTIVE_DATE,
  legalDocumentFor,
} from '@/app/features/legal_terms/legal.documents';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-poppins',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-source-serif',
});

type LegalSearch = { doc?: string | string[] };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<LegalSearch>;
}): Promise<Metadata> {
  const params = await searchParams;
  const doc = legalDocumentFor(params.doc);
  return {
    title: `${doc.title} · Roast My Resume`,
    description: doc.kicker,
  };
}

export default async function LegalTermsPage({
  searchParams,
}: {
  searchParams: Promise<LegalSearch>;
}) {
  const params = await searchParams;
  const doc = legalDocumentFor(params.doc);

  return (
    <main
      className={`relative min-h-screen w-full bg-black ${poppins.variable} ${sourceSerif.variable}`}
    >
      <GridGlowBackground />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Link
            href="/"
            className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Back to homepage
          </Link>
          <nav
            aria-label="Legal documents"
            className="flex rounded-full bg-white/10 p-1"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            <Link
              href="/legal_terms?doc=privacy"
              aria-current={doc.id === 'privacy' ? 'page' : undefined}
              className={`rounded-full px-4 py-2 text-sm ${
                doc.id === 'privacy' ? 'bg-white font-semibold text-black' : 'text-white/75 hover:text-white'
              }`}
            >
              Privacy Policy
            </Link>
            <Link
              href="/legal_terms?doc=terms"
              aria-current={doc.id === 'terms' ? 'page' : undefined}
              className={`rounded-full px-4 py-2 text-sm ${
                doc.id === 'terms' ? 'bg-white font-semibold text-black' : 'text-white/75 hover:text-white'
              }`}
            >
              Terms of Service
            </Link>
          </nav>
        </div>

        <article
          className="rounded-[1.75rem] bg-white px-6 py-10 text-neutral-950 shadow-[0_24px_80px_rgba(255,255,255,0.08)] sm:px-10 sm:py-14 md:px-14"
          style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            RoastMyResume
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-neutral-950 sm:text-5xl">
            {doc.title}
          </h1>
          <p className="mt-3 text-sm text-neutral-500" style={{ fontFamily: 'var(--font-poppins)' }}>
            Effective {LEGAL_EFFECTIVE_DATE}
          </p>
          <p className="mt-6 text-[15px] leading-7 text-neutral-800">{doc.intro}</p>

          <nav
            aria-label="Contents"
            className="mt-8 border-y border-neutral-200 py-5"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Contents
            </p>
            <ol className="grid gap-1.5 sm:grid-cols-2">
              {doc.sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-sm text-neutral-700 underline-offset-2 hover:text-black hover:underline"
                  >
                    {index + 1}. {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-9">
            <LegalArticle doc={doc} />
          </div>
        </article>
      </div>
    </main>
  );
}
