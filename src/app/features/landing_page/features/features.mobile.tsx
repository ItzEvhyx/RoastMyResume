'use client';

import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import DragDropFeature from '@/rb_components/drag_drop_feature';
import AiAnalyzeFeature from '@/rb_components/ai_analyze_feature';
import ApplyChangesFeature from '@/rb_components/apply_changes_feature';
import ExportPdfFeature from '@/rb_components/export_pdf_feature';
import Reveal from '@/rb_components/reveal';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

const futuraStack = 'var(--font-futura-display), sans-serif';

export default function FeaturesMobile() {
  return (
    <section
      className={`relative z-10 flex flex-col px-5 py-14 ${poppins.variable} ${futuraDisplay.variable}`}
    >
      <Reveal
        as="h2"
        className="mb-6 text-center text-4xl leading-tight text-white"
        style={{ fontFamily: futuraStack, fontWeight: 800 }}
      >
        The resume feedback you actually need
      </Reveal>

      {/* Single-column stack of cards, phone-friendly */}
      <div className="flex flex-col gap-3">
        {/* Order: Canvas -> Tools snapshot -> Drag & drop -> AI analyze -> Apply changes -> Export to pdf */}

        {/* Canvas snapshot placeholder */}
        <Reveal className="grid aspect-square w-full place-items-center rounded-2xl bg-white">
          <span className="text-base font-semibold text-neutral-400">Snapshot of the canvas</span>
        </Reveal>

        {/* Tools snapshot placeholder */}
        <Reveal className="grid aspect-[16/7] w-full place-items-center rounded-2xl bg-white">
          <span className="text-base font-semibold text-neutral-400">Tools snapshot</span>
        </Reveal>

        {/* Drag & drop animation */}
        <Reveal className="aspect-[16/11] w-full overflow-hidden rounded-2xl bg-white">
          <DragDropFeature />
        </Reveal>

        {/* Let AI analyze animation */}
        <Reveal className="aspect-[16/11] w-full overflow-hidden rounded-2xl bg-white">
          <AiAnalyzeFeature />
        </Reveal>

        {/* Apply changes animation */}
        <Reveal className="aspect-[16/11] w-full overflow-hidden rounded-2xl bg-white">
          <ApplyChangesFeature />
        </Reveal>

        {/* Export to pdf animation */}
        <Reveal className="aspect-[16/11] w-full overflow-hidden rounded-2xl bg-white">
          <ExportPdfFeature />
        </Reveal>
      </div>
    </section>
  );
}
