'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useUndo } from '../globals/undo';

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
    addDividerElement: (x: number, y: number, initialWidth?: number) => string;
    updateDivider: (id: string, updates: Partial<DividerElement>) => void;
    /** Begin batching updates - call before starting drag/resize operations */
    beginBatchUpdate: (id: string) => void;
    /** End batching - call after drag/resize completes */
    endBatchUpdate: () => void;
    deleteDivider: (id: string) => void;
    setSelectedDividerId: (id: string | null) => void;
}

const DividerContext = createContext<DividerContextType | undefined>(undefined);

export function DividerProvider({ children }: { children: ReactNode }) {
    const [dividerElements, setDividerElements] = useState<DividerElement[]>([]);
    const [selectedDividerId, setSelectedDividerId] = useState<string | null>(null);
    const { record, startTransaction, commitTransaction } = useUndo();

    const beginBatchUpdate = (id: string) => {
        const current = dividerElements.find(el => el.id === id);
        if (!current) return;
        startTransaction();
        // Record the initial state - this will be stored as the undo action
        record(() => setDividerElements(elements => elements.map(element => element.id === id ? current : element)));
    };

    const endBatchUpdate = () => {
        commitTransaction();
    };

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
        record(() => {
            setDividerElements(prev => prev.filter(element => element.id !== newElement.id));
            setSelectedDividerId(current => current === newElement.id ? null : current);
        });
        return newElement.id;
    };

    const updateDivider = (id: string, updates: Partial<DividerElement>) => {
        setDividerElements(prev => prev.map(el =>
            el.id === id ? { ...el, ...updates } : el
        ));
    };

    const deleteDivider = (id: string) => {
        const index = dividerElements.findIndex(element => element.id === id);
        const deleted = dividerElements[index];
        if (!deleted) return;
        const previousSelection = selectedDividerId;
        record(() => {
            setDividerElements(elements => [...elements.slice(0, index), deleted, ...elements.slice(index)]);
            setSelectedDividerId(previousSelection);
        });
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
                beginBatchUpdate,
                endBatchUpdate,
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
