'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import ReactMarkdown from 'react-markdown';
import { useCanvasSnapshot } from '../../hooks/use.canvas.snapshot';
import { useDeniseAnalysis } from '../../context/DeniseAnalysisContext';
import { normalizeDeniseMarkdown } from '../../utils/denise.markdown';
import {
  loadDeniseState,
  patchDeniseState,
  type DeniseChatMode,
  type DeniseChatMessage,
} from '../../services/denise.persistence';
import { useSpeechToText } from '../../hooks/use.speech.to.text';
import { useDeniseVoice } from '../../hooks/use.denise.voice';
import {
  AiUsageBadge,
  aiRequestHeaders,
  useAiRateLimits,
} from '../../hooks/use.ai.rate.limits';
import type { AiRateStatus } from '@/app/core/services/ratelimit.shared';
import VoiceTranscribeModal from './voice.transcribe.modal';
import { VolumeX } from 'lucide-react';
import { useMediaQuery } from '@/lib/use_media_query';

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

function loadInitialChat(): {
  mode: DeniseChatMode;
  threads: Record<DeniseChatMode, ConversationMessage[]>;
} {
  if (typeof window === 'undefined') {
    return { mode: 'roast', threads: { roast: [], help: [] } };
  }
  const saved = loadDeniseState();
  if (!saved) return { mode: 'roast', threads: { roast: [], help: [] } };
  return {
    mode: saved.mode,
    threads: {
      roast: saved.threads.roast as ConversationMessage[],
      help: saved.threads.help as ConversationMessage[],
    },
  };
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

/** First-look / canvas scan — roast or fresh help review. */
const SCAN_THOUGHTS = [
  'Denise is reading your resume…',
  'Denise is gathering her thoughts…',
  'Denise is making her judgements…',
  'Denise is lining up what to ask next…',
];

/** Help-me follow-up after the user answers an interview question. */
const NOTE_THOUGHTS = [
  'Denise is taking note of your answer…',
  'Denise is connecting that to your bullets…',
  'Denise is deciding what to ask next…',
  'Denise is checking what details are still missing…',
];

/** Roast-mode loading colour. */
const ROAST_THOUGHTS = [
  'Denise is scanning your resume…',
  'Reading your resume and sharpening the knives…',
  'Denise is circling the fluff…',
  'Denise is preparing the roast…',
];

type ThinkingKind = 'scan' | 'notes' | 'roast';

function thoughtsFor(kind: ThinkingKind): string[] {
  if (kind === 'notes') return NOTE_THOUGHTS;
  if (kind === 'roast') return ROAST_THOUGHTS;
  return SCAN_THOUGHTS;
}

/**
 * Rotating “thought process” status while Denise works.
 * Crossfades copy so it feels like distinct moments, not one frozen line.
 */
function DeniseThinkingStatus({ kind }: { kind: ThinkingKind }) {
  const thoughts = thoughtsFor(kind);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setIndex(0);
    setVisible(true);
  }, [kind]);

  useEffect(() => {
    const lines = thoughtsFor(kind);
    if (lines.length <= 1) return;

    let fadeTimeout: ReturnType<typeof setTimeout> | null = null;
    const id = setInterval(() => {
      setVisible(false);
      fadeTimeout = setTimeout(() => {
        setIndex((i) => (i + 1) % lines.length);
        setVisible(true);
      }, 220);
    }, 1600);

    return () => {
      clearInterval(id);
      if (fadeTimeout) clearTimeout(fadeTimeout);
    };
  }, [kind]);

  return (
    <div
      className="rounded-2xl px-3.5 py-2.5 transition-opacity duration-200"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        opacity: visible ? 1 : 0,
      }}
    >
      <ShimmerWave text={thoughts[index] ?? thoughts[0]} />
    </div>
  );
}

const actionBtnBase =
  'w-full flex items-center justify-center gap-2 px-5 py-2 rounded-full transition-all duration-200 hover:brightness-110 active:scale-[0.98]';

