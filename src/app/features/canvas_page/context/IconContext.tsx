'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useUndo } from '../globals/undo';

export interface IconElement {
  id: string;
  x: number;
  y: number;
  /** Uniform size used by standard icons. */
  size: number;
  /** Shapes may use independent dimensions while standard icons remain square. */
  width?: number;
  height?: number;
  isShape?: boolean;
  shapeKind?: 'square' | 'circle';
  /** Visible outline width for shapes, in canvas pixels. */
  borderWidth?: number;
  /** Outline colour for shapes; defaults to white when a border is enabled. */
  borderColor?: string;
  /** Direct Iconify SVG URL (or Cloudinary CDN URL) */
  svgUrl: string;
  /** Tint color applied via CSS filter; defaults to '#000000' */
  color?: string;
  /**
   * Flip state cycles through 4 states:
   *   0 = normal
   *   1 = flipped horizontal
   *   2 = flipped horizontal + vertical (= 180° rotation)
   *   3 = flipped vertical
   */
  flip?: 0 | 1 | 2 | 3;
}

interface IconContextType {
  iconElements: IconElement[];
  selectedIconId: string | null;
  addIconElement: (x: number, y: number, svgUrl: string, size?: number) => string;
  addFullIconElement: (el: Omit<IconElement, 'id'>) => string;
  updateIcon: (id: string, updates: Partial<IconElement>) => void;
  /** Start batching updates (for drag/resize operations) */
  startUpdateBatch: () => void;
  /** End batching updates */
  endUpdateBatch: () => void;
  deleteIcon: (id: string) => void;
  setSelectedIconId: (id: string | null) => void;
}

const IconContext = createContext<IconContextType | undefined>(undefined);

export function IconProvider({ children }: { children: ReactNode }) {
  const [iconElements, setIconElements] = useState<IconElement[]>([]);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const { record, startBatch, endBatch } = useUndo();

  const addIconElement = (x: number, y: number, svgUrl: string, size = 48): string => {
    const el: IconElement = {
      id: `icon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x,
      y,
      size,
      svgUrl,
      color: '#000000',
    };
    setIconElements(prev => [...prev, el]);
    setSelectedIconId(el.id);
    
    // Undo: remove the element, Redo: add it back
    record(
      () => {
        setIconElements(prev => prev.filter(e => e.id !== el.id));
        setSelectedIconId(cur => (cur === el.id ? null : cur));
      },
      () => {
        setIconElements(prev => [...prev, el]);
        setSelectedIconId(el.id);
      }
    );
    return el.id;
  };

  const addFullIconElement = (el: Omit<IconElement, 'id'>): string => {
    const full: IconElement = {
      ...el,
      id: `icon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setIconElements(prev => [...prev, full]);
    setSelectedIconId(full.id);
    
    // Undo: remove the element, Redo: add it back
    record(
      () => {
        setIconElements(prev => prev.filter(e => e.id !== full.id));
        setSelectedIconId(cur => (cur === full.id ? null : cur));
      },
      () => {
        setIconElements(prev => [...prev, full]);
        setSelectedIconId(full.id);
      }
    );
    return full.id;
  };

  const updateIcon = (id: string, updates: Partial<IconElement>) => {
    const prev = iconElements.find(e => e.id === id);
    if (!prev) return;
    const next = { ...prev, ...updates };
    
    // Undo: restore previous state, Redo: apply updates
    record(
      () => setIconElements(els => els.map(e => (e.id === id ? prev : e))),
      () => setIconElements(els => els.map(e => (e.id === id ? next : e)))
    );
    
    setIconElements(els => els.map(e => (e.id === id ? next : e)));
  };

  const startUpdateBatch = () => {
    startBatch();
  };

  const endUpdateBatch = () => {
    endBatch();
  };

  const deleteIcon = (id: string) => {
    const idx = iconElements.findIndex(e => e.id === id);
    const deleted = iconElements[idx];
    if (!deleted) return;
    const prevSel = selectedIconId;
    
    // Undo: restore the element, Redo: delete it again
    record(
      () => {
        setIconElements(els => [...els.slice(0, idx), deleted, ...els.slice(idx)]);
        setSelectedIconId(prevSel);
      },
      () => {
        setIconElements(els => els.filter(e => e.id !== id));
        setSelectedIconId(cur => (cur === id ? null : cur));
      }
    );
    
    setIconElements(els => els.filter(e => e.id !== id));
    setSelectedIconId(cur => (cur === id ? null : cur));
  };

  return (
    <IconContext.Provider
      value={{
        iconElements,
        selectedIconId,
        addIconElement,
        addFullIconElement,
        updateIcon,
        startUpdateBatch,
        endUpdateBatch,
        deleteIcon,
        setSelectedIconId,
      }}
    >
      {children}
    </IconContext.Provider>
  );
}

export function useIcon() {
  const ctx = useContext(IconContext);
  if (!ctx) throw new Error('useIcon must be used within an IconProvider');
  return ctx;
}
