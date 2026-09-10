'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface CanvasContextType {
  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;
  isGrabMode: boolean;
  setIsGrabMode: (mode: boolean) => void;
  /** Form-driven editing mode — locks drag, hides tool sidebar, shows document panel. */
  isDocumentMode: boolean;
  setIsDocumentMode: (mode: boolean) => void;
  resetView: () => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isGrabMode, setIsGrabMode] = useState(false);
  const [isDocumentMode, setIsDocumentMode] = useState(false);

  const resetView = () => {
    setZoom(0.8);
    setPan({ x: 0, y: 0 });
  };

  return (
    <CanvasContext.Provider
      value={{
        zoom,
        setZoom,
        pan,
        setPan,
        isGrabMode,
        setIsGrabMode,
        isDocumentMode,
        setIsDocumentMode,
        resetView,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within CanvasProvider');
  }
  return context;
}
