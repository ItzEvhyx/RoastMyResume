'use client';

import { useEffect, useRef } from 'react';
import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';
import { motion } from 'framer-motion';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

export interface AuthSuccessModalProps {
  isOpen: boolean;
  /** Called after the celebration holds briefly (default ~1.5s). */
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
  holdMs?: number;
}

/**
 * Post sign-up celebration — same visual language as the OTP “Account Verified!” step.
 */
export default function AuthSuccessModal({
  isOpen,
  onComplete,
  title = 'Account Created!',
  subtitle = 'Welcome to RoastMyResume. Setting up your workspace...',
  holdMs = 1600,
}: AuthSuccessModalProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      onCompleteRef.current?.();
    }, holdMs);
    return () => clearTimeout(t);
  }, [isOpen, holdMs]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 overflow-y-auto ${poppins.variable} ${futuraDisplay.variable}`}
      role="dialog"
      aria-modal="true"
      aria-label="Account created"
      style={{ fontFamily: 'var(--font-poppins)' }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 h-full w-full bg-black/75 backdrop-blur-[3px]"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.78, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 26, mass: 0.85 }}
        className="relative z-10 flex w-full max-w-lg flex-col items-center justify-center overflow-hidden rounded-[28px] sm:rounded-[32px] border-2 border-white p-6 sm:p-12 shadow-2xl"
        style={{ backgroundColor: '#17171a' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full flex flex-col items-center justify-center text-center py-6 sm:py-10"
        >
          <div className="w-14 h-14 sm:w-24 sm:h-24 rounded-full bg-white flex items-center justify-center text-black mb-4 sm:mb-6 shadow-2xl">
            <svg
              className="w-8 h-8 sm:w-12 sm:h-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h2
            className="text-white text-2xl sm:text-5xl font-extrabold tracking-wide mb-2 sm:mb-3"
            style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
          >
            {title}
          </h2>

          <p
            className="text-white/80 text-xs sm:text-lg font-normal"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            {subtitle}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
