'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import ReactMarkdown from 'react-markdown';
import { useCanvasSnapshot } from '../../hooks/use.canvas.snapshot';
import { useDeniseAnalysis } from '../../context/DeniseAnalysisContext';
import { normalizeDeniseMarkdown } from '../../utils/denise.markdown';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

const PLACEHOLDER_TEXTS = [
  'How do I improve my resume?',
  "What's wrong with my work experience section?",
  'How can I make my resume stand out?',
  'Is my resume ATS-friendly?',
  'Should I include a summary statement?',
  'How do I quantify my achievements?',
  'What keywords should I use?',
  'Is my resume too long?',
  'How do I tailor my resume for this job?',
  "What's the best format for my industry?",
  'Should I include my GPA?',
  'How do I explain employment gaps?',
  'What skills should I highlight?',
  'Is my contact information correct?',
  'How do I describe my projects?',
  'Should I use bullet points or paragraphs?',
  'What font should I use?',
  'How much white space is too much?',
  'Should I include references?',
  'How do I make my resume one page?',
];

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AskDeniseProps {
  onBack?: () => void;
}

/** Same progressive reveal as the landing sample Review card. */
function useTypewriter(full: string, tickMs = 12): string {
  const [count, setCount] = useState(0);
  // Aim to finish in ~1–1.2s even for long roast lists
  const charsPerTick = Math.max(4, Math.ceil(full.length / 100) || 4);

  useEffect(() => {
    setCount(0);
    if (!full) return;
    const id = setInterval(() => {
      setCount((c) => {
        const next = c + charsPerTick;
        if (next >= full.length) {
          clearInterval(id);
          return full.length;
        }
        return next;
      });
    }, tickMs);
    return () => clearInterval(id);
  }, [full, charsPerTick, tickMs]);

  return full.slice(0, count);
}

/**
 * Dark-panel chatbot markdown — mirrors landing sample.web ReviewMarkdown
 * (Poppins, **bold** → yellow marks, bullets, italics).
 */
function DeniseMarkdown({ content }: { content: string }) {
  const normalized = normalizeDeniseMarkdown(content);
  return (
    <div
      className="text-sm leading-relaxed text-white/90"
      style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1
              className="mb-2 mt-4 text-lg font-extrabold text-white first:mt-0"
              style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className="mb-2 mt-4 text-base font-extrabold text-white first:mt-0"
              style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className="mb-1 mt-3 text-sm font-bold text-white first:mt-0"
              style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-2.5 pl-5 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-2.5 pl-5 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-1 leading-relaxed">{children}</li>
          ),
          // Bold phrases = flagged fluff (same as sample.web)
          strong: ({ children }) => (
            <mark className="rounded bg-yellow-300 px-1 font-semibold text-black">
              {children}
            </mark>
          ),
          em: ({ children }) => <em className="italic text-white/80">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-4 border-white/25 pl-3 italic text-white/65">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs text-white">
              {children}
            </code>
          ),
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}

function AssistantBubble({ content }: { content: string }) {
  const normalized = normalizeDeniseMarkdown(content);
  const typed = useTypewriter(normalized);
  return <DeniseMarkdown content={typed} />;
}

/** Shimmer loading copy — same effect as sample.web, tuned for dark panel. */
function ShimmerWave({ text }: { text: string }) {
  return (
    <p
      className="text-shimmer-on-dark text-sm font-medium italic"
      style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
    >
      {text}
    </p>
  );
}

const actionBtnBase =
  'w-full flex items-center justify-center gap-2 px-5 py-2 rounded-full transition-all duration-200 hover:brightness-110 active:scale-[0.98]';

