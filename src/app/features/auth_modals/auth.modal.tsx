'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import { SignInForm } from './sign.in';
import { SignUpForm } from './sign.up';
import Terms from '../legal_terms/terms';
import PrivacyPolicy from '../legal_terms/privacy.policy';
import OtpModal from './otp.modal';

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

// Global external store for controlling auth modal across components
let isGlobalOpen = false;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function openAuthModal(): void {
  if (isGlobalOpen) return;
  isGlobalOpen = true;
  emitChange();
}

export function closeAuthModal(): void {
  if (!isGlobalOpen) return;
  isGlobalOpen = false;
  emitChange();
}

export function useAuthModalOpen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => isGlobalOpen,
    () => false
  );
}

export type AuthModalView = 'signin' | 'signup' | 'terms' | 'privacy';

export interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: 'signin' | 'signup';
  children?: React.ReactNode;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export default function AuthModal({
  isOpen: externalIsOpen,
  onClose,
  initialMode = 'signin',
  children,
}: AuthModalProps) {
  const storeOpen = useAuthModalOpen();
  const isControlled = externalIsOpen !== undefined;
  const open = isControlled ? externalIsOpen : storeOpen;

  const [view, setView] = useState<AuthModalView>(initialMode);
  const [direction, setDirection] = useState<number>(1); // 1 = slide in from right, -1 = slide in from left

  // Retain sign-up form info across legal terms navigation
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // OTP Verification Modal State
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    closeAuthModal();
  };

  // Reset view to initialMode when modal opens
  useEffect(() => {
    if (open) {
      setView(initialMode);
      setDirection(1);
    }
  }, [open, initialMode]);

  // Handle escape key and scroll lock
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <AnimatePresence mode="wait">
        {open && !isOtpOpen && (
          <div
            key="auth-modal-root"
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 ${poppins.variable} ${futuraDisplay.variable}`}
            role="dialog"
            aria-modal="true"
            aria-label="Authentication"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            {/* Dimmed backdrop with smooth fade in / fade out */}
            <motion.div
              key="auth-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={handleClose}
              className="absolute inset-0 h-full w-full cursor-default bg-black/75 backdrop-blur-[3px]"
            />

            {/* Modal card with tactile spring pop-up animation */}
            <motion.div
              key="auth-modal-card"
              initial={{ opacity: 0, scale: 0.78, y: 28 }}
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
                minHeight: 'min(620px, 90vh)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
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

            {/* Custom Children or Dual Auth Forms */}
            {children ? (
              <div className="w-full flex-1 flex flex-col items-center justify-center">
                {children}
              </div>
            ) : (
              <div className="w-full text-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 lg:gap-16">
                  {/* Left column: Denise illustration + Futura copy (remains constant) */}
                  <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-[46%] max-w-[370px]">
                    <div className="relative w-[260px] h-[300px] sm:w-[300px] sm:h-[350px] lg:w-[320px] lg:h-[370px]">
                      <Image
                        src="/assets/images/denise_auth.png"
                        alt="Denise HR thumbs up"
                        fill
                        priority
                        className="object-contain"
                      />
                    </div>
                    <div className="mt-4 sm:mt-5 text-center">
                      <p
                        className="text-white text-2xl sm:text-3xl lg:text-[32px] leading-[1.08] tracking-wide text-center"
                        style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
                      >
                        Takes 20 seconds.
                        <br />
                        No credit card, no
                        <br />
                        fluff.
                      </p>
                    </div>
                  </div>

                  {/* Right column: Auth forms & Legal pages with sliding transition */}
                  <div className="flex-1 w-full max-w-[420px] sm:max-w-[470px] flex flex-col items-center overflow-hidden pt-2 pb-1">
                    <AnimatePresence mode="wait" custom={direction} initial={false}>
                      <motion.div
                        key={view}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full flex flex-col items-center"
                      >
                        {view === 'signin' && (
                          <SignInForm
                            onSuccess={handleClose}
                            onSwitchToSignUp={() => {
                              setDirection(1);
                              setView('signup');
                            }}
                          />
                        )}

                        {view === 'signup' && (
                          <SignUpForm
                            email={signUpEmail}
                            setEmail={setSignUpEmail}
                            password={signUpPassword}
                            setPassword={setSignUpPassword}
                            onSuccess={handleClose}
                            onSignUpSubmit={(emailToVerify) => {
                              setOtpEmail(emailToVerify);
                              setIsOtpOpen(true);
                            }}
                            onSwitchToSignIn={() => {
                              setDirection(-1);
                              setView('signin');
                            }}
                            onTermsClick={() => {
                              setDirection(1);
                              setView('terms');
                            }}
                            onPrivacyClick={() => {
                              setDirection(1);
                              setView('privacy');
                            }}
                          />
                        )}

                        {view === 'terms' && (
                          <Terms
                            accepted={termsAccepted}
                            onAcceptChange={setTermsAccepted}
                            onBack={() => {
                              setDirection(-1);
                              setView('signup');
                            }}
                          />
                        )}

                        {view === 'privacy' && (
                          <PrivacyPolicy
                            accepted={privacyAccepted}
                            onAcceptChange={setPrivacyAccepted}
                            onBack={() => {
                              setDirection(-1);
                              setView('signup');
                            }}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OTP Verification Modal (Sending OTP & Verify OTP stages) */}
      <OtpModal
        key="auth-otp-modal"
        isOpen={isOtpOpen}
        email={otpEmail}
        onClose={() => setIsOtpOpen(false)}
        onVerified={() => {
          setIsOtpOpen(false);
          handleClose();
        }}
      />
    </>
  );
}
