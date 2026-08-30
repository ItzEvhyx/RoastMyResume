'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface DividerElement {
    id: string;
    x: number;
    y: number;
    width: number;
    thickness?: number;
    color?: string;
}

interface DividerContextType {
    dividerElements: DividerElement[];
    selectedDividerId: string | null;
    addDividerElement: (x: number, y: number, initialWidth?: number) => void;
    updateDivider: (id: string, updates: Partial<DividerElement>) => void;
    deleteDivider: (id: string) => void;
    setSelectedDividerId: (id: string | null) => void;
}

const DividerContext = createContext<DividerContextType | undefined>(undefined);

export function DividerProvider({ children }: { children: ReactNode }) {
    const [dividerElements, setDividerElements] = useState<DividerElement[]>([]);
    const [selectedDividerId, setSelectedDividerId] = useState<string | null>(null);

    const addDividerElement = (x: number, y: number, initialWidth?: number) => {
        const newElement: DividerElement = {
            id: `divider-${Date.now()}`,
            x,
            y,
            width: initialWidth ?? 300,
            thickness: 2,
            color: '#000000',
        };

        setDividerElements(prev => [...prev, newElement]);
        setSelectedDividerId(newElement.id);
    };

    const updateDivider = (id: string, updates: Partial<DividerElement>) => {
        setDividerElements(prev => prev.map(el =>
            el.id === id ? { ...el, ...updates } : el
        ));
    };

    const deleteDivider = (id: string) => {
        setDividerElements(prev => prev.filter(el => el.id !== id));
        setSelectedDividerId(current => (current === id ? null : current));
    };

    return (
        <DividerContext.Provider
            value={{
                dividerElements,
                selectedDividerId,
                addDividerElement,
                updateDivider,
                deleteDivider,
                setSelectedDividerId,
            }}
        >
            {children}
        </DividerContext.Provider>
    );
}

export function useDivider() {
    const context = useContext(DividerContext);
    if (context === undefined) {
        throw new Error('useDivider must be used within a DividerProvider');
    }
    return context;
}