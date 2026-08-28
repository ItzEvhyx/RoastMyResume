'use client';

import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import DragDropFeature from '@/rb_components/drag_drop_feature';
import AiAnalyzeFeature from '@/rb_components/ai_analyze_feature';

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
      <h2
        className="mb-6 text-center text-4xl leading-tight text-white"
        style={{ fontFamily: futuraStack, fontWeight: 800 }}
      >
        The resume feedback you actually need
      </h2>

      {/* Single-column stack of cards, phone-friendly */}
      <div className="flex flex-col gap-3">
        {/* Canvas snapshot placeholder */}
        <div className="grid aspect-square w-full place-items-center rounded-2xl bg-white">
          <span className="text-base font-semibold text-neutral-400">Snapshot of the canvas</span>
        </div>

        {/* Drag & drop animation */}
        <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-white">
          <DragDropFeature />
        </div>

        {/* Let AI analyze animation */}
        <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-white">
          <AiAnalyzeFeature />
        </div>

        {/* Apply changes placeholder */}
        <div className="grid aspect-[16/7] w-full place-items-center rounded-2xl bg-white">
          <span className="text-base font-semibold text-neutral-400">Apply changes</span>
        </div>

        {/* Tools snapshot placeholder */}
        <div className="grid aspect-[16/7] w-full place-items-center rounded-2xl bg-white">
          <span className="text-base font-semibold text-neutral-400">Tools snapshot</span>
        </div>

        {/* Export to pdf placeholder */}
        <div className="grid aspect-[16/7] w-full place-items-center rounded-2xl bg-white">
          <span className="text-base font-semibold text-neutral-400">Export to pdf</span>
        </div>
      </div>
    </section>
  );
}
