'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { useApplyCanvasPayload } from '@/app/features/resume_templates/use.apply.template';
import { buildImportedCanvas } from './build.imported';
import {
  failResumeImport,
  resetResumeImport,
  useResumeImportState,
  type ResumeImportState,
} from './import.store';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
});

const MESSAGES = [
  'Reading your resume...',
  'Finding your sections...',
  'Pulling out your experience...',
  'Picking up your projects and skills...',
  'Matching your layout...',
  'Rebuilding it on the canvas...',
  'Almost there...',
];

const MESSAGE_MS = 2600;

/** Skeleton rows in page units: [top %, left %, width %, height px]. */
const SKELETON: [number, number, number, number][] = [
  [5, 35, 30, 22],
  [8.6, 25, 50, 12],
  [10.8, 20, 60, 9],
  [12.4, 24, 52, 9],
  [16.5, 6, 26, 12],
  [18.6, 6, 88, 2],
  [20.2, 6, 88, 9],
  [21.8, 6, 88, 9],
  [23.4, 6, 70, 9],
  [28, 6, 20, 12],
  [30.1, 6, 88, 2],
  [32, 6, 46, 11],
  [32, 74, 20, 11],
  [34, 6, 86, 9],
  [35.6, 10, 80, 9],
  [37.2, 10, 76, 9],
  [38.8, 10, 82, 9],
  [42.6, 6, 50, 11],
  [42.6, 70, 24, 11],
  [44.6, 6, 86, 9],
  [46.2, 10, 78, 9],
  [47.8, 10, 72, 9],
  [52.4, 6, 44, 11],
  [52.4, 76, 18, 11],
  [54.4, 6, 84, 9],
  [56, 10, 80, 9],
  [57.6, 10, 66, 9],
  [62.5, 6, 24, 12],
  [62.5, 53, 20, 12],
  [64.6, 6, 41, 2],
  [64.6, 53, 41, 2],
  [66.4, 6, 38, 9],
  [66.4, 53, 32, 9],
  [68, 6, 36, 9],
  [68, 53, 28, 9],
  [69.6, 6, 40, 9],
  [69.6, 53, 36, 9],
  [71.2, 6, 30, 9],
  [71.2, 53, 26, 9],
  [72.8, 6, 34, 9],
];

const KEYFRAMES = `
@keyframes rmr-import-shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
@keyframes rmr-import-msg { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes rmr-import-pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
@keyframes rmr-import-in { from { opacity: 0; } to { opacity: 1; } }
`;

function RotatingMessage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => Math.min(i + 1, MESSAGES.length - 1));
    }, MESSAGE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-7 w-[380px] overflow-hidden text-center">
      <span
        key={index}
        className="absolute inset-0 text-[17px] font-bold text-white"
        style={{ animation: 'rmr-import-msg 0.35s ease-out both' }}
      >
        {MESSAGES[index]}
      </span>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="flex max-w-[400px] flex-col items-center gap-4 text-center">
      <p className="text-[16px] font-bold text-white">
        We couldn&apos;t import that resume
      </p>
      <p className="text-[13px] text-white/60">{message}</p>
      <div className="flex gap-3">
        <Link
          href="/templates"
          onClick={resetResumeImport}
          className="rounded-lg border border-white/30 px-4 py-2 text-[13px] font-bold text-white no-underline hover:bg-white/10"
        >
          Back to templates
        </Link>
        <button
          type="button"
          onClick={resetResumeImport}
          className="rounded-lg bg-white px-4 py-2 text-[13px] font-bold text-black hover:bg-white/90"
        >
          Start blank
        </button>
      </div>
    </div>
  );
}

/**
 * Shimmer skeleton + rotating status over the page while an import runs,
 * and rebuilds the finished result onto the live canvas.
 */
export default function ResumeImportOverlay() {
  const state = useResumeImportState();
  const visible = state.status !== 'idle';
  const applyPayload = useApplyCanvasPayload();

  useEffect(() => {
    if (state.status !== 'ready') return;
    try {
      const { payload } = buildImportedCanvas(state.resume);
      applyPayload(payload, 'imported');
      resetResumeImport();
    } catch (err) {
      console.error('[resume-import] rebuild failed', err);
      failResumeImport('We read your resume but could not rebuild it on the canvas. Please try again.');
    }
  }, [state, applyPayload]);

  // Keep the last non-idle state so the overlay can fade out with its content.
  const [shown, setShown] = useState<ResumeImportState>(state);
  if (visible && shown !== state) setShown(state);

  if (shown.status === 'idle') return null;
  const reading = shown.status === 'reading' || shown.status === 'ready';

  return (
    <div
      data-no-export="true"
      aria-live="polite"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 310000,
        overflow: 'hidden',
        background: '#ffffff',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.35s ease',
        // `backwards`, not `both`: a held end frame would override the fade-out opacity.
        animation: 'rmr-import-in 0.3s ease backwards',
      }}
      onPointerDown={(e) => {
        if (visible) e.stopPropagation();
      }}
      onTransitionEnd={(e) => {
        if (!visible && e.target === e.currentTarget) setShown({ status: 'idle' });
      }}
    >
      <style>{KEYFRAMES}</style>

      {SKELETON.map(([top, left, width, height], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${top}%`,
            left: `${left}%`,
            width: `${width}%`,
            height,
            borderRadius: height > 4 ? 4 : 1,
            background: '#e9ebef',
          }}
        />
      ))}

      {reading && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.85) 50%, transparent 80%)',
            animation: 'rmr-import-shimmer 1.6s ease-in-out infinite',
          }}
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`${poppins.className} flex flex-col items-center gap-3 rounded-2xl px-8 py-6 shadow-2xl`}
          style={{
            background: 'rgba(14,16,21,0.88)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          {reading ? (
            <>
              <span
                aria-hidden
                className="block h-2 w-2 rounded-full bg-white"
                style={{ animation: 'rmr-import-pulse 1.2s ease-in-out infinite' }}
              />
              <RotatingMessage />
              {shown.status === 'reading' && (
                <span className="max-w-[380px] truncate text-[12px] text-white/50">
                  {shown.fileName}
                </span>
              )}
            </>
          ) : (
            <ErrorCard message={shown.status === 'error' ? shown.error : ''} />
          )}
        </div>
      </div>
    </div>
  );
}
