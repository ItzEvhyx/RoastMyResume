'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import { AnimatePresence, motion } from 'framer-motion';
import { Lottie } from 'lottie-react';
import JobMatchAnimation from './job.match.animation';
import JobMatchResults from './job.match.results';
import { useCanvasSnapshot } from '../../hooks/use.canvas.snapshot';
import { useDeniseAnalysis } from '../../context/DeniseAnalysisContext';
import {
  AiUsageBadge,
  aiRequestHeaders,
  useAiRateLimits,
} from '../../hooks/use.ai.rate.limits';
import type { ImageMediaType, JobMatchResult } from '@/app/core/services/claude';
import type { AiRateStatus } from '@/app/core/services/ratelimit.shared';
import scanningJobMatchAnimation from '../../../../../../public/assets/videos/lottie_animations/scanning_jobmatch.json';

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

const CHAR_LIMIT = 600;
const MAX_IMAGES = 3;

const STATUS_LINES = [
  'Denise is checking your resume to see if you qualify…',
  'Scanning the job listing against your canvas…',
  'Matching skills, tools, and experience…',
  'Almost done — scoring your fit…',
];

type Phase = 'idle' | 'analyzing' | 'results';

interface AttachedImage {
  id: string;
  previewUrl: string;
  mediaType: ImageMediaType;
  data: string;
}

interface JobMatchProps {
  onBack?: () => void;
}

