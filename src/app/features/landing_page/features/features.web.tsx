'use client';

import Image from 'next/image';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import DragDropFeature from '@/rb_components/drag_drop_feature';
import AiAnalyzeFeature from '@/rb_components/ai_analyze_feature';
import ApplyChangesFeature from '@/rb_components/apply_changes_feature';
import ExportPdfFeature from '@/rb_components/export_pdf_feature';
import ToolsSnapshotFeature from '@/rb_components/tools_snapshot_feature';

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

export default function Features() {
  return (
    <section
      className={`relative z-10 mx-auto w-full max-w-7xl px-6 ${poppins.variable} ${futuraDisplay.variable}`}
    >
      <h2
        className="mb-4 text-center text-4xl leading-none text-white md:mb-6 md:text-5xl xl:text-6xl"
        style={{ fontFamily: futuraStack, fontWeight: 800 }}
      >
        The resume feedback you actually need
      </h2>

      {/*
        Auto-placed by CSS grid (2 cols x 4 rows):
        1. left-big    -> col 1, rows 1–3
        2. right-1     -> col 2, row 1
        3. right-2     -> col 2, row 2
        4. right-3     -> col 2, row 3
        5. left-bottom -> col 1, row 4 (only free cell left in col 1)
        6. right-4     -> col 2, row 4
        Order of the divs below drives this — don't reorder them.
      */}
      <div className="grid h-[min(640px,calc(100vh-8rem))] grid-cols-1 grid-rows-[repeat(6,1fr)] gap-3 md:h-[min(760px,calc(100vh-8rem))] md:grid-cols-2 md:grid-rows-4 md:gap-4">
        {/* left-big — canvas snapshot */}
        <div className="relative row-span-1 overflow-hidden rounded-2xl border border-white/80 bg-white md:row-span-3">
          <Image
            src="/assets/images/canvas_snapshot.png"
            alt="Resume canvas editor snapshot"
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            draggable={false}
          />
        </div>

        {/* right-1 — Drag & drop animation */}
        <div className="overflow-hidden rounded-2xl bg-white">
          <DragDropFeature />
        </div>

        {/* right-2 — Let AI analyze animation */}
        <div className="overflow-hidden rounded-2xl bg-white">
          <AiAnalyzeFeature />
        </div>

        {/* right-3 — Apply changes animation */}
        <div className="overflow-hidden rounded-2xl bg-white">
          <ApplyChangesFeature />
        </div>

        {/* left-bottom — tools snapshot */}
        <div className="overflow-hidden rounded-2xl bg-white">
          <ToolsSnapshotFeature />
        </div>

        {/* right-4 — Export to pdf animation */}
        <div className="overflow-hidden rounded-2xl bg-white">
          <ExportPdfFeature />
        </div>
      </div>
    </section>
  );
}