export default function AskDenise({ onBack: _onBack }: AskDeniseProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const initial = useRef(loadInitialChat()).current;
  const [mode, setMode] = useState<DeniseChatMode>(initial.mode);
  const [inputValue, setInputValue] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  /** Separate threads so switching modes swaps conversations, not deletes them. */
  const [threads, setThreads] = useState<Record<DeniseChatMode, ConversationMessage[]>>(
    initial.threads,
  );
  const [isLoading, setIsLoading] = useState(false);
  /** Which thought-process copy to rotate while waiting. */
  const [thinkingKind, setThinkingKind] = useState<ThinkingKind>('scan');
  const [micPop, setMicPop] = useState(false);
  const responseEndRef = useRef<HTMLDivElement>(null);
  const readyToPersistRef = useRef(false);

  const messages = threads[mode];

  // Persist chat across refresh; cleared only with Start from Scratch
  useEffect(() => {
    readyToPersistRef.current = true;
  }, []);

  useEffect(() => {
    if (!readyToPersistRef.current) return;
    patchDeniseState({
      mode,
      threads: threads as Record<DeniseChatMode, DeniseChatMessage[]>,
    });
  }, [mode, threads]);

  const canvasSnapshot = useCanvasSnapshot();
  const {
    beginScan,
    completeScan,
    setIsAnalyzing,
    setAnalysisResult,
    setHighlightsOnly,
    applyFixes,
    toggleBeforeAfter,
    abandonFixes,
    fixes,
    phase,
    applied,
    showingAfter,
    isScanning,
    isAnalyzing,
    bulletproofById,
  } = useDeniseAnalysis();

  const {
    speak: speakDenise,
    pushPcm: pushDenisePcm,
    beginStreamSpeak,
    stop: stopDeniseVoice,
    isSpeaking: isDeniseSpeaking,
    error: deniseVoiceError,
    noteVoiceError,
  } = useDeniseVoice();

  const {
    email: rateEmail,
    features: rateFeatures,
    limit: rateLimitMax,
    refresh: refreshRateLimits,
    applyStatus: applyRateStatus,
  } = useAiRateLimits();
  const modeRate = rateFeatures[mode];
  const rateUnlimited = Boolean(modeRate?.unlimited);
  const rateRemaining = rateUnlimited
    ? rateLimitMax
    : (modeRate?.remaining ?? (rateEmail ? rateLimitMax : 0));
  const rateExhausted = Boolean(
    rateEmail && !rateUnlimited && rateRemaining <= 0,
  );

  // Apply only after Help-me interview finishes and concrete fixes land.
  const showActionButtons =
    mode === 'help' && phase === 'fixes' && fixes.length > 0 && !isLoading;
  /** Shortcut to skip Q&A — hidden once Apply / Abandon controls take that slot. */
  const showJustFixButton = mode === 'help' && !showActionButtons;
  const waitingForDenise = isLoading || isScanning || isAnalyzing;
  const lastMessage = messages[messages.length - 1];
  const showThinkingStatus =
    waitingForDenise &&
    !(lastMessage?.role === 'assistant' && lastMessage.content.trim());

  const handleModeChange = useCallback(
    (next: 'roast' | 'help') => {
      if (next === mode || waitingForDenise) return;
      // Keep highlights + Help-me fix/apply state across mode switches.
      stopDeniseVoice();
      setMode(next);
    },
    [mode, waitingForDenise, stopDeniseVoice],
  );

  const handleClearChat = useCallback(() => {
    if (waitingForDenise) return;
    stopDeniseVoice();
    setThreads({ roast: [], help: [] });
    setInputValue('');
    // Reset canvas analysis tied to the cleared conversation
    setHighlightsOnly([]);
    setAnalysisResult({ highlights: [], fixes: [], phase: 'interview' });
    abandonFixes();
  }, [
    waitingForDenise,
    stopDeniseVoice,
    setHighlightsOnly,
    setAnalysisResult,
    abandonFixes,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_TEXTS.length);
    }, 3600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    responseEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isScanning, isAnalyzing, mode, thinkingKind]);

  const handleSend = useCallback(async (
    overrideText?: string,
    options?: { skipInterview?: boolean },
  ) => {
    const trimmed = (typeof overrideText === 'string' ? overrideText : inputValue).trim();
    if (!trimmed || isLoading) return;

    const skipInterview = options?.skipInterview === true && mode === 'help';
    const isNewSession = !messages.some((m) => m.role === 'assistant');

    if (!rateEmail) {
      setThreads((prev) => ({
        ...prev,
        [mode]: [
          ...prev[mode],
          { role: 'user', content: trimmed },
          {
            role: 'assistant',
            content: 'Sign in to ask Denise — AI features need an account.',
          },
        ],
      }));
      setInputValue('');
      return;
    }

    if (isNewSession && rateExhausted) {
      setThreads((prev) => ({
        ...prev,
        [mode]: [
          ...prev[mode],
          { role: 'user', content: trimmed },
          {
            role: 'assistant',
            content: `Daily limit reached for ${
              mode === 'roast' ? 'Roast' : 'Help me'
            } (${rateLimitMax}/${rateLimitMax}). Try again tomorrow.`,
          },
        ],
      }));
      setInputValue('');
      return;
    }

    stopDeniseVoice();

    const userMessage: ConversationMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    // Follow-up answers in Help me: Denise already scanned — don't rescan the canvas.
    const isHelpFollowUp =
      mode === 'help' &&
      !skipInterview &&
      messages.some((m) => m.role === 'assistant');

    setThreads((prev) => ({ ...prev, [mode]: updatedMessages }));
    setInputValue('');
    setIsLoading(true);
    setIsAnalyzing(true);

    if (skipInterview) {
      setThinkingKind('scan');
      beginScan({ clearFixes: true });
    } else if (isHelpFollowUp) {
      setThinkingKind('notes');
    } else if (mode === 'roast') {
      setThinkingKind('roast');
      beginScan({ clearFixes: false });
    } else {
      setThinkingKind('scan');
      beginScan({ clearFixes: true });
    }

    try {
      beginStreamSpeak();

      const res = await fetch('/api/denise/stream', {
        method: 'POST',
        headers: aiRequestHeaders(rateEmail),
        body: JSON.stringify({
          mode,
          canvasSnapshot,
          messages: updatedMessages,
          approvedElements: bulletproofById,
          email: rateEmail,
          ...(skipInterview ? { skipInterview: true } : {}),
        }),
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 429) void refreshRateLimits();
        throw new Error(data.error || 'Denise is unavailable right now.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let sawDone = false;
      let finalContent = '';
      let releasedScan = false;

      const releaseScanEarly = () => {
        if (releasedScan) return;
        releasedScan = true;
        completeScan();
        setIsAnalyzing(false);
      };

      const upsertAssistant = (content: string) => {
        setThreads((prev) => {
          const thread = [...prev[mode]];
          const last = thread[thread.length - 1];
          if (last?.role === 'assistant') {
            thread[thread.length - 1] = { role: 'assistant', content };
          } else {
            thread.push({ role: 'assistant', content });
          }
          return { ...prev, [mode]: thread };
        });
      };

      const applyAnalysis = (data: {
        outOfScope?: boolean;
        phase?: string;
        highlights?: unknown;
        fixes?: unknown;
      }) => {
        if (data.outOfScope) {
          if (mode === 'roast') setHighlightsOnly([]);
          else setAnalysisResult({ highlights: [], fixes: [], phase: 'interview' });
          return;
        }
        if (mode === 'roast') {
          setHighlightsOnly(Array.isArray(data.highlights) ? data.highlights : []);
          return;
        }
        const nextPhase =
          data.phase === 'fixes' || data.phase === 'interview'
            ? data.phase
            : Array.isArray(data.fixes) && data.fixes.length > 0
              ? 'fixes'
              : 'interview';
        setAnalysisResult({
          highlights: Array.isArray(data.highlights) ? data.highlights : [],
          fixes: Array.isArray(data.fixes) ? data.fixes : [],
          phase: nextPhase,
        });
      };

      const handleEvent = (payload: {
        type?: string;
        content?: string;
        pcm?: string;
        sampleRate?: number;
        error?: string;
        rateLimit?: AiRateStatus;
        result?: {
          content?: string;
          outOfScope?: boolean;
          phase?: string;
          highlights?: unknown;
          fixes?: unknown;
        };
      }) => {
        if (payload.type === 'text' && typeof payload.content === 'string') {
          finalContent = payload.content;
          if (payload.content.trim()) releaseScanEarly();
          upsertAssistant(payload.content);
          return;
        }

        if (
          payload.type === 'audio' &&
          typeof payload.pcm === 'string' &&
          typeof payload.sampleRate === 'number'
        ) {
          releaseScanEarly();
          pushDenisePcm(payload.pcm, payload.sampleRate);
          return;
        }

        if (payload.type === 'voice_error' && payload.error) {
          noteVoiceError(payload.error);
          return;
        }

        if (payload.type === 'done' && payload.result) {
          sawDone = true;
          completeScan();
          const safeContent =
            typeof payload.result.content === 'string' && payload.result.content.trim()
              ? payload.result.content
              : finalContent ||
                'I reviewed your resume, but my notes got scrambled. Try again.';
          finalContent = safeContent;
          upsertAssistant(safeContent);
          applyAnalysis(payload.result);
          if (payload.rateLimit) applyRateStatus(payload.rateLimit);
          else if (isNewSession) void refreshRateLimits();
          return;
        }

        if (payload.type === 'error') {
          throw new Error(payload.error || 'Denise is unavailable right now.');
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const line = part
            .split('\n')
            .map((l) => l.trim())
            .find((l) => l.startsWith('data:'));
          if (!line) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          try {
            handleEvent(JSON.parse(json) as Parameters<typeof handleEvent>[0]);
          } catch (err) {
            console.error('[AskDenise] Bad SSE chunk:', err);
          }
        }
      }

      if (!sawDone) {
        completeScan();
        if (!finalContent.trim()) {
          throw new Error('Denise is unavailable right now.');
        }
      }
    } catch (err) {
      console.error('[AskDenise] Request failed:', err);
      completeScan();
      stopDeniseVoice();
      const errContent =
        err instanceof Error && err.message
          ? err.message
          : 'Something went wrong reaching Denise. Please try again.';
      setThreads((prev) => {
        const thread = [...prev[mode]];
        const last = thread[thread.length - 1];
        if (last?.role === 'assistant' && !last.content.trim()) {
          thread[thread.length - 1] = { role: 'assistant', content: errContent };
        } else if (last?.role !== 'assistant' || last.content !== errContent) {
          thread.push({ role: 'assistant', content: errContent });
        }
        return { ...prev, [mode]: thread };
      });
      void speakDenise(errContent, mode, mode === 'help' ? phase : null);
      if (mode === 'roast') {
        setHighlightsOnly([]);
      } else {
        setAnalysisResult({ highlights: [], fixes: [], phase: 'interview' });
      }
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  }, [
    inputValue,
    isLoading,
    messages,
    mode,
    phase,
    canvasSnapshot,
    bulletproofById,
    beginScan,
    completeScan,
    setIsAnalyzing,
    setAnalysisResult,
    setHighlightsOnly,
    speakDenise,
    stopDeniseVoice,
    beginStreamSpeak,
    pushDenisePcm,
    noteVoiceError,
    rateEmail,
    rateExhausted,
    rateLimitMax,
    refreshRateLimits,
    applyRateStatus,
  ]);

  const {
    isSupported: voiceSupported,
    isListening,
    isTranscribing,
    error: voiceError,
    clearError: clearVoiceError,
    start: startVoice,
    stop: stopVoice,
    finish: finishVoice,
  } = useSpeechToText({
    onTranscript: (fullText) => setInputValue(fullText),
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isListening || isTranscribing) return;
      handleSend();
    }
  };

  const inputValueRef = useRef(inputValue);
  inputValueRef.current = inputValue;
  /** Text that was already in the box when recording started (kept on Retake). */
  const voicePrefixRef = useRef('');

  const handleMicClick = async () => {
    if (waitingForDenise || isListening || isTranscribing) return;
    stopDeniseVoice();
    clearVoiceError();
    setMicPop(true);
    window.setTimeout(() => setMicPop(false), 320);
    voicePrefixRef.current = inputValueRef.current.trim();
    await startVoice(voicePrefixRef.current);
  };

  /** Stop recording, finalize transcript, then send to Denise. */
  const handleVoiceDone = async () => {
    if (isTranscribing) return;
    const text = await finishVoice();
    if (text) void handleSend(text);
  };

  /** Discard current take and start a fresh recording. */
  const handleVoiceRetake = async () => {
    if (waitingForDenise || isTranscribing) return;
    clearVoiceError();
    setInputValue(voicePrefixRef.current);
    setMicPop(true);
    window.setTimeout(() => setMicPop(false), 320);
    // start() tears down the active session first
    await startVoice(voicePrefixRef.current);
  };

  // Don't keep the mic open while Denise is thinking
  useEffect(() => {
    if (waitingForDenise && isListening) stopVoice();
  }, [waitingForDenise, isListening, stopVoice]);

  return (
    <div
      className={`relative flex h-full min-h-0 flex-col ${poppins.variable} ${futuraDisplay.variable}`}
    >
      <VoiceTranscribeModal
        isOpen={isListening || isTranscribing}
        onCancel={() => {
          stopVoice();
          clearVoiceError();
        }}
      />

      {/* Header: larger Denise + text, toggles under HR */}
      <div className={`relative flex flex-shrink-0 items-end gap-2 px-4 sm:gap-3 sm:px-5 ${isMobile ? 'pb-2 pt-2' : 'pb-2 pt-2 max-[900px]:pb-2 xl:pb-3 xl:pt-3'}`}>
        <div
          className="relative flex-shrink-0"
          style={{
            width: isMobile ? 96 : undefined,
            height: isMobile ? 112 : undefined,
          }}
        >
          <div
            className={
              isMobile
                ? 'relative h-full w-full'
                : 'relative h-[min(175px,22vh)] w-[min(150px,18vh)]'
            }
          >
            <Image
              src="/assets/images/ask_denise.png"
              alt="Ask Denise"
              fill
              className="object-contain object-bottom"
              priority
            />
            {isDeniseSpeaking && (
              <button
                type="button"
                onClick={stopDeniseVoice}
                className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/45 transition-colors hover:bg-black/55"
                aria-label="Stop Denise’s voice"
                title="Mute Denise"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white shadow-lg ring-1 ring-white/25">
                  <VolumeX size={22} strokeWidth={2.25} />
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-end pb-1">
          <h2
            className="mb-1.5 leading-[1.05] text-white"
            style={{
              fontFamily: 'var(--font-futura-display), sans-serif',
              fontWeight: 800,
              fontSize: isMobile ? '1.55rem' : 'clamp(1.35rem, 2.4vw, 2.55rem)',
            }}
          >
            Ask Denise
          </h2>
          <p
            className={`mb-1 leading-snug text-white/75 ${isMobile ? 'text-[12px]' : 'text-[12px] xl:text-[13px]'}`}
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

          {/* Mode toggle + usage + clear chat */}
          <div className="flex flex-wrap items-center gap-2 self-start">
            <div
              className="inline-flex w-fit items-center gap-0.5 rounded-full p-1"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <button
                type="button"
                onClick={() => handleModeChange('roast')}
                disabled={waitingForDenise}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 transition-colors duration-200 sm:px-6 ${
                  mode === 'roast' ? 'bg-white/15 text-white' : 'text-white/50'
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
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 transition-colors duration-200 sm:px-6 ${
                  mode === 'help' ? 'bg-white/15 text-white' : 'text-white/50'
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

            {rateEmail && (
              <AiUsageBadge
                remaining={rateRemaining}
                limit={rateLimitMax}
                unlimited={rateUnlimited}
              />
            )}

            <button
              type="button"
              onClick={handleClearChat}
              disabled={
                waitingForDenise ||
                (threads.roast.length === 0 && threads.help.length === 0)
              }
              title="Clear chat with Denise"
              aria-label="Clear chat with Denise"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-red-400 transition-all duration-200 hover:bg-red-500/15 hover:text-red-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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

        {showThinkingStatus && <DeniseThinkingStatus kind={thinkingKind} />}
        <div ref={responseEndRef} />
      </div>

      {/* Compact action buttons — Help me fixes phase only */}
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

      {/* Chat input — above voice modal so live transcript stays visible */}
      <div className={`relative z-20 w-full min-w-0 flex-shrink-0 px-5 pt-1 ${isMobile ? 'pb-5' : 'pb-4'}`}>
        {mode === 'roast' && (
          <p
            className="mb-2 px-1 text-[11px] leading-snug text-white/45"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 500 }}
          >
            Tip: Want Denise to fix your resume for you? try out{' '}
            <button
              type="button"
              onClick={() => handleModeChange('help')}
              disabled={waitingForDenise}
              className="text-white/70 underline decoration-white/30 underline-offset-2 transition-colors hover:text-white disabled:opacity-50"
            >
              Help me
            </button>{' '}
            mode.
          </p>
        )}
        {showJustFixButton && (
          <button
            type="button"
            onClick={() =>
              handleSend(
                'Just fix my resume now — skip the clarifying questions and rewrite the weak lines based on what’s already on my canvas and anything I’ve already told you.',
                { skipInterview: true },
              )
            }
            disabled={
              waitingForDenise ||
              (rateExhausted && !messages.some((m) => m.role === 'assistant'))
            }
            className={`${actionBtnBase} mb-2 disabled:opacity-50 disabled:pointer-events-none`}
            style={{
              background: '#ffffff',
              fontFamily: 'var(--font-poppins)',
              fontWeight: 700,
              fontSize: '0.8125rem',
              color: '#000',
            }}
          >
            Just fix my resume
          </button>
        )}
        {voiceError && (
          <p
            className="mb-2 px-1 text-[11px] leading-snug text-red-300/90"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 500 }}
          >
            {voiceError}
          </p>
        )}
        {deniseVoiceError && (
          <p
            className="mb-2 px-1 text-[11px] leading-snug text-red-300/90"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 500 }}
          >
            {deniseVoiceError}
          </p>
        )}
        <div className="flex w-full min-w-0 flex-col gap-2">
          <div
            className="relative flex w-full min-w-0 items-center gap-2 rounded-full px-3 py-2.5 sm:gap-3 sm:px-4"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border:
                isListening || isTranscribing
                  ? '1px solid rgba(255, 255, 255, 0.35)'
                  : '1px solid rgba(255, 255, 255, 0.15)',
              opacity: waitingForDenise ? 0.6 : 1,
              boxShadow:
                isListening || isTranscribing
                  ? '0 0 0 1px rgba(255,255,255,0.08), 0 0 20px rgba(255,255,255,0.06)'
                  : undefined,
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                if (isListening || isTranscribing) return;
                setInputValue(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                isTranscribing && !isListening
                  ? 'Connecting…'
                  : isListening
                    ? 'Listening… your words appear here'
                    : PLACEHOLDER_TEXTS[placeholderIndex]
              }
              disabled={waitingForDenise || isTranscribing}
              readOnly={isListening || isTranscribing}
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40 disabled:cursor-not-allowed"
              style={{
                fontFamily: 'var(--font-poppins)',
                fontWeight: 400,
              }}
            />

            {!(isListening || isTranscribing) && (
              <span
                className={`inline-flex flex-shrink-0 items-center ${
                  micPop ? 'mic-pop-press' : ''
                }`}
              >
                {inputValue.trim() ? (
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={waitingForDenise}
                    className="transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-50"
                    aria-label="Send message"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={waitingForDenise || !voiceSupported}
                    className="transition-transform duration-200 hover:brightness-110 disabled:opacity-40"
                    aria-label="Voice input"
                    title={
                      voiceSupported
                        ? 'Speak your message'
                        : 'Voice input isn’t supported in this browser'
                    }
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                  </button>
                )}
              </span>
            )}
          </div>

          {(isListening || isTranscribing) && (
            <div
              className={`flex w-full min-w-0 items-center justify-end gap-2 ${
                micPop ? 'mic-pop-press' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => void handleVoiceRetake()}
                disabled={waitingForDenise || isTranscribing}
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-white/85 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-40"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.28)',
                  fontFamily: 'var(--font-poppins)',
                }}
                aria-label="Retake — clear and record again"
                title="Retake"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={() => void handleVoiceDone()}
                disabled={waitingForDenise || isTranscribing}
                className="rounded-full px-3 py-1.5 text-[11px] font-bold text-black transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-40"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  fontFamily: 'var(--font-poppins)',
                }}
                aria-label={
                  isTranscribing
                    ? 'Transcribing voice'
                    : 'Done — send voice message'
                }
              >
                {isTranscribing ? '…' : 'Done ✓'}
              </button>
            </div>
          )}
        </div>
        <style jsx>{`
          @keyframes mic-pop-press {
            0% {
              transform: scale(1);
            }
            35% {
              transform: scale(0.72);
            }
            70% {
              transform: scale(1.14);
            }
            100% {
              transform: scale(1);
            }
          }
          .mic-pop-press {
            animation: mic-pop-press 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        `}</style>
      </div>
    </div>
  );
}
