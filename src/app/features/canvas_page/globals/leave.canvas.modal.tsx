'use client';

import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import { AnimatePresence, motion } from 'framer-motion';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

interface LeaveCanvasModalProps {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
}

/**
 * Confirms before leaving the canvas — going back discards resume + Denise state.
 */
export default function LeaveCanvasModal({
  isOpen,
  onStay,
  onLeave,
}: LeaveCanvasModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 z-[200] flex items-center justify-center p-4 ${poppins.variable} ${futuraDisplay.variable}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-label="Stay on canvas"
            className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-[3px]"
            onClick={onStay}
          />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="leave-canvas-title"
            aria-describedby="leave-canvas-desc"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="relative z-10 w-full max-w-md rounded-[24px] border-2 border-white p-6 shadow-2xl sm:p-8"
            style={{ backgroundColor: '#17171a' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="leave-canvas-title"
              className="mb-3 text-2xl font-bold text-white"
              style={{ fontFamily: 'var(--font-futura-display), sans-serif' }}
            >
              Wait!
            </h2>
            <p
              id="leave-canvas-desc"
              className="mb-7 text-sm leading-relaxed text-white/75"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              If you go back, the current changes on your resume will be
              discarded — including your chat with Denise.
            </p>

            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onStay}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-white/80 transition-all hover:bg-white/10 active:scale-[0.98]"
                style={{
                  fontFamily: 'var(--font-poppins)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                Stay on canvas
              </button>
              <button
                type="button"
                onClick={onLeave}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                Discard & go back
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
