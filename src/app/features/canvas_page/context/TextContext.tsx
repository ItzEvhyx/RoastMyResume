'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useUndo } from '../globals/undo';

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
}

interface TextContextType {
  textElements: TextElement[];
  selectedId: string | null;
  toolbarExpanded: boolean;
  activeTool: string | null;
  addTextElement: (x: number, y: number, initialContent?: string, initialWidth?: number) => void;
  /** Paste a full element snapshot (all props), used by the clipboard system */
  addFullTextElement: (el: Omit<TextElement, 'id'>) => void;
  updateElement: (id: string, updates: Partial<TextElement>) => void;
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
  const { record } = useUndo();

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
    };
    
    setTextElements(prev => [...prev, newElement]);
    setSelectedId(newElement.id);
    record(() => {
      setTextElements(prev => prev.filter(element => element.id !== newElement.id));
      setSelectedId(current => current === newElement.id ? null : current);
    });
  };

  const updateElement = (id: string, updates: Partial<TextElement>) => {
    const previous = textElements.find(element => element.id === id);
    if (!previous) return;
    record(() => setTextElements(elements => elements.map(element => element.id === id ? previous : element)));
    setTextElements(textElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const addFullTextElement = (el: Omit<TextElement, 'id'>) => {
    const newElement: TextElement = {
      ...el,
      id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setTextElements(prev => [...prev, newElement]);
    setSelectedId(newElement.id);
    record(() => {
      setTextElements(prev => prev.filter(element => element.id !== newElement.id));
      setSelectedId(current => current === newElement.id ? null : current);
    });
  };

  const deleteElement = (id: string) => {
    const index = textElements.findIndex(element => element.id === id);
    const deleted = textElements[index];
    if (!deleted) return;
    const previousSelection = selectedId;
    record(() => {
      setTextElements(elements => [...elements.slice(0, index), deleted, ...elements.slice(index)]);
      setSelectedId(previousSelection);
    });
    setTextElements(textElements.filter(el => el.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
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
        updateElement,
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
