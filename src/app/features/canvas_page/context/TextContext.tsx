'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

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
  textCategory?: 'header' | 'subheader' | 'body' | 'meta' | null;
}

interface TextContextType {
  textElements: TextElement[];
  selectedId: string | null;
  toolbarExpanded: boolean;
  activeTool: string | null;
  addTextElement: (x: number, y: number) => void;
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

  const addTextElement = (x: number, y: number) => {
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      content: 'Add text',
      x,
      y,
      width: 150,
      fontSize: 24,
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
    };
    
    setTextElements([...textElements, newElement]);
    setSelectedId(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(textElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const deleteElement = (id: string) => {
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
