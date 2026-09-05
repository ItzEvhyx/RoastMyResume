'use client';

import { useUndo } from './undo';

/**
 * Hook to access the redo function from the undo context.
 * This is a convenience export for components that need redo functionality.
 */
export function useRedo() {
  const { redo } = useUndo();
  return { redo };
}
