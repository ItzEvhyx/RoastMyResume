'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SignIn from './sign.in';

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

export interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
}

export default function AuthModal({ isOpen: externalIsOpen, onClose, children }: AuthModalProps) {
  const storeOpen = useAuthModalOpen();
  const isControlled = externalIsOpen !== undefined;
  const open = isControlled ? externalIsOpen : storeOpen;

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    closeAuthModal();
  };

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
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Authentication"
        >
          {/* Dimmed backdrop with smooth fade in / fade out */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={handleClose}
            className="absolute inset-0 h-full w-full cursor-default bg-black/75 backdrop-blur-[3px]"
          />

          {/* Modal card with tactile spring pop-up animation */}
          <motion.div
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

            {/* Content container (hosts sign in / sign up contents layer) */}
            <div className="w-full flex-1 flex flex-col items-center justify-center">
              {children || <SignIn onSuccess={handleClose} />}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
