'use client';

/**
 * Redo functionality
 * 
 * This file exports the redo hook that works with the undo system.
 * Redo restores actions that were previously undone.
 * 
 * Keyboard shortcut: Ctrl+Y (or Ctrl+Shift+Z on some systems)
 * 
 * Usage:
 *   const { redo } = useRedo();
 *   redo(); // Redoes the last undone action
 * 
 * How it works:
 * 1. When you perform an action, it's recorded with both undo and redo callbacks
 * 2. When you press Ctrl+Z (undo), the undo callback runs and the entry moves to the redo stack
 * 3. When you press Ctrl+Y (redo), the redo callback runs and the entry moves back to the undo stack
 * 4. If you make a new change after undoing, the redo stack is cleared (standard behavior)
 */

import { useUndo } from './undo';

export function useRedo() {
  const { redo } = useUndo();
  return { redo };
}
