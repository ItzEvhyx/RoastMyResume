'use client';

import { AnimatePresence, motion } from 'framer-motion';

function MicIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  );
}

interface VoiceTranscribeModalProps {
  isOpen: boolean;
  onCancel: () => void;
}

/**
 * Dimmed overlay while Denise is capturing / streaming speech.
 * Input bar stays above this (higher z-index) so live text remains visible.
 */
export default function VoiceTranscribeModal({
  isOpen,
  onCancel,
}: VoiceTranscribeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center px-5 pb-32 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-label="Cancel voice input"
            className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-[2px]"
            onClick={onCancel}
          />

          <motion.div
            role="status"
            aria-live="polite"
            aria-label="Transcribing voice input"
            initial={{ opacity: 0, scale: 0.88, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="relative z-10 flex w-full max-w-[260px] flex-col items-center gap-4 rounded-[24px] border border-white/15 px-6 py-8 shadow-2xl"
            style={{ backgroundColor: '#17171a' }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: 'rgba(255, 255, 255, 0.08)' }}
              animate={{ scale: [1, 0.9, 1.08, 1] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <MicIcon size={40} />
            </motion.div>
            <p
              className="text-center text-sm font-semibold leading-snug text-white"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Transcribing voice input...
            </p>
            <p
              className="text-center text-[11px] leading-snug text-white/45"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Speak naturally — Retake to start over, or Done when finished
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
