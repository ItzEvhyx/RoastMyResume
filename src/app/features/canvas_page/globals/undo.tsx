'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef } from 'react';

type UndoAction = () => void;

interface UndoContextType {
  record: (action: UndoAction) => void;
  undo: () => void;
}

const UndoContext = createContext<UndoContextType | undefined>(undefined);
const HISTORY_LIMIT = 100;

export function UndoProvider({ children }: { children: ReactNode }) {
  const historyRef = useRef<UndoAction[]>([]);

  const record = useCallback((action: UndoAction) => {
    historyRef.current.push(action);
    if (historyRef.current.length > HISTORY_LIMIT) historyRef.current.shift();
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

  return <UndoContext.Provider value={{ record, undo }}>{children}</UndoContext.Provider>;
}

export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) throw new Error('useUndo must be used within an UndoProvider');
  return context;
}
