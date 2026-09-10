'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import { AnimatePresence, motion } from 'framer-motion';
import { Lottie } from 'lottie-react';
import AtsCheckResults from './ats.check.results';
import { useCanvasSnapshot } from '../../hooks/use.canvas.snapshot';
import { useDeniseAnalysis } from '../../context/DeniseAnalysisContext';
import type { AtsCheckResult, AtsFactorId } from '@/app/core/services/claude';
import scanningAtsAnimation from '../../../../../../public/assets/videos/lottie_animations/scanning_ats.json';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

const STATUS_LINES = [
  'Checking each section for ATS risks…',
  'Reading your layout the way software would…',
  'Scoring columns, fonts, and contact parsing…',
  'Almost done — wrapping up your ATS score…',
];

const IDLE_FACTORS: { id: AtsFactorId; label: string; icon: string; alt: string }[] = [
  {
    id: 'column_layout',
    label: 'Column layout & structure',
    icon: '/assets/icons/layout_icon.png',
    alt: 'Layout',
  },
  {
    id: 'tables_graphics',
    label: 'Tables & graphics',
    icon: '/assets/icons/table_icon.png',
    alt: 'Table',
  },
  {
    id: 'fonts_embedded_text',
    label: 'Fonts & embedded text',
    icon: '/assets/icons/font_icon.png',
    alt: 'Font',
  },
  {
    id: 'file_format',
    label: 'File format compatibility',
    icon: '/assets/icons/file_format_icon.png',
    alt: 'File Format',
  },
  {
    id: 'contact_info',
    label: 'Contact info parsing',
    icon: '/assets/icons/profile_icon.svg',
    alt: 'Profile',
  },
];

type Phase = 'idle' | 'analyzing' | 'results';

export default function ATSCheck() {
  const canvasSnapshot = useCanvasSnapshot();
  const { beginScan, completeScan } = useDeniseAnalysis();

  const [phase, setPhase] = useState<Phase>('idle');
  const [statusIndex, setStatusIndex] = useState(0);
  const [result, setResult] = useState<AtsCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== 'analyzing') return;
    setStatusIndex(0);
    const id = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_LINES.length);
    }, 2800);
    return () => clearInterval(id);
  }, [phase]);

  const resetAll = useCallback(() => {
    completeScan();
    setPhase('idle');
    setResult(null);
    setError(null);
  }, [completeScan]);

  const handleRun = useCallback(async () => {
    if (phase !== 'idle') return;

    setError(null);
    setPhase('analyzing');
    beginScan({ clearFixes: false });

    try {
      const res = await fetch('/api/ats-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasSnapshot }),
      });
      const data = (await res.json().catch(() => ({}))) as AtsCheckResult & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'ATS check failed.');
      }
      setResult(data);
      setPhase('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ATS check failed.');
      setPhase('idle');
    } finally {
      completeScan();
    }
  }, [phase, canvasSnapshot, beginScan, completeScan]);

  return (
    <div
      className={`flex h-full min-h-0 flex-col p-6 ${poppins.variable} ${futuraDisplay.variable}`}
    >
      <div className="mb-4 flex-shrink-0">
        <div className="mb-4 flex items-center gap-3">
          <Image
            src="/assets/icons/check_icon.png"
            alt="Check"
            width={32}
            height={32}
            className="opacity-90"
          />
          <h1
            className="leading-tight text-white"
            style={{
              fontFamily: 'var(--font-futura-display)',
              fontWeight: 800,
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            }}
          >
            ATS Check
          </h1>
        </div>
        <p
          className="text-left leading-relaxed text-white/70"
          style={{
            fontFamily: 'var(--font-poppins)',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          Recruiters often never see your resume first but software does. Here&apos;s
          whether it can actually read yours.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div
              key="idle"
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
                {IDLE_FACTORS.map((factor, index) => (
                  <div
                    key={factor.id}
                    className={
                      index === IDLE_FACTORS.length - 1
                        ? 'pb-2'
                        : 'border-b border-white/10 pb-5'
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center">
                        <Image
                          src={factor.icon}
                          alt={factor.alt}
                          width={24}
                          height={24}
                          className="opacity-70"
                        />
                      </div>
                      <span
                        className="text-white/80"
                        style={{
                          fontFamily: 'var(--font-poppins)',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                        }}
                      >
                        {factor.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex-shrink-0 space-y-4 border-t border-white/10 pt-4">
                {error && (
                  <p
                    className="text-xs text-red-300/90"
                    style={{ fontFamily: 'var(--font-poppins)', fontWeight: 500 }}
                  >
                    {error}
                  </p>
                )}
                <p
                  className="text-white/50"
                  style={{
                    fontFamily: 'var(--font-poppins)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Never checked
                </p>
                <button
                  type="button"
                  onClick={() => void handleRun()}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-black transition-all hover:bg-white/90 active:scale-95"
                  style={{
                    fontFamily: 'var(--font-poppins)',
                    fontWeight: 700,
                  }}
                >
                  <span className="text-base">Run ATS Check</span>
                  <Image
                    src="/assets/icons/scan_icon.png"
                    alt="Scan"
                    width={20}
                    height={20}
                  />
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'analyzing' && (
            <motion.div
              key="analyzing"
              className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-2"
              initial={{ opacity: 0, y: '-15%' }}
              animate={{ opacity: 1, y: '-15%' }}
              exit={{ opacity: 0, y: '-15%' }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex w-[95%] items-center justify-center">
                <Lottie
                  src={scanningAtsAnimation}
                  loop
                  autoplay
                  className="h-auto w-full"
                  aria-hidden
                />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={statusIndex}
                  className="ats-check-shimmer text-center text-sm leading-relaxed text-white/80"
                  style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                >
                  {STATUS_LINES[statusIndex]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}

          {phase === 'results' && result && (
            <motion.div
              key="results"
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AtsCheckResults result={result} onReset={resetAll} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .ats-check-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.35) 0%,
            rgba(255, 255, 255, 0.95) 45%,
            rgba(255, 255, 255, 0.35) 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: ats-shimmer 2.2s ease-in-out infinite;
        }
        @keyframes ats-shimmer {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }
      `}</style>
    </div>
  );
}
