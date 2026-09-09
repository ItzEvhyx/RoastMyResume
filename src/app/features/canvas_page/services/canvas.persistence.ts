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

/**
 * Save the current canvas state to localStorage
 */
export function saveCanvasState(state: Omit<CanvasState, 'version' | 'timestamp'>) {
  try {
    const data: CanvasState = {
      version: VERSION,
      timestamp: Date.now(),
      ...state,
    };
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

    return data;
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
