'use client';

/**
 * globals/flip.element.tsx
 *
 * Provides:
 *   FLIP_STATES     — the 4 flip states with their CSS transform values
 *   getNextFlip()   — advances through the cycle
 *   flipToTransform() — converts a flip value to a CSS transform string
 *   FlipButton      — toolbar button that cycles through all 4 states on click
 */

import Image from 'next/image';

// ─────────────────────────────────────────────────────────────────────────────
// Flip state type — matches IconElement.flip
// ─────────────────────────────────────────────────────────────────────────────
export type FlipState = 0 | 1 | 2 | 3;

/**
 * Flip cycle:
 *   0 → normal
 *   1 → scaleX(-1)          — mirror horizontal
 *   2 → scaleX(-1) scaleY(-1) — both (≡ 180° rotation)
 *   3 → scaleY(-1)          — mirror vertical
 */
const FLIP_TRANSFORMS: Record<FlipState, string> = {
  0: 'none',
  1: 'scaleX(-1)',
  2: 'scaleX(-1) scaleY(-1)',
  3: 'scaleY(-1)',
};

const FLIP_LABELS: Record<FlipState, string> = {
  0: 'Normal',
  1: 'Flip horizontal',
  2: 'Flip both',
  3: 'Flip vertical',
};

/** Advance flip state through the 4-step cycle. */
export function getNextFlip(current: FlipState = 0): FlipState {
  return ((current + 1) % 4) as FlipState;
}

/** Convert a flip state value to the CSS transform string to apply on the element. */
export function flipToTransform(flip: FlipState = 0): string {
  return FLIP_TRANSFORMS[flip];
}

// ─────────────────────────────────────────────────────────────────────────────
// FlipButton — drop-in toolbar button
// ─────────────────────────────────────────────────────────────────────────────
interface FlipButtonProps {
  flip: FlipState;
  onFlip: () => void;
}

export function FlipButton({ flip, onFlip }: FlipButtonProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onFlip(); }}
      onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
      onPointerDown={(e) => { e.stopPropagation(); }}
      className="flex items-center justify-center rounded-lg transition-colors hover:bg-white/10 active:bg-white/20"
      style={{
        width: 48,
        height: 40,
        flexShrink: 0,
        // Subtly rotate the icon to visually hint the current flip axis
        opacity: flip === 0 ? 0.65 : 1,
      }}
      title={FLIP_LABELS[flip]}
      aria-label={FLIP_LABELS[flip]}
    >
      <Image
        src="/assets/tools_icons/flip_icon.png"
        alt="Flip"
        width={22}
        height={22}
        draggable={false}
        className="select-none pointer-events-none"
        style={{
          // Reflect the icon itself to show current state
          transform: FLIP_TRANSFORMS[flip] === 'none' ? undefined : FLIP_TRANSFORMS[flip],
          transition: 'transform 0.15s ease',
        }}
      />
    </button>
  );
}
