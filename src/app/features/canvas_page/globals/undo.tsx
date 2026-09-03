'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef } from 'react';

type UndoAction = () => void;

interface UndoContextType {
  record: (undoAction: UndoAction, redoAction: UndoAction) => void;
  /** Start batching consecutive updates into a single undo action */
  startBatch: () => void;
  /** End batching and commit the batch as a single undo action */
  endBatch: () => void;
  undo: () => void;
  redo: () => void;
}

interface HistoryEntry {
  undo: UndoAction;
  redo: UndoAction;
}

const UndoContext = createContext<UndoContextType | undefined>(undefined);
const HISTORY_LIMIT = 100;
const BATCH_TIMEOUT = 300; // ms - auto-commit batch after this time of inactivity

export function UndoProvider({ children }: { children: ReactNode }) {
  const historyRef = useRef<HistoryEntry[]>([]);
  const redoStackRef = useRef<HistoryEntry[]>([]);
  const batchRef = useRef<{ firstEntry: HistoryEntry | null; isBatching: boolean }>({
    firstEntry: null,
    isBatching: false,
  });
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const endBatch = useCallback(() => {
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }

    if (batchRef.current.firstEntry) {
      historyRef.current.push(batchRef.current.firstEntry);
      if (historyRef.current.length > HISTORY_LIMIT) historyRef.current.shift();
    }

    batchRef.current.isBatching = false;
    batchRef.current.firstEntry = null;
  }, []);

  const record = useCallback((undoAction: UndoAction, redoAction: UndoAction) => {
    // Clear redo stack when new action is recorded
    redoStackRef.current = [];

    const entry: HistoryEntry = { undo: undoAction, redo: redoAction };

    // If we're in a batch, only keep the first entry (which restores to the original state)
    if (batchRef.current.isBatching) {
      if (!batchRef.current.firstEntry) {
        batchRef.current.firstEntry = entry;
      }
      // Reset the batch timer on each update to auto-commit after inactivity
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
      batchTimerRef.current = setTimeout(() => {
        endBatch();
      }, BATCH_TIMEOUT);
      return;
    }

    // Normal recording (not batching)
    historyRef.current.push(entry);
    if (historyRef.current.length > HISTORY_LIMIT) historyRef.current.shift();
  }, [endBatch]);

  const startBatch = useCallback(() => {
    batchRef.current.isBatching = true;
    batchRef.current.firstEntry = null;
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
  }, []);

  const undo = useCallback(() => {
    // If there's an active batch, commit it first
    if (batchRef.current.isBatching) {
      endBatch();
    }

    const entry = historyRef.current.pop();
    if (!entry) return;

    // Execute the undo action
    entry.undo();
    
    // Move to redo stack
    redoStackRef.current.push(entry);
    if (redoStackRef.current.length > HISTORY_LIMIT) redoStackRef.current.shift();
  }, [endBatch]);

  const redo = useCallback(() => {
    // If there's an active batch, commit it first
    if (batchRef.current.isBatching) {
      endBatch();
    }

    const entry = redoStackRef.current.pop();
    if (!entry) return;

    // Execute the redo action
    entry.redo();
    
    // Add it back to history so it can be undone again
    historyRef.current.push(entry);
    if (historyRef.current.length > HISTORY_LIMIT) historyRef.current.shift();
  }, [endBatch]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      
      // Ctrl+Y or Ctrl+Shift+Z for redo
      if (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z')) {
        console.log('🔄 Redo triggered, redo stack size:', redoStackRef.current.length);
        event.preventDefault();
        redo();
        return;
      }
      
      // Ctrl+Z for undo (without shift)
      if (!event.shiftKey && event.key.toLowerCase() === 'z') {
        console.log('↩️ Undo triggered, history size:', historyRef.current.length);
        event.preventDefault();
        undo();
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    };
  }, []);

  return <UndoContext.Provider value={{ record, startBatch, endBatch, undo, redo }}>{children}</UndoContext.Provider>;
}

export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) throw new Error('useUndo must be used within an UndoProvider');
  return context;
}
