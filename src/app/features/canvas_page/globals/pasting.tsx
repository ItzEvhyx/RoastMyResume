'use client';

/**
 * ClipboardProvider — global canvas copy/paste
 *
 * Intercepts Ctrl/Cmd + C, V, D while a canvas element is selected and
 * duplicates it with all styling properties intact.
 *
 * Architecture:
 *  - ClipboardProvider wraps the canvas page and listens for keyboard events.
 *  - It reads the currently-selected element from each registered element context.
 *  - A serialised snapshot (ClipboardEntry) is stored in React state (in-memory).
 *  - On paste/duplicate it creates a new element offset by 16px so it is
 *    immediately visible next to the original.
 *
 * Extending to other element types:
 *  - Register a new "clipboard source" via useClipboardRegistry hook.
 *  - Each source provides: { selectedElement, onPaste(entry, x, y) }
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';

// ---------------------------------------------------------------------------
// Clipboard entry — a generic serialisable snapshot of any canvas element
// ---------------------------------------------------------------------------
export interface ClipboardEntry {
  type: 'text' | string; // extensible
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Registry interface — each element type registers its handlers here
// ---------------------------------------------------------------------------
export interface ClipboardSource {
  /** Return the current clipboard entry if this source has a selected element */
  getCurrent: () => ClipboardEntry | null;
  /** Create a new element from the entry, offset by (dx, dy) */
  paste: (entry: ClipboardEntry, dx: number, dy: number) => void;
}

interface ClipboardContextType {
  /** Current clipboard snapshot (null = nothing copied) */
  clipboard: ClipboardEntry | null;
  /** Register an element-type source */
  register: (key: string, source: ClipboardSource) => void;
  /** Unregister */
  unregister: (key: string) => void;
  /** Manually copy (called by external buttons etc.) */
  copy: () => void;
  /** Manually paste */
  paste: () => void;
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function ClipboardProvider({ children }: { children: ReactNode }) {
  const [clipboard, setClipboard] = useState<ClipboardEntry | null>(null);
  const sourcesRef = useRef<Map<string, ClipboardSource>>(new Map());

  const register = useCallback((key: string, source: ClipboardSource) => {
    sourcesRef.current.set(key, source);
  }, []);

  const unregister = useCallback((key: string) => {
    sourcesRef.current.delete(key);
  }, []);

  // Find the first source that has a selected element and copy it
  const copy = useCallback(() => {
    for (const source of sourcesRef.current.values()) {
      const entry = source.getCurrent();
      if (entry) {
        setClipboard(entry);
        return;
      }
    }
  }, []);

  // Paste to the matching registered source
  const paste = useCallback(() => {
    if (!clipboard) return;
    const source = sourcesRef.current.get(clipboard.type);
    if (source) {
      source.paste(clipboard, 16, 16);
    }
  }, [clipboard]);

  // ---------------------------------------------------------------------------
  // Global keyboard handler
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;

      // Do NOT intercept when focus is on a text input / textarea
      const active = document.activeElement;
      const isEditing =
        active instanceof HTMLElement &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.isContentEditable);

      if (e.key === 'c' && !isEditing) {
        copy();
        // Don't preventDefault — allow system clipboard copy too
      }

      if (e.key === 'v' && !isEditing) {
        e.preventDefault();
        paste();
      }

      // Ctrl+D = duplicate in place (copy + paste immediately)
      if (e.key === 'd') {
        e.preventDefault();
        if (!isEditing) {
          // Copy fresh then paste
          let latestEntry: ClipboardEntry | null = null;
          for (const source of sourcesRef.current.values()) {
            const entry = source.getCurrent();
            if (entry) { latestEntry = entry; break; }
          }
          if (latestEntry) {
            setClipboard(latestEntry);
            const source = sourcesRef.current.get(latestEntry.type);
            if (source) source.paste(latestEntry, 16, 16);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copy, paste]);

  return (
    <ClipboardContext.Provider value={{ clipboard, register, unregister, copy, paste }}>
      {children}
    </ClipboardContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook for consumers
// ---------------------------------------------------------------------------
export function useClipboard() {
  const ctx = useContext(ClipboardContext);
  if (!ctx) throw new Error('useClipboard must be used within a ClipboardProvider');
  return ctx;
}
