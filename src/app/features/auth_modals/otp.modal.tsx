'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import { getClientFirestore } from '@/app/core/services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { setAuthUser } from '@/app/core/services/auth.state';

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

export interface OtpModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onVerified?: () => void;
  denisePosition?: 'left' | 'right';
}

type OtpStep = 'sending' | 'verify' | 'verified';

// Simple, crisp sending email animation using SVG & Framer Motion
function SendingEmailAnimation() {
  return (
    <div className="relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] flex items-center justify-center my-5 sm:my-7">
      {/* Outer sending radio wave ripples */}
      <motion.div
        animate={{
          scale: [0.9, 1.4, 1.8],
          opacity: [0.7, 0.25, 0],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-white/30"
      />
      <motion.div
        animate={{
          scale: [0.9, 1.5, 2.0],
          opacity: [0.5, 0.15, 0],
        }}
        transition={{
          duration: 2.4,
          delay: 0.7,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border border-white/20"
      />

      {/* Floating Mail Envelope with Letter and Paper Plane */}
      <motion.div
        animate={{
          y: [-4, 4, -4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative z-10 flex items-center justify-center"
      >
        <svg
          width="130"
          height="105"
          viewBox="0 0 130 105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Envelope Body */}
          <rect
            x="12"
            y="26"
            width="106"
            height="70"
            rx="14"
            fill="#17171a"
            stroke="#ffffff"
            strokeWidth="3.5"
          />

          {/* Envelope Bottom Fold Lines */}
          <path
            d="M13 94L50 56"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M117 94L80 56"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Letter sliding out of envelope */}
          <motion.g
            animate={{
              y: [0, -16, 0],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <rect
              x="26"
              y="16"
              width="78"
              height="48"
              rx="8"
              fill="#ffffff"
            />
            {/* Horizontal letter lines */}
            <line x1="38" y1="28" x2="92" y2="28" stroke="#17171a" strokeWidth="3" strokeLinecap="round" />
            <line x1="38" y1="37" x2="78" y2="37" stroke="#17171a" strokeWidth="3" strokeLinecap="round" />
            <line x1="38" y1="46" x2="62" y2="46" stroke="#17171a" strokeWidth="3" strokeLinecap="round" />
          </motion.g>

          {/* Envelope Open Flap V-Line */}
          <path
            d="M14 28L65 65L116 28"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Dynamic Paper Airplane Taking Flight */}
        <motion.div
          animate={{
            x: [-8, 16, -8],
            y: [8, -18, 8],
            rotate: [15, 30, 15],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -right-4 -top-6 drop-shadow-[0_4px_12px_rgba(255,255,255,0.3)]"
        >
          <svg
            width="46"
            height="46"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 11L21 2L13 21L10 13L3 11Z"
              fill="#ffffff"
              stroke="#17171a"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function OtpModal({
  isOpen,
  email,
  onClose,
  onVerified,
  denisePosition = 'right',
}: OtpModalProps) {
  const [step, setStep] = useState<OtpStep>('sending');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Send OTP when modal opens in 'sending' state
  useEffect(() => {
    let isMounted = true;

    if (isOpen && email) {
      setStep('sending');
      setDigits(['', '', '', '', '', '']);
      setErrorMessage(null);

      const sendInitialOtp = async () => {
        const startTime = Date.now();
        try {
          const res = await fetch('/api/otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send', email }),
          });
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Failed to send verification code');
          }

          // Smooth animation duration before transitioning to verify stage
          const elapsed = Date.now() - startTime;
          const delay = Math.max(0, 1800 - elapsed);

          setTimeout(() => {
            if (isMounted) {
              setStep('verify');
              setResendCooldown(30);
            }
          }, delay);
        } catch (err: unknown) {
          console.error('Error sending OTP:', err);
          const msg = err instanceof Error ? err.message : 'Failed to send OTP';
          if (isMounted) {
            setErrorMessage(msg);
            setStep('verify');
          }
        }
      };

      sendInitialOtp();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, email]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-focus first input when entering verify step
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Handle Digit Change
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    // If multiple characters pasted into single field
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();

      if (pasted.length === 6) {
        verifyCode(pasted.join(''));
      }
      return;
    }

    newDigits[index] = value;
    setDigits(newDigits);
    setErrorMessage(null);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are filled
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && newDigits.every((d) => d !== '')) {
      verifyCode(fullCode);
    }
  };

  // Handle Key Down (Backspace, Arrow keys)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);
    const focusTarget = Math.min(pastedData.length, 5);
    inputRefs.current[focusTarget]?.focus();

    if (pastedData.length === 6) {
      verifyCode(pastedData);
    }
  };

  // Verify Code API Call
  const verifyCode = async (rawCode?: string) => {
    if (isLoading) return;
    const code = (rawCode || digits.join('')).trim();

    if (code.length < 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      const emptyIdx = digits.findIndex((d) => !d);
      if (emptyIdx !== -1) inputRefs.current[emptyIdx]?.focus();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          email,
          otp: code,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed. Please try again.');
      }

      // Record to Firestore using firebase.ts client SDK
      try {
        const db = getClientFirestore();
        await setDoc(
          doc(db, 'users', email.toLowerCase()),
          {
            email: email.toLowerCase(),
            verified: true,
            verifiedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            provider: 'email',
          },
          { merge: true }
        );
      } catch (firestoreErr) {
        console.warn('Firestore write warning:', firestoreErr);
      }

      // Set authenticated user globally
      setAuthUser({ email: email.trim().toLowerCase() });

      setStep('verified');

      setTimeout(() => {
        if (onVerified) onVerified();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error('Verification error:', err);
      const msg = err instanceof Error ? err.message : 'Invalid code';
      setErrorMessage(msg);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend', email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      setResendCooldown(30);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      console.error('Resend error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to resend code';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 ${poppins.variable} ${futuraDisplay.variable}`}
      role="dialog"
      aria-modal="true"
      aria-label="Email Verification"
      style={{ fontFamily: 'var(--font-poppins)' }}
    >
      {/* Dimmed backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/75 backdrop-blur-[3px]"
      />

      {/* Modal Card with spring pop-up */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 16 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 26,
          mass: 0.85,
        }}
        className="relative z-10 flex w-full max-w-4xl lg:max-w-[940px] flex-col items-center justify-center overflow-hidden rounded-[32px] border-2 border-white p-6 sm:p-10 lg:p-12 shadow-2xl"
        style={{
          backgroundColor: '#17171a',
          minHeight: 'min(580px, 88vh)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white focus:outline-none z-20"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <AnimatePresence mode="wait">
          {/* 1. SENDING OTP STAGE */}
          {step === 'sending' && (
            <motion.div
              key="sending-stage"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center justify-center text-center py-6 sm:py-8"
            >
              {/* Header: Sending OTP in Futura Display font */}
              <h2
                className="text-white text-5xl sm:text-6xl lg:text-[72px] font-extrabold tracking-wide text-center"
                style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
              >
                Sending OTP
              </h2>

              {/* Simple Vector Sending Email Animation */}
              <SendingEmailAnimation />

              {/* Bottom Notice: Kindly check your email user@email.com for the OTP */}
              <p
                className="text-white text-base sm:text-lg lg:text-xl font-bold tracking-wide max-w-lg px-4"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                Kindly check your email {email} for the OTP
              </p>
            </motion.div>
          )}

          {/* 2. VERIFY OTP STAGE */}
          {step === 'verify' && (
            <motion.div
              key="verify-stage"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-full text-white"
            >
              <div
                className={`flex flex-col ${
                  denisePosition === 'right' ? 'md:flex-row' : 'md:flex-row-reverse'
                } items-center justify-between gap-8 md:gap-12 lg:gap-16`}
              >
                {/* Form Column */}
                <div className="flex-1 w-full max-w-[440px] sm:max-w-[480px] flex flex-col items-center">
                  {/* Header: Verify OTP in Futura Display font */}
                  <h2
                    className="text-white text-5xl sm:text-6xl lg:text-[68px] font-extrabold tracking-wide text-center mb-3"
                    style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
                  >
                    Verify OTP
                  </h2>

                  {/* Subtext: Kindly check your email \n user@email.com for the OTP */}
                  <p
                    className="text-white text-base sm:text-lg font-bold tracking-wide text-center mb-6 px-2 leading-snug"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    Kindly check your email
                    <br />
                    {email} for the OTP
                  </p>

                  {/* 6 OTP Input Boxes */}
                  <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 mb-4 w-full" onPaste={handlePaste}>
                    {digits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className={`w-12 h-16 sm:w-14 sm:h-[72px] rounded-2xl border-2 text-center text-2xl sm:text-3xl font-bold text-white bg-[#17171a] outline-none transition-all duration-200 ${
                          digit
                            ? 'border-white bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                            : 'border-white/70 hover:border-white focus:border-white focus:ring-2 focus:ring-white/30'
                        }`}
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      />
                    ))}
                  </div>

                  {/* Error / Status Message */}
                  {errorMessage && (
                    <p className="text-red-400 text-xs sm:text-sm font-medium mb-3 text-center">
                      {errorMessage}
                    </p>
                  )}

                  {/* Note: the OTP expires in 10 Minutes */}
                  <p
                    className="text-white text-xs sm:text-sm font-semibold text-center mb-5"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    Note: the OTP expires in 10 Minutes
                  </p>

                  {/* Action 1: Primary "Verify OTP" Button — ALWAYS active and white */}
                  <button
                    type="button"
                    onClick={() => verifyCode()}
                    className="w-full sm:w-[340px] h-[54px] sm:h-[58px] rounded-full bg-white text-black font-bold text-base sm:text-lg hover:bg-neutral-100 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mb-3"
                    style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
                  >
                    {isLoading ? (
                      <span className="inline-block animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
                    ) : (
                      <span>Verify OTP</span>
                    )}
                  </button>

                  {/* Action 2: Secondary "Didn't receive it? Resend" Button */}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isLoading}
                    className="w-full sm:w-[340px] h-[46px] sm:h-[50px] rounded-full border-2 border-white/50 hover:border-white text-white font-semibold text-sm sm:text-base hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    {resendCooldown > 0 ? (
                      <span>Resend code in {resendCooldown}s</span>
                    ) : (
                      <span>Didn’t receive it? Resend</span>
                    )}
                  </button>

                  {/* Action 3: Back / edit email option */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3.5 text-xs sm:text-sm text-white/60 hover:text-white underline transition-colors"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    Wrong email? Edit email
                  </button>
                </div>

                {/* Denise Column with Calculator (Right side by default per user request) */}
                <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-[46%] max-w-[390px]">
                  <div className="relative w-[280px] h-[300px] sm:w-[320px] sm:h-[350px] lg:w-[360px] lg:h-[390px]">
                    <Image
                      src="/assets/images/denise_otp.png"
                      alt="Denise HR calculating OTP"
                      fill
                      priority
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. VERIFIED SUCCESS CELEBRATION */}
          {step === 'verified' && (
            <motion.div
              key="verified-stage"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center justify-center text-center py-10"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white flex items-center justify-center text-black mb-6 shadow-2xl">
                <svg className="w-10 h-10 sm:w-12 sm:h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <h2
                className="text-white text-4xl sm:text-5xl font-extrabold tracking-wide mb-3"
                style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
              >
                Account Verified!
              </h2>

              <p
                className="text-white/80 text-base sm:text-lg font-normal"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                Welcome to RoastMyResume. Setting up your workspace...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
