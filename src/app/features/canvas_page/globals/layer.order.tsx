'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from 'react';

export type LayerAnimType = 'inflate' | 'deflate';

export interface LayerAnimationEvent {
  id: string;
  type: LayerAnimType;
  timestamp: number;
}

interface LayerOrderContextValue {
  getNextLayer: () => number;
  holdingLayerId: string | null;
  setHoldingLayerId: (id: string | null) => void;
  activeAnimation: LayerAnimationEvent | null;
  triggerLayerAnimation: (id: string, type: LayerAnimType) => void;
}

const LayerOrderContext = createContext<LayerOrderContextValue | undefined>(undefined);

const LAYER_ANIMATION_STYLES = `
  @keyframes canvasLayerInflate {
    0% {
      transform: scale(0.92);
      filter: drop-shadow(0 0 0 transparent);
    }
    40% {
      transform: scale(1.12);
      filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.35)) drop-shadow(0 0 18px rgba(59, 130, 246, 0.6));
    }
    70% {
      transform: scale(0.98);
      filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.15));
    }
    100% {
      transform: scale(1);
      filter: none;
    }
  }

  @keyframes canvasLayerDeflate {
    0% {
      transform: scale(1.03);
      opacity: 1;
    }
    35% {
      transform: scale(0.86);
      opacity: 0.55;
      filter: brightness(0.8) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
    }
    70% {
      transform: scale(0.97);
      opacity: 0.9;
      filter: brightness(0.95);
    }
    100% {
      transform: scale(1);
      opacity: 1;
      filter: none;
    }
  }

  @keyframes panelLayerInflate {
    0% { transform: scale(0.94); }
    50% { transform: scale(1.04); background-color: rgba(59, 130, 246, 0.28); }
    100% { transform: scale(1); }
  }

  @keyframes panelLayerDeflate {
    0% { transform: scale(1.02); }
    50% { transform: scale(0.94); background-color: rgba(255, 255, 255, 0.05); }
    100% { transform: scale(1); }
  }
`;

/** Supplies shared stack order and layer reordering animations for canvas items. */
export function LayerOrderProvider({ children }: { children: ReactNode }) {
  const highestLayer = useRef(0);
  const [holdingLayerId, setHoldingLayerId] = useState<string | null>(null);
  const [activeAnimation, setActiveAnimation] = useState<LayerAnimationEvent | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getNextLayer = useCallback(() => {
    highestLayer.current += 1;
    return highestLayer.current;
  }, []);

  const triggerLayerAnimation = useCallback((id: string, type: LayerAnimType) => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setActiveAnimation({ id, type, timestamp: Date.now() });
    animTimerRef.current = setTimeout(() => {
      setActiveAnimation(null);
    }, 600);
  }, []);

  return (
    <LayerOrderContext.Provider
      value={{
        getNextLayer,
        holdingLayerId,
        setHoldingLayerId,
        activeAnimation,
        triggerLayerAnimation,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: LAYER_ANIMATION_STYLES }} />
      {children}
    </LayerOrderContext.Provider>
  );
}

export function useLayerOrder() {
  const context = useContext(LayerOrderContext);
  if (!context) throw new Error('useLayerOrder must be used within a LayerOrderProvider');
  return context;
}

/** Hook for canvas elements to apply holding deflate and drop inflate/deflate animations. */
export function useLayerElementAnimation(elementId: string) {
  const { holdingLayerId, activeAnimation } = useLayerOrder();
  const isHolding = holdingLayerId === elementId;
  const isAnimating = activeAnimation?.id === elementId;
  const animType = isAnimating ? activeAnimation.type : null;

  const animStyle: CSSProperties = {
    transformOrigin: 'center center',
    ...(isHolding
      ? {
          transform: 'scale(0.92)',
          opacity: 0.65,
          filter: 'brightness(0.9)',
          transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s ease, filter 0.2s ease',
        }
      : {}),
    ...(isAnimating && animType === 'inflate'
      ? {
          animation: 'canvasLayerInflate 0.52s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }
      : {}),
    ...(isAnimating && animType === 'deflate'
      ? {
          animation: 'canvasLayerDeflate 0.52s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        }
      : {}),
  };

  return {
    isHolding,
    isAnimating,
    animType,
    animStyle,
    animKey: activeAnimation?.id === elementId ? activeAnimation.timestamp : undefined,
  };
}
