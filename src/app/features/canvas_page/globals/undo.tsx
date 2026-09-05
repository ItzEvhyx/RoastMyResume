'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef } from 'react';

type UndoAction = () => void;

interface UndoContextType {
  record: (action: UndoAction) => void;
  undo: () => void;
  /** Begin a transaction that batches multiple updates into a single undo action */
  startTransaction: () => void;
  /** Commit the transaction - records the first snapshot as the undo action */
  commitTransaction: () => void;
  /** Cancel the transaction without recording anything */
  cancelTransaction: () => void;
}

const UndoContext = createContext<UndoContextType | undefined>(undefined);
const HISTORY_LIMIT = 100;

export function UndoProvider({ children }: { children: ReactNode }) {
  const historyRef = useRef<UndoAction[]>([]);
  const pendingActionRef = useRef<UndoAction | null>(null);
  const inTransactionRef = useRef(false);

  const record = useCallback((action: UndoAction) => {
    // If we're in a transaction, only store the first action (the "before" state)
    if (inTransactionRef.current) {
      if (!pendingActionRef.current) {
        pendingActionRef.current = action;
      }
      return;
    }
    
    // Normal recording outside of transactions
    historyRef.current.push(action);
    if (historyRef.current.length > HISTORY_LIMIT) historyRef.current.shift();
  }, []);

  const startTransaction = useCallback(() => {
    inTransactionRef.current = true;
    pendingActionRef.current = null;
  }, []);

  const commitTransaction = useCallback(() => {
    if (pendingActionRef.current) {
      historyRef.current.push(pendingActionRef.current);
      if (historyRef.current.length > HISTORY_LIMIT) historyRef.current.shift();
    }
    inTransactionRef.current = false;
    pendingActionRef.current = null;
  }, []);

  const cancelTransaction = useCallback(() => {
    inTransactionRef.current = false;
    pendingActionRef.current = null;
  }, []);

  const undo = useCallback(() => {
    historyRef.current.pop()?.();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.key.toLowerCase() !== 'z') return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      event.preventDefault();
      undo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <UndoContext.Provider value={{ record, undo, startTransaction, commitTransaction, cancelTransaction }}>
      {children}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) throw new Error('useUndo must be used within an UndoProvider');
  return context;
}
