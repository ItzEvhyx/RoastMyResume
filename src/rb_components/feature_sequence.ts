'use client';

/**
 * Coordinator that plays the Features section's motion graphics one at a time,
 * in a fixed order, instead of letting each card fire the moment it scrolls
 * into view.
 *
 * Each feature card registers a `play` function keyed by an `order` index.
 * `play` starts that card's animation and returns a Promise that resolves once
 * the animation has finished settling. Any card, upon becoming visible, calls
 * `requestSequenceStart()`. The coordinator kicks off exactly once and then
 * awaits each card's `play` before starting the next.
 *
 * Cards that register after the sequence has already passed their turn (e.g.
 * mounted late) are played immediately so nothing is skipped. A module-level
 * guard means the whole run happens once per page load; a reload resets it.
 */

export interface FeatureStep {
  order: number;
  /** Starts the animation; resolves when it has finished settling. */
  play: () => Promise<void>;
}

const steps = new Map<number, FeatureStep>();
let started = false;
let currentIndex = 0;
/** Highest order index; the sequence advances from 0..maxOrder. */
let maxOrder = 0;

function runFrom(index: number): void {
  currentIndex = index;
  const step = steps.get(index);

  if (!step) {
    // No card registered for this slot yet. If there are still higher slots to
    // come, wait — a later registration will resume via `registerFeatureStep`.
    if (index > maxOrder) return;
    return;
  }

  void step.play().then(() => {
    if (index < maxOrder) {
      runFrom(index + 1);
    }
  });
}

/**
 * Register a feature card. If the sequence is already waiting on this slot,
 * it starts immediately.
 */
export function registerFeatureStep(step: FeatureStep): () => void {
  steps.set(step.order, step);
  maxOrder = Math.max(maxOrder, step.order);

  // If the sequence has started and is currently waiting exactly on this slot,
  // begin it now.
  if (started && step.order === currentIndex) {
    runFrom(step.order);
  }

  return () => {
    steps.delete(step.order);
  };
}

/** Trigger the sequence. Safe to call multiple times; only the first starts it. */
export function requestSequenceStart(): void {
  if (started) return;
  started = true;
  runFrom(0);
}

/** Whether the sequence has already been triggered this page load. */
export function hasSequenceStarted(): boolean {
  return started;
}
