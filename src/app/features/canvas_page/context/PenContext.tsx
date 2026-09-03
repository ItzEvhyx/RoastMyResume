'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useUndo } from '../globals/undo';

export interface PenStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  thickness: number;
}

interface PenContextType {
  isPenActive: boolean;
  setIsPenActive: (active: boolean) => void;
  penColor: string;
  setPenColor: (color: string) => void;
  penThickness: number;
  setPenThickness: (thickness: number) => void;
  eraserSize: number;
  setEraserSize: (size: number) => void;
  strokes: PenStroke[];
  addStroke: (stroke: PenStroke) => void;
  removeStroke: (id: string) => void;
  clearStrokes: () => void;
}

const PenContext = createContext<PenContextType | undefined>(undefined);

export function PenProvider({ children }: { children: ReactNode }) {
  const [isPenActive, setIsPenActive] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [penThickness, setPenThickness] = useState(4);
  const [eraserSize, setEraserSize] = useState(20);
  const [strokes, setStrokes] = useState<PenStroke[]>([]);
  const { record } = useUndo();

  const addStroke = (stroke: PenStroke) => {
    setStrokes(prev => [...prev, stroke]);
    
    // Record undo/redo actions
    // Undo: remove the stroke, Redo: add it back
    record(
      () => setStrokes(prev => prev.filter(s => s.id !== stroke.id)),
      () => setStrokes(prev => [...prev, stroke])
    );
  };

  const removeStroke = (id: string) => {
    const strokeToRemove = strokes.find(s => s.id === id);
    if (!strokeToRemove) return;
    
    const index = strokes.findIndex(s => s.id === id);
    setStrokes(prev => prev.filter(s => s.id !== id));
    
    // Record undo/redo actions
    // Undo: restore the stroke, Redo: remove it again
    record(
      () => setStrokes(prev => [...prev.slice(0, index), strokeToRemove, ...prev.slice(index)]),
      () => setStrokes(prev => prev.filter(s => s.id !== id))
    );
  };

  const clearStrokes = () => {
    const previousStrokes = [...strokes];
    setStrokes([]);
    
    // Record undo/redo actions
    // Undo: restore all strokes, Redo: clear them again
    record(
      () => setStrokes(previousStrokes),
      () => setStrokes([])
    );
  };

  return (
    <PenContext.Provider
      value={{
        isPenActive,
        setIsPenActive,
        penColor,
        setPenColor,
        penThickness,
        setPenThickness,
        eraserSize,
        setEraserSize,
        strokes,
        addStroke,
        removeStroke,
        clearStrokes,
      }}
    >
      {children}
    </PenContext.Provider>
  );
}

export function usePen() {
  const context = useContext(PenContext);
  if (!context) {
    throw new Error('usePen must be used within a PenProvider');
  }
  return context;
}
