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
  src: '../../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

interface SwapLayoutModalProps {
  isOpen: boolean;
  templateName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Confirms replacing the current canvas with a different template. */
export default function SwapLayoutModal({
  isOpen,
  templateName,
  onCancel,
  onConfirm,
}: SwapLayoutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`absolute inset-0 z-[80] flex items-center justify-center p-4 ${poppins.variable} ${futuraDisplay.variable}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-label="Cancel template swap"
            className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-[2px]"
            onClick={onCancel}
          />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="swap-layout-title"
            aria-describedby="swap-layout-desc"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="relative z-10 w-full max-w-sm rounded-[24px] border-2 border-white p-6 shadow-2xl"
            style={{ backgroundColor: '#17171a' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="swap-layout-title"
              className="mb-3 text-2xl font-bold text-white"
              style={{ fontFamily: 'var(--font-futura-display), sans-serif' }}
            >
              Switch template?
            </h2>
            <p
              id="swap-layout-desc"
              className="mb-7 text-sm leading-relaxed text-white/75"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Switching to <span className="text-white">{templateName}</span>{' '}
              will replace everything on your canvas and clear your chat with
              Denise. Shared templates stay unchanged — only your copy is
              replaced.
            </p>

            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition-transform active:scale-[0.98]"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                Switch template
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
