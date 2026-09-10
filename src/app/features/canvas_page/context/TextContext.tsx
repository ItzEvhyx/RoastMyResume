'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useUndo } from '../globals/undo';
import { useLayerOrder } from '../globals/layer.order';

export type ListType = 'none' | 'bullet' | 'number';
export type TextAlign = 'none' | 'left' | 'right' | 'center' | 'justify';

export interface TextElement {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  listType?: ListType;
  textAlign?: TextAlign;
  textCategory?: 'header' | 'subheader' | 'body' | 'meta' | null;
  /**
   * Stable document-mode field key, e.g. `personal.name`, `contact.0`,
   * `experience.1.bullets`. Used to map form inputs ↔ canvas text.
   */
  docField?: string;
  zIndex?: number;
  isLocked?: boolean;
}

interface TextContextType {
  textElements: TextElement[];
  selectedId: string | null;
  toolbarExpanded: boolean;
  activeTool: string | null;
  addTextElement: (x: number, y: number, initialContent?: string, initialWidth?: number) => string;
  /** Paste a full element snapshot (all props), used by the clipboard system */
  addFullTextElement: (el: Omit<TextElement, 'id'> & { id?: string }) => string;
  /** Replace all text elements (persistence). Does not record undo. */
  hydrateTextElements: (elements: TextElement[]) => void;
  updateElement: (id: string, updates: Partial<TextElement>) => void;
  /** Start batching updates (for drag/resize operations) */
  startUpdateBatch: () => void;
  /** End batching updates */
  endUpdateBatch: () => void;
  deleteElement: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  setToolbarExpanded: (expanded: boolean) => void;
  setActiveTool: (tool: string | null) => void;
}

const TextContext = createContext<TextContextType | undefined>(undefined);

export function TextProvider({ children }: { children: ReactNode }) {
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const { record, startBatch, endBatch } = useUndo();
  const { getNextLayer } = useLayerOrder();

  const addTextElement = (x: number, y: number, initialContent?: string, initialWidth?: number) => {
    const content = initialContent ?? 'Add text';
    let width = initialWidth ?? 150;
    if (initialContent && !initialWidth) {
      const lines = initialContent.split('\n');
      const maxLen = Math.max(...lines.map(l => l.length));
      width = Math.min(650, Math.max(150, Math.round(maxLen * 14)));
    }

    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      content,
      x,
      y,
      width,
      fontSize: 24,
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      zIndex: getNextLayer(),
    };
    
    setTextElements(prev => [...prev, newElement]);
    setSelectedId(newElement.id);
    
    // Undo: remove the element, Redo: add it back
    record(
      () => {
        setTextElements(prev => prev.filter(element => element.id !== newElement.id));
        setSelectedId(current => current === newElement.id ? null : current);
      },
      () => {
        setTextElements(prev => [...prev, newElement]);
        setSelectedId(newElement.id);
      }
    );
    return newElement.id;
  };

  const updateElement = (id: string, updates: Partial<TextElement>) => {
    const previous = textElements.find(element => element.id === id);
    if (!previous) return;
    const next = { ...previous, ...updates };
    
    // Undo: restore previous state, Redo: apply updates
    record(
      () => setTextElements(elements => elements.map(element => element.id === id ? previous : element)),
      () => setTextElements(elements => elements.map(element => element.id === id ? next : element))
    );
    
    setTextElements(elements => elements.map(el =>
      el.id === id ? next : el
    ));
  };

  const startUpdateBatch = () => {
    startBatch();
  };

  const endUpdateBatch = () => {
    endBatch();
  };

  const addFullTextElement = (el: Omit<TextElement, 'id'> & { id?: string }) => {
    const newElement: TextElement = {
      ...el,
      id: el.id ?? `text-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      zIndex: el.zIndex ?? getNextLayer(),
    };
    setTextElements(prev => [...prev, newElement]);
    setSelectedId(newElement.id);
    
    // Undo: remove the element, Redo: add it back
    record(
      () => {
        setTextElements(prev => prev.filter(element => element.id !== newElement.id));
        setSelectedId(current => current === newElement.id ? null : current);
      },
      () => {
        setTextElements(prev => [...prev, newElement]);
        setSelectedId(newElement.id);
      }
    );
    return newElement.id;
  };

  const hydrateTextElements = (elements: TextElement[]) => {
    setTextElements(elements);
    setSelectedId(null);
  };

  const deleteElement = (id: string) => {
    const index = textElements.findIndex(element => element.id === id);
    const deleted = textElements[index];
    if (!deleted) return;
    const previousSelection = selectedId;
    
    // Undo: restore the element, Redo: delete it again
    record(
      () => {
        setTextElements(elements => {
          if (elements.some(el => el.id === deleted.id)) return elements;
          return [...elements.slice(0, index), deleted, ...elements.slice(index)];
        });
        setSelectedId(previousSelection);
      },
      () => {
        setTextElements(elements => elements.filter(el => el.id !== id));
        setSelectedId(current => current === id ? null : current);
      }
    );
    
    // Functional update so multi-deletes (e.g. grouping) all apply when batched
    setTextElements(elements => elements.filter(el => el.id !== id));
    setSelectedId(current => (current === id ? null : current));
  };

  return (
    <TextContext.Provider
      value={{
        textElements,
        selectedId,
        toolbarExpanded,
        activeTool,
        addTextElement,
        addFullTextElement,
        hydrateTextElements,
        updateElement,
        startUpdateBatch,
        endUpdateBatch,
        deleteElement,
        setSelectedId,
        setToolbarExpanded,
        setActiveTool,
      }}
    >
      {children}
    </TextContext.Provider>
  );
}

export function useText() {
  const context = useContext(TextContext);
  if (context === undefined) {
    throw new Error('useText must be used within a TextProvider');
  }
  return context;
}
