'use client';

import { motion, AnimatePresence } from 'framer-motion';

const SCAN_DURATION_S = 1.35;

interface ScanAnimationProps {
  active: boolean;
}

/**
 * Dramatic full-bleed scan overlay. Loops top→bottom for as long as `active`
 * stays true (until Denise finishes thinking).
 */
export default function ScanAnimation({ active }: ScanAnimationProps) {
  return (
    <AnimatePresence>
      {active && (
        <div
          data-no-export="true"
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 300000,
          }}
        >
          {/* Darken the page while scanning */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at center, rgba(8,12,24,0.08) 0%, rgba(8,12,24,0.35) 100%)',
            }}
          />

          {/* Pulsing edge glow */}
          <motion.div
            animate={{ opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              boxShadow: 'inset 0 0 80px 20px rgba(80,160,255,0.22)',
            }}
          />

          {/* Repeating scan sweep */}
          <motion.div
            initial={{ top: '-12%' }}
            animate={{ top: ['-12%', '112%'] }}
            transition={{
              duration: SCAN_DURATION_S,
              ease: [0.45, 0, 0.25, 1],
              repeat: Infinity,
              repeatType: 'loop',
            }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '22%',
              transform: 'translateY(-50%)',
            }}
          >
            {/* Wide shimmer wake */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: '45%',
                height: '160%',
                background:
                  'linear-gradient(180deg, transparent 0%, rgba(120,190,255,0.05) 35%, rgba(140,200,255,0.28) 78%, rgba(220,240,255,0.55) 100%)',
              }}
            />

            {/* Secondary streak */}
            <div
              style={{
                position: 'absolute',
                left: '4%',
                right: '4%',
                top: '42%',
                height: 10,
                borderRadius: 8,
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(100,180,255,0.35) 25%, rgba(180,220,255,0.55) 50%, rgba(100,180,255,0.35) 75%, transparent 100%)',
                filter: 'blur(4px)',
              }}
            />

            {/* Hot scan line */}
            <div
              style={{
                position: 'absolute',
                left: '1%',
                right: '1%',
                top: '50%',
                height: 4,
                borderRadius: 3,
                background:
                  'linear-gradient(90deg, transparent 0%, #fff 12%, #c8e4ff 45%, #fff 55%, #c8e4ff 88%, transparent 100%)',
                boxShadow:
                  '0 0 16px 4px rgba(160,210,255,0.85), 0 0 40px 10px rgba(80,150,255,0.45), 0 0 70px 18px rgba(40,100,220,0.25)',
              }}
            />
          </motion.div>

          {/* Horizontal noise bands for drama */}
          <motion.div
            animate={{ opacity: [0.04, 0.12, 0.04] }}
            transition={{ duration: 0.18, repeat: Infinity }}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 3px)',
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
