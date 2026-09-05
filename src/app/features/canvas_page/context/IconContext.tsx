'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useUndo } from '../globals/undo';

export interface IconElement {
  id: string;
  x: number;
  y: number;
  /** Uniform size — icon is always square */
  size: number;
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
  /** Begin batching updates - call before starting drag/resize operations */
  beginBatchUpdate: (id: string) => void;
  /** End batching - call after drag/resize completes */
  endBatchUpdate: () => void;
  deleteIcon: (id: string) => void;
  setSelectedIconId: (id: string | null) => void;
}

const IconContext = createContext<IconContextType | undefined>(undefined);

export function IconProvider({ children }: { children: ReactNode }) {
  const [iconElements, setIconElements] = useState<IconElement[]>([]);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const { record, startTransaction, commitTransaction } = useUndo();

  const beginBatchUpdate = (id: string) => {
    const current = iconElements.find(el => el.id === id);
    if (!current) return;
    startTransaction();
    // Record the initial state - this will be stored as the undo action
    record(() =>
      setIconElements(els => els.map(e => (e.id === id ? current : e))),
    );
  };

  const endBatchUpdate = () => {
    commitTransaction();
  };

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
    record(() => {
      setIconElements(prev => prev.filter(e => e.id !== el.id));
      setSelectedIconId(cur => (cur === el.id ? null : cur));
    });
    return el.id;
  };

  const addFullIconElement = (el: Omit<IconElement, 'id'>): string => {
    const full: IconElement = {
      ...el,
      id: `icon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setIconElements(prev => [...prev, full]);
    setSelectedIconId(full.id);
    record(() => {
      setIconElements(prev => prev.filter(e => e.id !== full.id));
      setSelectedIconId(cur => (cur === full.id ? null : cur));
    });
    return full.id;
  };

  const updateIcon = (id: string, updates: Partial<IconElement>) => {
    setIconElements(els => els.map(e => (e.id === id ? { ...e, ...updates } : e)));
  };

  const deleteIcon = (id: string) => {
    const idx = iconElements.findIndex(e => e.id === id);
    const deleted = iconElements[idx];
    if (!deleted) return;
    const prevSel = selectedIconId;
    record(() => {
      setIconElements(els => [...els.slice(0, idx), deleted, ...els.slice(idx)]);
      setSelectedIconId(prevSel);
    });
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
        beginBatchUpdate,
        endBatchUpdate,
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
