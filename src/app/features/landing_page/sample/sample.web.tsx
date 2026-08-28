// src/rb_components/sample.web.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import ReactMarkdown from 'react-markdown';

/**
 * Quick typewriter: reveals `full` a few characters per tick so even long
 * responses finish in ~1s. Returns the currently-revealed slice.
 */
function useTypewriter(full: string, charsPerTick = 4, tickMs = 12): string {
  const [count, setCount] = useState(0);

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

type ReviewMode = 'roast' | 'real-talk';

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

interface AttachedImage {
  /** Base64 payload without the data: URI prefix. */
  data: string;
  mediaType: ImageMediaType;
  /** Full data URI for previewing. */
  previewUrl: string;
}

const ACCEPTED_MEDIA_TYPES: ImageMediaType[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const MAX_IMAGES = 5;

const PLACEHOLDER =
  'Try it out, paste a section from your resume and have our AI pinpoint the fluff and vague parts of it';

/** Split a data URL into its base64 payload + media type. */
function parseDataUrl(dataUrl: string): AttachedImage | null {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!match) return null;
  const mediaType = match[1] as ImageMediaType;
  if (!ACCEPTED_MEDIA_TYPES.includes(mediaType)) return null;
  return { data: match[2], mediaType, previewUrl: dataUrl };
}

function readFileAsAttachedImage(file: File): Promise<AttachedImage | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(
        typeof reader.result === 'string' ? parseDataUrl(reader.result) : null
      );
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Renders the model's markdown review with resume-review styling: headers,
 * bold, italics, bullet + numbered lists. Any **bold** phrase is treated as a
 * flagged fluff phrase and highlighted.
 */
function ReviewMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed text-black">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-2 mt-4 text-lg font-extrabold first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-base font-extrabold first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1 mt-3 text-sm font-bold first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          // Bold phrases = the flagged fluff. Highlight them.
          strong: ({ children }) => (
            <mark className="rounded bg-yellow-300 px-1 font-semibold text-black">
              {children}
            </mark>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-4 border-black/20 pl-3 italic text-black/70">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/** Fullscreen preview of a single attached screenshot. */
function ImagePreviewModal({
  image,
  onClose,
}: {
  image: AttachedImage;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-h-[90vh] max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-black shadow-lg"
        >
          ×
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.previewUrl}
          alt="Screenshot preview"
          className="max-h-[90vh] w-auto rounded-xl object-contain"
        />
      </div>
    </div>
  );
}

export default function Sample() {
  // ---- shared input state (Build card) ----
  const [text, setText] = useState('');
  const [images, setImages] = useState<AttachedImage[]>([]);
  const [imageNotice, setImageNotice] = useState('');
  const [previewImage, setPreviewImage] = useState<AttachedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- review state (Review card) ----
  const [mode, setMode] = useState<ReviewMode>('roast');
  const [loading, setLoading] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [outOfScope, setOutOfScope] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const hasInput = text.trim().length > 0 || images.length > 0;
  const canCheck = hasInput && !loading;

  // Progressive reveal of the review text.
  const typedReview = useTypewriter(reviewText);

  async function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (incoming.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setImageNotice(`You can attach up to ${MAX_IMAGES} screenshots.`);
      return;
    }

    const allowed = incoming.slice(0, remaining);
    if (incoming.length > remaining) {
      setImageNotice(`You can attach up to ${MAX_IMAGES} screenshots.`);
    } else {
      setImageNotice('');
    }

    const parsed = await Promise.all(allowed.map(readFileAsAttachedImage));
    const valid = parsed.filter((p): p is AttachedImage => p !== null);
    if (valid.length > 0) setImages((prev) => [...prev, ...valid]);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const imageItems = Array.from(e.clipboardData.items).filter((it) =>
      it.type.startsWith('image/')
    );
    if (imageItems.length === 0) return; // let normal text paste happen
    e.preventDefault();
    const files = imageItems
      .map((it) => it.getAsFile())
      .filter((f): f is File => f !== null);
    void addFiles(files);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageNotice('');
  }

  async function runReview(nextMode: ReviewMode) {
    if (!hasInput) return;
    setLoading(true);
    setErrorMsg('');
    setOutOfScope(false);
    setReviewText('');

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: nextMode,
          text: text.trim() || undefined,
          images: images.map(({ data, mediaType }) => ({ data, mediaType })),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setErrorMsg(body?.error ?? 'Something went wrong. Try again.');
        return;
      }

      const result = (await res.json()) as {
        outOfScope: boolean;
        content: string;
      };
      if (result.outOfScope) {
        setOutOfScope(true);
        setReviewText('');
      } else {
        setReviewText(result.content);
      }
    } catch {
      setErrorMsg('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleCheckFluff() {
    void runReview(mode);
  }

  function handleModeChange(nextMode: ReviewMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    // If a review already ran, re-run it in the newly selected mode.
    if ((reviewText || outOfScope) && hasInput && !loading) {
      void runReview(nextMode);
    }
  }

  return (
    <section
      className={`relative z-10 mx-auto w-full max-w-7xl px-6 py-24 ${poppins.variable} ${futuraDisplay.variable}`}
    >
      {/* Eyebrow */}
      <p
        className="mb-1 text-lg italic text-white/60"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
      >
        - One tool, does two things
      </p>

      {/* Headline */}
      <h2
        className="mb-6 text-5xl leading-[1.05] text-white md:text-6xl"
        style={{ fontFamily: futuraStack, fontWeight: 800 }}
      >
        Design it your way.
        <br />
        Review it your way.
      </h2>

      {/* Two containers */}
      <div className="flex flex-col gap-6 md:flex-row md:items-stretch">

        {/* ---------------- BUILD CARD (white) ---------------- */}
        <div className="relative flex-1 rounded-2xl bg-white pt-28">
          {/* Notch pill — inside the container, near the top */}
          <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black px-6 py-3">
            <span
              className="text-2xl tracking-widest text-white"
              style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
            >
              Build
            </span>
            <Image
              src="/assets/icons/build_resume_icon.svg"
              alt=""
              width={40}
              height={40}
            />
          </div>

          {/* Card body — input area (fixed height) */}
          <div
            className="flex h-[520px] flex-col px-8 pb-8"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            <div className="flex min-h-0 flex-1 flex-col rounded-xl border-2 border-black/10 bg-black/[0.03] p-4 focus-within:border-black/30">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onPaste={handlePaste}
                placeholder={PLACEHOLDER}
                className="no-scrollbar min-h-0 flex-1 resize-none bg-transparent text-sm leading-relaxed text-black outline-none placeholder:text-black/40"
              />

              {/* Image previews (bigger, click to expand) */}
              {images.length > 0 && (
                <div className="no-scrollbar mt-3 flex max-h-32 flex-wrap gap-3 overflow-y-auto">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="group relative h-28 w-28 overflow-hidden rounded-lg border border-black/10"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewImage(img)}
                        className="h-full w-full"
                        aria-label={`Open screenshot ${i + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.previewUrl}
                          alt={`Attachment ${i + 1}`}
                          className="h-full w-full cursor-zoom-in object-cover transition-transform group-hover:scale-105"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        aria-label="Remove image"
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-sm leading-none text-white transition-colors hover:bg-black"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {imageNotice && (
                <p className="mt-2 text-xs text-black/50">{imageNotice}</p>
              )}

              {/* Toolbar: attach + check fluff */}
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= MAX_IMAGES}
                  className="flex items-center gap-2 rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium text-black/70 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span aria-hidden>+</span> Add screenshot
                  <span className="text-black/40">
                    ({images.length}/{MAX_IMAGES})
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) void addFiles(e.target.files);
                    e.target.value = '';
                  }}
                />

                <button
                  type="button"
                  onClick={handleCheckFluff}
                  disabled={!canCheck}
                  aria-disabled={!canCheck}
                  className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
                    canCheck
                      ? 'bg-black text-white hover:bg-black/85'
                      : 'cursor-not-allowed bg-black/20 text-white/70'
                  }`}
                >
                  {loading ? 'Checking…' : 'Check fluff'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- REVIEW CARD (dark) ---------------- */}
        <div className="relative flex-1 rounded-2xl border-[3px] border-white bg-[#171717] pt-28">
          {/* Notch pill — inside the container, near the top */}
          <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white px-6 py-3">
            <span
              className="text-2xl tracking-widest text-black"
              style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
            >
              Review
            </span>
            <Image
              src="/assets/icons/review_resume_icon.svg"
              alt=""
              width={40}
              height={40}
            />
          </div>

          {/* Card body — review output (fixed height) */}
          <div
            className="flex h-[520px] flex-col items-center px-8 pb-8"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            {/* Roast / Real talk toggle (animated sliding thumb) */}
            <div className="relative mb-6 flex items-center rounded-full bg-black p-1">
              {/* Sliding highlight */}
              <span
                className="absolute top-1 bottom-1 left-1 rounded-full bg-white transition-transform duration-300 ease-out"
                style={{
                  width: 'calc(50% - 0.25rem)',
                  transform:
                    mode === 'roast' ? 'translateX(0%)' : 'translateX(100%)',
                }}
                aria-hidden
              />
              <button
                type="button"
                onClick={() => handleModeChange('roast')}
                className={`relative z-10 w-28 rounded-full py-2 text-lg transition-colors duration-300 ${
                  mode === 'roast'
                    ? 'font-extrabold italic text-black'
                    : 'font-semibold text-white/40'
                }`}
              >
                Roast
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('real-talk')}
                className={`relative z-10 w-28 rounded-full py-2 text-lg italic transition-colors duration-300 ${
                  mode === 'real-talk'
                    ? 'font-extrabold text-black'
                    : 'font-semibold text-white/40'
                }`}
              >
                Real talk
              </button>
            </div>

            {/* Review output box — fixed size, invisible scroll */}
            <div
              className={`no-scrollbar relative w-full min-h-0 flex-1 overflow-y-auto rounded-2xl p-6 transition-colors ${
                outOfScope ? 'bg-white/30' : 'bg-white'
              }`}
            >
              {loading && (
                <p className="text-sm italic text-black/50">
                  Reading your resume and sharpening the knives…
                </p>
              )}

              {!loading && errorMsg && (
                <p className="text-sm text-red-600">{errorMsg}</p>
              )}

              {!loading && !errorMsg && outOfScope && (
                <div className="flex h-full min-h-[200px] items-center justify-center">
                  <p className="text-center text-sm font-semibold text-black/70">
                    Sorry, but I can not respond to that kind of topic
                  </p>
                </div>
              )}

              {!loading && !errorMsg && !outOfScope && reviewText && (
                <ReviewMarkdown content={typedReview} />
              )}

              {!loading && !errorMsg && !outOfScope && !reviewText && (
                <p className="text-shimmer text-sm font-medium italic">
                  Your review will appear here once you check for fluff.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Screenshot preview modal */}
      {previewImage && (
        <ImagePreviewModal
          image={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </section>
  );
}