export default function AskDenise({ onBack: _onBack }: AskDeniseProps) {
  const [mode, setMode] = useState<'roast' | 'help'>('roast');
  const [inputValue, setInputValue] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  /** Separate threads so switching modes swaps conversations, not deletes them. */
  const [threads, setThreads] = useState<Record<'roast' | 'help', ConversationMessage[]>>({
    roast: [],
    help: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const responseEndRef = useRef<HTMLDivElement>(null);

  const messages = threads[mode];

  const canvasSnapshot = useCanvasSnapshot();
  const {
    beginScan,
    completeScan,
    setIsAnalyzing,
    setAnalysisResult,
    applyFixes,
    toggleBeforeAfter,
    abandonFixes,
    fixes,
    applied,
    showingAfter,
    isScanning,
    isAnalyzing,
    bulletproofById,
  } = useDeniseAnalysis();

  const showActionButtons = fixes.length > 0 && !isLoading;
  const waitingForDenise = isLoading || isScanning || isAnalyzing;

  const handleModeChange = useCallback(
    (next: 'roast' | 'help') => {
      if (next === mode || waitingForDenise) return;
      setMode(next);
      // Clear canvas highlights/action state from the other mode's review
      // without wiping Denise-approved bulletproof text.
      setAnalysisResult({ highlights: [], fixes: [] });
    },
    [mode, waitingForDenise, setAnalysisResult],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_TEXTS.length);
    }, 3600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    responseEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isScanning, isAnalyzing, mode]);

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ConversationMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setThreads((prev) => ({ ...prev, [mode]: updatedMessages }));
    setInputValue('');
    setIsLoading(true);
    setIsAnalyzing(true);
    beginScan();

    try {
      const res = await fetch('/api/denise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          canvasSnapshot,
          messages: updatedMessages,
          approvedElements: bulletproofById,
        }),
      });
      const data = await res.json();

      completeScan();

      if (!res.ok) {
        console.error('[AskDenise] API error:', data.error);
        setThreads((prev) => ({
          ...prev,
          [mode]: [
            ...prev[mode],
            {
              role: 'assistant',
              content: 'Denise is unavailable right now. Try again in a moment.',
            },
          ],
        }));
        setAnalysisResult({ highlights: [], fixes: [] });
        return;
      }

      const assistantContent =
        typeof data.content === 'string' && data.content.trim()
          ? data.content
          : 'I reviewed your resume, but my notes got scrambled. Try again.';

      const safeContent =
        assistantContent.trimStart().startsWith('{') &&
        assistantContent.includes('"highlights"')
          ? 'I reviewed your resume, but my notes got scrambled. Send that again and I’ll take another pass.'
          : assistantContent;

      setThreads((prev) => ({
        ...prev,
        [mode]: [...prev[mode], { role: 'assistant', content: safeContent }],
      }));

      if (data.outOfScope) {
        setAnalysisResult({ highlights: [], fixes: [] });
      } else {
        setAnalysisResult({
          highlights: Array.isArray(data.highlights) ? data.highlights : [],
          fixes: Array.isArray(data.fixes) ? data.fixes : [],
        });
      }
    } catch (err) {
      console.error('[AskDenise] Request failed:', err);
      completeScan();
      setThreads((prev) => ({
        ...prev,
        [mode]: [
          ...prev[mode],
          {
            role: 'assistant',
            content: 'Something went wrong reaching Denise. Please try again.',
          },
        ],
      }));
      setAnalysisResult({ highlights: [], fixes: [] });
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  }, [
    inputValue,
    isLoading,
    messages,
    mode,
    canvasSnapshot,
    bulletproofById,
    beginScan,
    completeScan,
    setIsAnalyzing,
    setAnalysisResult,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex h-full min-h-0 flex-col ${poppins.variable} ${futuraDisplay.variable}`}>
      {/* Header: larger Denise + text, toggles under HR */}
      <div className="relative flex flex-shrink-0 items-end gap-3 px-5 pt-3 pb-3">
        <div className="relative flex-shrink-0" style={{ width: 150, height: 175 }}>
          <Image
            src="/assets/images/ask_denise.png"
            alt="Ask Denise"
            fill
            className="object-contain object-bottom"
            priority
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-end pb-1">
          <h2
            className="mb-1.5 leading-[1.05] text-white"
            style={{
              fontFamily: 'var(--font-futura-display), sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(1.85rem, 3.2vw, 2.55rem)',
            }}
          >
            Ask Denise
          </h2>
          <p
            className="mb-1 text-[13px] leading-snug text-white/75"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
          >
            Always here to guide your resume to the right direction
          </p>
          <p
            className="mb-2.5 text-xs text-white/65"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
          >
            -Human Resources-
          </p>

          {/* Mode toggle — directly under HR label */}
          <div
            className="relative inline-flex w-fit items-center self-start rounded-full p-1"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                left: mode === 'roast' ? '4px' : 'calc(50% - 4px)',
                width: 'calc(50% - 4px)',
              }}
            />
            <button
              type="button"
              onClick={() => handleModeChange('roast')}
              disabled={waitingForDenise}
              className={`relative z-10 rounded-full px-6 py-1 transition-colors duration-200 ${
                mode === 'roast' ? 'text-white' : 'text-white/50'
              }`}
              style={{
                fontFamily: 'var(--font-poppins)',
                fontWeight: 600,
                fontSize: '0.8125rem',
              }}
            >
              Roast
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('help')}
              disabled={waitingForDenise}
              className={`relative z-10 rounded-full px-6 py-1 transition-colors duration-200 ${
                mode === 'help' ? 'text-white' : 'text-white/50'
              }`}
              style={{
                fontFamily: 'var(--font-poppins)',
                fontWeight: 600,
                fontSize: '0.8125rem',
              }}
            >
              Help me
            </button>
          </div>
        </div>
      </div>

      {/* Response area — invisible scrollbars */}
      <div
        className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto px-5 py-2"
        style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
      >
        {messages.map((msg, index) =>
          msg.role === 'user' ? (
            <div
              key={`user-${index}`}
              className="ml-8 rounded-2xl px-3.5 py-2.5 text-sm text-white/90"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              {msg.content}
            </div>
          ) : (
            <AssistantBubble key={`assistant-${index}`} content={msg.content} />
          ),
        )}

        {waitingForDenise && (
          <ShimmerWave
            text={
              isScanning
                ? 'Denise is scanning your resume…'
                : 'Reading your resume and sharpening the knives…'
            }
          />
        )}
        <div ref={responseEndRef} />
      </div>

      {/* Compact action buttons — before/after only after Apply */}
      {showActionButtons && (
        <div className="flex-shrink-0 space-y-1.5 px-5 pb-2 pt-1">
          {applied ? (
            <>
              <button
                type="button"
                onClick={abandonFixes}
                className={actionBtnBase}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  fontFamily: 'var(--font-poppins)',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  color: '#000',
                }}
              >
                Abandon Denise&rsquo;s fixes
              </button>
              <button
                type="button"
                onClick={toggleBeforeAfter}
                className={actionBtnBase}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontFamily: 'var(--font-poppins)',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  color: '#fff',
                }}
              >
                {showingAfter ? 'Show original' : "Show Denise's fixes"}
                <Image
                  src="/assets/icons/review_resume_icon.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="brightness-0 invert"
                />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={applyFixes}
              className={actionBtnBase}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                fontFamily: 'var(--font-poppins)',
                fontWeight: 700,
                fontSize: '0.8125rem',
                color: '#000',
              }}
            >
              Apply Denise&rsquo;s fixes
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Chat input */}
      <div className="flex-shrink-0 px-5 pb-4 pt-1">
        <div
          className="relative flex items-center gap-3 rounded-full px-4 py-2.5"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            opacity: waitingForDenise ? 0.6 : 1,
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER_TEXTS[placeholderIndex]}
            disabled={waitingForDenise}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40 disabled:cursor-not-allowed"
            style={{
              fontFamily: 'var(--font-poppins)',
              fontWeight: 400,
            }}
          />

          {inputValue.trim() ? (
            <button
              type="button"
              onClick={handleSend}
              disabled={waitingForDenise}
              className="flex-shrink-0 transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-50"
              aria-label="Send message"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="flex-shrink-0 transition-all duration-200 hover:brightness-110 active:scale-95"
              aria-label="Voice input"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
