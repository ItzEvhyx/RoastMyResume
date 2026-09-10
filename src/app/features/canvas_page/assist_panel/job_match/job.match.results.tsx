'use client';

/**
 * Job Match results — scrollable matches above a fixed keywords footer (max 2 rows, horizontal scroll).
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { JobMatchResult } from '@/app/core/services/claude';

const CIRCLE_SIZE = 72;
const STROKE = 6;
const RADIUS = (CIRCLE_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Two keyword rows (~28px pill + 8px gap) */
const KEYWORD_ROWS_MAX_H = 68;

export default function JobMatchResults({
  result,
  onReset,
}: {
  result: JobMatchResult;
  onReset: () => void;
}) {
  const [displayPct, setDisplayPct] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const target = result.matchPercent;
    let frame = 0;
    const frames = 36;
    const tick = () => {
      frame += 1;
      const t = Math.min(1, frame / frames);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayPct(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [result.matchPercent]);

  const offset = CIRCUMFERENCE * (1 - displayPct / 100);
  const hasKeywords =
    result.matchedKeywords.length > 0 || result.unmatchedKeywords.length > 0;

  const requestReset = () => {
    if (exiting) return;
    setExiting(true);
  };

  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col"
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={
        exiting
          ? { opacity: 0, y: 28, scale: 0.94, filter: 'blur(4px)' }
          : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
      }
      transition={{ duration: exiting ? 0.35 : 0.4, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        if (exiting) onReset();
      }}
    >
      {/* Scrollable matches / mismatches — stops where keywords begin */}
      <div className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
            <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} className="-rotate-90">
              <circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={STROKE}
              />
              <motion.circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="#ffffff"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                animate={{ strokeDashoffset: offset }}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-white"
              style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700, fontSize: 16 }}
            >
              {displayPct}%
            </span>
          </div>
          <p
            className="text-sm leading-snug text-white/80"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
          >
            {displayPct >= 75
              ? 'Strong match — you’re close.'
              : displayPct >= 45
                ? 'Partial match — fill a few gaps.'
                : 'Weak match — big gaps to close.'}
          </p>
        </div>

        {result.matchedQualifications.length > 0 && (
          <ul className="space-y-2.5">
            {result.matchedQualifications.map((item) => (
              <li key={`m-${item}`} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'rgba(34,197,94,0.2)', border: '1.5px solid #22c55e' }}
                  aria-hidden
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#22c55e"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span
                  className="text-sm leading-snug text-white"
                  style={{ fontFamily: 'var(--font-poppins)', fontWeight: 500 }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        )}

        {result.missingQualifications.length > 0 && (
          <ul className="space-y-2.5">
            {result.missingQualifications.map((item) => (
              <li key={`x-${item}`} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'transparent', border: '1.5px solid #ef4444' }}
                  aria-hidden
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span
                  className="text-sm leading-snug text-white/55"
                  style={{ fontFamily: 'var(--font-poppins)', fontWeight: 500 }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Fixed keywords footer — no overlay gradient; content above scrolls independently */}
      <div className="mt-3 flex-shrink-0 border-t border-white/10 pt-3">
        {hasKeywords && (
          <div className="mb-3">
            <p
              className="mb-2 text-sm text-white"
              style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
            >
              Keywords
            </p>
            <div
              className="no-scrollbar overflow-x-auto overflow-y-hidden pb-1"
              style={{
                display: 'grid',
                gridAutoFlow: 'column',
                gridTemplateRows: 'auto auto',
                gridAutoColumns: 'max-content',
                gap: '8px',
                maxHeight: KEYWORD_ROWS_MAX_H,
                alignContent: 'start',
              }}
            >
              {result.matchedKeywords.map((kw) => (
                <span
                  key={`mk-${kw}`}
                  className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs text-black"
                  style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
                >
                  {kw}
                </span>
              ))}
              {result.unmatchedKeywords.map((kw) => (
                <span
                  key={`uk-${kw}`}
                  className="whitespace-nowrap px-1 py-1 text-xs text-white/35"
                  style={{ fontFamily: 'var(--font-poppins)', fontWeight: 500 }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pb-1">
          <button
            type="button"
            onClick={requestReset}
            disabled={exiting}
            className="rounded-full bg-white px-4 py-2 text-xs text-black transition-transform hover:brightness-95 active:scale-[0.98] disabled:opacity-70"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
          >
            Enter job listing again
          </button>
        </div>
      </div>
    </motion.div>
  );
}
