'use client';

import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

interface LayerOrderContextValue {
  getNextLayer: () => number;
}

const LayerOrderContext = createContext<LayerOrderContextValue | undefined>(undefined);

/** Supplies one shared, monotonically increasing stack order for canvas items. */
export function LayerOrderProvider({ children }: { children: ReactNode }) {
  const highestLayer = useRef(0);

  const getNextLayer = useCallback(() => {
    highestLayer.current += 1;
    return highestLayer.current;
  }, []);

  return <LayerOrderContext.Provider value={{ getNextLayer }}>{children}</LayerOrderContext.Provider>;
}

export function useLayerOrder() {
  const context = useContext(LayerOrderContext);
  if (!context) throw new Error('useLayerOrder must be used within a LayerOrderProvider');
  return context;
}