function fileToAttachment(file: File): Promise<AttachedImage | null> {
  return new Promise((resolve) => {
    const mediaType = file.type as ImageMediaType;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const match = /^data:([^;]+);base64,(.*)$/.exec(result);
      if (!match) {
        resolve(null);
        return;
      }
      resolve({
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        previewUrl: result,
        mediaType: mediaType,
        data: match[2],
      });
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export default function JobMatch({ onBack: _onBack }: JobMatchProps) {
  const canvasSnapshot = useCanvasSnapshot();
  const { beginScan, completeScan } = useDeniseAnalysis();
  const {
    email,
    remaining,
    unlimited,
    exhausted,
    limit,
    refresh,
    applyStatus,
  } = useAiRateLimits('job_match');

  const [phase, setPhase] = useState<Phase>('idle');
  const [jobDescription, setJobDescription] = useState('');
  const [attachments, setAttachments] = useState<AttachedImage[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [result, setResult] = useState<JobMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attachNotice, setAttachNotice] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend =
    phase === 'idle' &&
    !exhausted &&
    Boolean(email) &&
    (jobDescription.trim().length > 0 || attachments.length > 0);

  // Rotate shimmer status while analyzing
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
    setAttachNotice('');
    setJobDescription('');
    setAttachments([]);
    setPreviewId(null);
  }, [completeScan]);

  const handleAttachFiles = useCallback(async (files: FileList | File[] | null) => {
    if (!files) return;
    const incoming = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!incoming.length) return;

    const remaining = MAX_IMAGES - attachments.length;
    if (remaining <= 0) {
      setAttachNotice(`You can attach up to ${MAX_IMAGES} screenshots.`);
      return;
    }

    const allowed = incoming.slice(0, remaining);
    setAttachNotice(
      incoming.length > remaining
        ? `You can attach up to ${MAX_IMAGES} screenshots.`
        : '',
    );

    const next: AttachedImage[] = [];
    for (const file of allowed) {
      const att = await fileToAttachment(file);
      if (att) next.push(att);
    }
    if (next.length) setAttachments((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
  }, [attachments.length]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const imageItems = Array.from(e.clipboardData.items).filter((it) =>
        it.type.startsWith('image/'),
      );
      if (imageItems.length === 0) return; // let normal text paste happen
      e.preventDefault();
      const files = imageItems
        .map((it) => it.getAsFile())
        .filter((f): f is File => f !== null);
      void handleAttachFiles(files);
    },
    [handleAttachFiles],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    setPreviewId((cur) => (cur === id ? null : cur));
    setAttachNotice('');
  }, []);

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    if (!email) {
      setError('Sign in to use Job Match.');
      return;
    }
    if (exhausted) {
      setError(`Daily limit reached (${limit}/${limit}). Try again tomorrow.`);
      return;
    }

    const text = jobDescription.trim().slice(0, CHAR_LIMIT);
    const images = attachments.map(({ data, mediaType }) => ({ data, mediaType }));

    setError(null);
    setPhase('analyzing');
    beginScan({ clearFixes: false });

    try {
      const res = await fetch('/api/job-match', {
        method: 'POST',
        headers: aiRequestHeaders(email),
        body: JSON.stringify({
          text,
          images,
          canvasSnapshot,
          email,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as JobMatchResult & {
        error?: string;
        rateLimit?: AiRateStatus;
      };
      if (!res.ok) {
        if (res.status === 429) void refresh();
        throw new Error(data.error || 'Job match failed.');
      }
      if (data.rateLimit) applyStatus(data.rateLimit);
      else void refresh();
      setResult(data);
      setPhase('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Job match failed.');
      setPhase('idle');
    } finally {
      completeScan();
    }
  }, [
    canSend,
    email,
    exhausted,
    limit,
    jobDescription,
    attachments,
    canvasSnapshot,
    beginScan,
    completeScan,
    refresh,
    applyStatus,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const preview = attachments.find((a) => a.id === previewId) ?? null;

  return (
    <div
      className={`flex h-full min-h-0 flex-col p-6 ${poppins.variable} ${futuraDisplay.variable}`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
          <Image
            src="/assets/icons/briefcase_icon.png"
            alt="Job Match"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h2
          className="min-w-0 flex-1 leading-tight text-white"
          style={{
            fontFamily: 'var(--font-futura-display), sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
          }}
        >
          Job Match
        </h2>
        {email && (
          <AiUsageBadge
            remaining={remaining}
            limit={limit}
            unlimited={unlimited}
          />
        )}
      </div>

      <p
        className="mb-4 text-sm leading-snug text-white/70"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
      >
        Paste a posting and see where you actually stand.
      </p>

      {/* Content area under subtitle */}
      <div className="flex min-h-0 flex-1 flex-col">
        {phase === 'idle' && (
          <>
            <div
              className="relative mb-4 overflow-hidden rounded-3xl"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                height: 280,
                flexShrink: 0,
              }}
            >
              <JobMatchAnimation />
            </div>

            {error && (
              <p
                className="mb-2 text-xs text-red-300/90"
                style={{ fontFamily: 'var(--font-poppins)', fontWeight: 500 }}
              >
                {error}
              </p>
            )}

              <div className="mt-auto space-y-2">
              {/* Attachment thumbnails */}
              {attachments.length > 0 && (
                <div className="grid w-[95%] grid-cols-3 gap-2.5 px-1">
                  {attachments.map((att) => (
                    <div key={att.id} className="relative min-w-0">
                      <button
                        type="button"
                        onClick={() => setPreviewId(att.id)}
                        className="block w-full overflow-hidden rounded-2xl border border-white/20 transition-opacity hover:opacity-90"
                        style={{ aspectRatio: '1 / 1' }}
                        aria-label="Preview attachment"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={att.previewUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-xs text-white"
                        aria-label="Remove attachment"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {attachNotice && (
                <p
                  className="px-1 text-[11px] text-white/45"
                  style={{ fontFamily: 'var(--font-poppins)', fontWeight: 500 }}
                >
                  {attachNotice}
                </p>
              )}

              <div
                className="flex items-center gap-2 rounded-3xl px-3 py-2.5 sm:gap-3 sm:px-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= MAX_IMAGES}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 disabled:opacity-35"
                  aria-label="Attach job listing image"
                  title={
                    attachments.length >= MAX_IMAGES
                      ? 'Max 3 images'
                      : 'Attach up to 3 images'
                  }
                >
                  {/* Solid bold paperclip */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M16.5 6.75v10.5a4.5 4.5 0 1 1-9 0V6.5a3 3 0 0 1 6 0v9.75a1.5 1.5 0 1 1-3 0V8.25H9v7.75a3 3 0 0 0 6 0V6.5a4.5 4.5 0 1 0-9 0v10.75a6 6 0 0 0 12 0V6.75h-1.5z" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void handleAttachFiles(e.target.files);
                    e.target.value = '';
                  }}
                />

                <textarea
                  ref={textareaRef}
                  value={jobDescription}
                  onChange={(e) =>
                    setJobDescription(e.target.value.slice(0, CHAR_LIMIT))
                  }
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Paste a job description here..."
                  rows={2}
                  maxLength={CHAR_LIMIT}
                  className="max-h-36 min-h-[2.5rem] min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-sm leading-snug text-white outline-none placeholder:text-white/40"
                  style={{
                    fontFamily: 'var(--font-poppins)',
                    fontWeight: 400,
                  }}
                />

                <span
                  className="flex-shrink-0 text-[11px] tabular-nums text-white/40"
                  style={{ fontFamily: 'var(--font-poppins)', fontWeight: 500 }}
                >
                  {jobDescription.length}/{CHAR_LIMIT}
                </span>

                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!canSend}
                  className="flex-shrink-0 transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-40"
                  aria-label="Send message"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}

        {phase === 'analyzing' && (
          <motion.div
            className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-2"
            initial={{ opacity: 0, y: '-15%' }}
            animate={{ opacity: 1, y: '-15%' }}
            exit={{ opacity: 0, y: '-15%' }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex w-[95%] items-center justify-center">
              <Lottie
                src={scanningJobMatchAnimation}
                loop
                autoplay
                className="h-auto w-full"
                aria-hidden
              />
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={STATUS_LINES[statusIndex]}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="job-match-shimmer text-center text-sm leading-relaxed text-white/80"
                style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
              >
                {STATUS_LINES[statusIndex]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 'results' && result && (
          <JobMatchResults result={result} onReset={resetAll} />
        )}
      </div>

      {/* Fullscreen image preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            className="fixed inset-0 z-[400000] flex items-center justify-center bg-black/80 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewId(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative max-h-[85vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.previewUrl}
                alt="Job listing preview"
                className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setPreviewId(null)}
                className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black"
                aria-label="Close preview"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .job-match-shimmer {
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
          animation: jobMatchShimmer 2.2s ease-in-out infinite;
        }
        @keyframes jobMatchShimmer {
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
