/**
 * canvas.persistence.ts
 *
 * Handles saving and loading canvas state to/from localStorage.
 * All canvas elements (text, icons, dividers, shapes, pen strokes, groups)
 * persist across page refreshes and browser sessions.
 *
 * Only cleared when user explicitly selects "Start from Scratch" template.
 */

import type { TextElement } from '../context/TextContext';
import type { IconElement } from '../context/IconContext';
import type { DividerElement } from '../context/DividerContext';
import type { PenStroke } from '../context/PenContext';
import type { GroupElement } from '../context/GroupContext';
import { clearDeniseState } from './denise.persistence';

const STORAGE_KEY = 'roastmyresume_canvas_state';
const VERSION = 1; // Increment this if the data structure changes

export interface CanvasState {
  version: number;
  timestamp: number;
  textElements: TextElement[];
  iconElements: IconElement[];
  dividerElements: DividerElement[];
  penStrokes: PenStroke[];
  groupElements: GroupElement[];
}

function positionKey(content: string, x: number, y: number, width: number) {
  return `${content}|${Math.round(x)}|${Math.round(y)}|${Math.round(width)}`;
}

/**
 * Remove duplicate live elements left over from older bugs (e.g. grouping
 * only deleting one member, or append-on-load hydration).
 * Also drops live elements that are already rendered inside a group.
 */
export function sanitizeCanvasState(state: CanvasState): CanvasState {
  const groupedTextIds = new Set(
    state.groupElements.flatMap((g) => g.members.texts.map((t) => t.id)),
  );
  const groupedIconIds = new Set(
    state.groupElements.flatMap((g) => g.members.icons.map((i) => i.id)),
  );
  const groupedDividerIds = new Set(
    state.groupElements.flatMap((g) => g.members.dividers.map((d) => d.id)),
  );
  const groupedStrokeIds = new Set(
    state.groupElements.flatMap((g) => g.members.strokes.map((s) => s.id)),
  );

  const seenText = new Set<string>();
  const textElements = state.textElements.filter((el) => {
    if (groupedTextIds.has(el.id)) return false;
    const idKey = `id:${el.id}`;
    const posKey = positionKey(el.content, el.x, el.y, el.width);
    if (seenText.has(idKey) || seenText.has(posKey)) return false;
    seenText.add(idKey);
    seenText.add(posKey);
    return true;
  });

  const seenIcon = new Set<string>();
  const iconElements = state.iconElements.filter((el) => {
    if (groupedIconIds.has(el.id)) return false;
    const idKey = `id:${el.id}`;
    const posKey = positionKey(el.svgUrl, el.x, el.y, el.width ?? el.size);
    if (seenIcon.has(idKey) || seenIcon.has(posKey)) return false;
    seenIcon.add(idKey);
    seenIcon.add(posKey);
    return true;
  });

  const seenDivider = new Set<string>();
  const dividerElements = state.dividerElements.filter((el) => {
    if (groupedDividerIds.has(el.id)) return false;
    const idKey = `id:${el.id}`;
    const posKey = positionKey('', el.x, el.y, el.width);
    if (seenDivider.has(idKey) || seenDivider.has(posKey)) return false;
    seenDivider.add(idKey);
    seenDivider.add(posKey);
    return true;
  });

  const seenStroke = new Set<string>();
  const penStrokes = state.penStrokes.filter((el) => {
    if (groupedStrokeIds.has(el.id)) return false;
    const idKey = `id:${el.id}`;
    if (seenStroke.has(idKey)) return false;
    seenStroke.add(idKey);
    return true;
  });

  const seenGroup = new Set<string>();
  const groupElements = state.groupElements.filter((el) => {
    if (seenGroup.has(el.id)) return false;
    seenGroup.add(el.id);
    return true;
  });

  return {
    ...state,
    textElements,
    iconElements,
    dividerElements,
    penStrokes,
    groupElements,
  };
}

/**
 * Save the current canvas state to localStorage
 */
export function saveCanvasState(state: Omit<CanvasState, 'version' | 'timestamp'>) {
  try {
    const data: CanvasState = sanitizeCanvasState({
      version: VERSION,
      timestamp: Date.now(),
      ...state,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save canvas state:', error);
  }
}

/**
 * Load the canvas state from localStorage
 * Returns null if no saved state exists or if data is invalid
 */
export function loadCanvasState(): CanvasState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored) as CanvasState;

    // Validate version
    if (data.version !== VERSION) {
      console.warn('Canvas state version mismatch, clearing old data');
      clearCanvasState();
      return null;
    }

    const sanitized = sanitizeCanvasState(data);
    // Persist cleanup so refresh doesn't keep resurrecting duplicates
    if (
      sanitized.textElements.length !== data.textElements.length ||
      sanitized.iconElements.length !== data.iconElements.length ||
      sanitized.dividerElements.length !== data.dividerElements.length ||
      sanitized.penStrokes.length !== data.penStrokes.length ||
      sanitized.groupElements.length !== data.groupElements.length
    ) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...sanitized,
        timestamp: Date.now(),
      }));
    }

    return sanitized;
  } catch (error) {
    console.error('Failed to load canvas state:', error);
    return null;
  }
}

/**
 * Clear all saved canvas state
 * Called when user selects "Start from Scratch"
 */
export function clearCanvasState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear canvas state:', error);
  }
  // Denise chat + analysis belong to this document — wipe with scratch start
  clearDeniseState();
}

/**
 * Check if there is saved canvas state
 */
export function hasSavedState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Debounce helper for auto-saving
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
