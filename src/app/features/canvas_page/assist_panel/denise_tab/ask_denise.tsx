'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

const PLACEHOLDER_TEXTS = [
  "How do I improve my resume?",
  "What's wrong with my work experience section?",
  "How can I make my resume stand out?",
  "Is my resume ATS-friendly?",
  "Should I include a summary statement?",
  "How do I quantify my achievements?",
  "What keywords should I use?",
  "Is my resume too long?",
  "How do I tailor my resume for this job?",
  "What's the best format for my industry?",
  "Should I include my GPA?",
  "How do I explain employment gaps?",
  "What skills should I highlight?",
  "Is my contact information correct?",
  "How do I describe my projects?",
  "Should I use bullet points or paragraphs?",
  "What font should I use?",
  "How much white space is too much?",
  "Should I include references?",
  "How do I make my resume one page?",
];

interface AskDeniseProps {
  onBack?: () => void;
}

export default function AskDenise({ onBack }: AskDeniseProps) {
  const [mode, setMode] = useState<'roast' | 'help'>('roast');
  const [inputValue, setInputValue] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showActionButtons, setShowActionButtons] = useState(false);

  // Cycle placeholder text every hour (3600000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_TEXTS.length);
    }, 3600000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    // TODO: Send message to Denise AI
    console.log('Sending message:', inputValue, 'Mode:', mode);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex h-full flex-col ${poppins.variable} ${futuraDisplay.variable}`}>
      {/* Header Section with Denise Image and Text */}
      <div className="relative flex items-start gap-4 p-6 pb-4">
        {/* Left: Denise sitting on pill container - scaled up */}
        <div className="relative flex-shrink-0" style={{ width: 160, height: 180 }}>
          <Image
            src="/assets/images/ask_denise.png"
            alt="Ask Denise"
            fill
            className="object-contain object-bottom"
            priority
          />
        </div>

        {/* Right: Text content */}
        <div className="flex flex-col justify-center flex-1 pt-2">
          <h2
            className="text-white leading-tight mb-2"
            style={{
              fontFamily: 'var(--font-futura-display), sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            }}
          >
            Ask Denise
          </h2>
          <p
            className="text-white/70 text-sm leading-snug mb-1"
            style={{
              fontFamily: 'var(--font-poppins)',
              fontWeight: 400,
            }}
          >
            Always here to guide your resume to the right direction
          </p>
          <p
            className="text-white/60 text-xs"
            style={{
              fontFamily: 'var(--font-poppins)',
              fontWeight: 700,
            }}
          >
            -Human Resources-
          </p>
        </div>
      </div>

      {/* Mode Toggle (Roast / Help me) - Centered and pushed up */}
      <div className="px-6 pb-2 flex justify-center">
        <div
          className="relative inline-flex items-center rounded-full p-1"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Sliding background indicator */}
          <div
            className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              left: mode === 'roast' ? '4px' : 'calc(50% - 4px)',
              width: 'calc(50% - 4px)',
            }}
          />

          {/* Roast button */}
          <button
            type="button"
            onClick={() => setMode('roast')}
            className={`relative z-10 px-10 py-1.5 rounded-full transition-colors duration-200 ${
              mode === 'roast' ? 'text-white' : 'text-white/50'
            }`}
            style={{
              fontFamily: 'var(--font-poppins)',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            Roast
          </button>

          {/* Help me button */}
          <button
            type="button"
            onClick={() => setMode('help')}
            className={`relative z-10 px-10 py-1.5 rounded-full transition-colors duration-200 ${
              mode === 'help' ? 'text-white' : 'text-white/50'
            }`}
            style={{
              fontFamily: 'var(--font-poppins)',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            Help me
          </button>
        </div>
      </div>

      {/* Spacer to push chat input to bottom */}
      <div className="flex-1" />

      {/* Action Buttons (shown when Denise responds) */}
      {showActionButtons && (
        <div className="px-6 pb-4 space-y-2">
          {/* Apply Denise's fixes button */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-full transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              fontFamily: 'var(--font-poppins)',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#000',
            }}
          >
            Apply Denise&rsquo;s fixes
            <svg
              width="20"
              height="20"
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

          {/* Show before and after button */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-full transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontFamily: 'var(--font-poppins)',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: '#fff',
            }}
          >
            Show before and after
            <Image
              src="/assets/icons/review_resume_icon.svg"
              alt="Review"
              width={20}
              height={20}
              className="brightness-0 invert"
            />
          </button>
        </div>
      )}

      {/* Chat Input */}
      <div className="px-6 pb-6">
        <div
          className="relative flex items-center gap-3 px-5 py-3.5 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER_TEXTS[placeholderIndex]}
            className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-sm"
            style={{
              fontFamily: 'var(--font-poppins)',
              fontWeight: 400,
            }}
          />

          {/* Microphone or Send icon */}
          {inputValue.trim() ? (
            // Send icon when user types - filled/solid
            <button
              type="button"
              onClick={handleSend}
              className="flex-shrink-0 transition-all duration-200 hover:brightness-110 active:scale-95"
              aria-label="Send message"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          ) : (
            // Microphone icon when input is empty - filled/solid
            <button
              type="button"
              className="flex-shrink-0 transition-all duration-200 hover:brightness-110 active:scale-95"
              aria-label="Voice input"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
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
