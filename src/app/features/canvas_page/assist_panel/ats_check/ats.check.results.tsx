'use client';

/**
 * ATS Check results — expandable factors above a sticky overall score footer.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import type { AtsCheckResult, AtsFactorId } from '@/app/core/services/claude';

const FACTOR_META: Record<
  AtsFactorId,
  { label: string; icon: string; alt: string }
> = {
  column_layout: {
    label: 'Column layout & structure',
    icon: '/assets/icons/layout_icon.png',
    alt: 'Layout',
  },
  tables_graphics: {
    label: 'Tables & graphics',
    icon: '/assets/icons/table_icon.png',
    alt: 'Table',
  },
  fonts_embedded_text: {
    label: 'Fonts & embedded text',
    icon: '/assets/icons/font_icon.png',
    alt: 'Font',
  },
  file_format: {
    label: 'File format compatibility',
    icon: '/assets/icons/file_format_icon.png',
    alt: 'File Format',
  },
  contact_info: {
    label: 'Contact info parsing',
    icon: '/assets/icons/profile_icon.svg',
    alt: 'Profile',
  },
};

const OVERALL_SIZE = 72;
const FACTOR_SIZE = 56;
const STROKE = 6;

function ScoreRing({
  percent,
  size,
  fontSize,
}: {
  percent: number;
  size: number;
  fontSize: number;
}) {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={STROKE}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ffffff"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          initial={{ strokeDashoffset: circumference }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-white"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700, fontSize }}
      >
        {percent}%
      </span>
    </div>
  );
}

export default function AtsCheckResults({
  result,
  onReset,
}: {
  result: AtsCheckResult;
  onReset: () => void;
}) {
  const [displayPct, setDisplayPct] = useState(0);
  const [exiting, setExiting] = useState(false);
  /** All open after a check so scores are visible; click toggles. */
  const [openIds, setOpenIds] = useState<Set<AtsFactorId>>(
    () => new Set(result.factors.map((f) => f.id)),
  );

  useEffect(() => {
    const target = result.overallScore;
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
  }, [result.overallScore]);

  const toggle = (id: AtsFactorId) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
      <div className="no-scrollbar min-h-0 flex-1 space-y-0 overflow-y-auto pr-1">
        {result.factors.map((factor, index) => {
          const meta = FACTOR_META[factor.id];
          const open = openIds.has(factor.id);
          const isLast = index === result.factors.length - 1;

          return (
            <div
              key={factor.id}
              className={isLast ? 'pb-4' : 'border-b border-white/10 pb-5 mb-5'}
            >
              <button
                type="button"
                onClick={() => toggle(factor.id)}
                className="flex w-full items-center gap-3 text-left transition-opacity hover:opacity-90"
                aria-expanded={open}
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center">
                  <Image
                    src={meta.icon}
                    alt={meta.alt}
                    width={24}
                    height={24}
                    className="opacity-70"
                  />
                </div>
                <span
                  className="flex-1 text-white/90"
                  style={{
                    fontFamily: 'var(--font-poppins)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  {meta.label}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="flex-shrink-0 text-white/45 transition-transform duration-200"
                  style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  aria-hidden
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 flex items-start gap-4 pl-1">
                      <ScoreRing
                        percent={factor.score}
                        size={FACTOR_SIZE}
                        fontSize={13}
                      />
                      <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                        <p
                          className="text-sm leading-snug text-white/85"
                          style={{
                            fontFamily: 'var(--font-poppins)',
                            fontWeight: 500,
                          }}
                        >
                          {factor.reason}
                        </p>
                        <p
                          className="text-sm leading-snug text-white/50"
                          style={{
                            fontFamily: 'var(--font-poppins)',
                            fontWeight: 500,
                          }}
                        >
                          {factor.tip}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Sticky final rating */}
      <div className="mt-3 flex-shrink-0 border-t border-white/10 pt-4">
        <div className="mb-4 flex items-center gap-4">
          <ScoreRing percent={displayPct} size={OVERALL_SIZE} fontSize={16} />
          <p
            className="text-sm leading-snug text-white/85"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
          >
            {result.judgment}
          </p>
        </div>
        <div className="flex justify-end pb-1">
          <button
            type="button"
            onClick={requestReset}
            disabled={exiting}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs text-black transition-transform hover:brightness-95 active:scale-[0.98] disabled:opacity-70"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
          >
            Rescan
            <Image
              src="/assets/icons/scan_icon.png"
              alt=""
              width={16}
              height={16}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
