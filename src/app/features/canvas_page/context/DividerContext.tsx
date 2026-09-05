'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useUndo } from '../globals/undo';
import { useLayerOrder } from '../globals/layer.order';

export interface DividerElement {
    id: string;
    x: number;
    y: number;
    width: number;
    thickness?: number;
    color?: string;
    zIndex?: number;
}

interface DividerContextType {
    dividerElements: DividerElement[];
    selectedDividerId: string | null;
    addDividerElement: (x: number, y: number, initialWidth?: number) => string;
    updateDivider: (id: string, updates: Partial<DividerElement>) => void;
    /** Start batching updates (for drag/resize operations) */
    startUpdateBatch: () => void;
    /** End batching updates */
    endUpdateBatch: () => void;
    deleteDivider: (id: string) => void;
    setSelectedDividerId: (id: string | null) => void;
}

const DividerContext = createContext<DividerContextType | undefined>(undefined);

export function DividerProvider({ children }: { children: ReactNode }) {
    const [dividerElements, setDividerElements] = useState<DividerElement[]>([]);
    const [selectedDividerId, setSelectedDividerId] = useState<string | null>(null);
    const { record, startBatch, endBatch } = useUndo();
    const { getNextLayer } = useLayerOrder();

    const addDividerElement = (x: number, y: number, initialWidth?: number) => {
        const newElement: DividerElement = {
            id: `divider-${Date.now()}`,
            x,
            y,
            width: initialWidth ?? 300,
            thickness: 2,
            color: '#000000',
            zIndex: getNextLayer(),
        };

        setDividerElements(prev => [...prev, newElement]);
        setSelectedDividerId(newElement.id);
        
        // Undo: remove the element, Redo: add it back
        record(
            () => {
                setDividerElements(prev => prev.filter(element => element.id !== newElement.id));
                setSelectedDividerId(current => current === newElement.id ? null : current);
            },
            () => {
                setDividerElements(prev => [...prev, newElement]);
                setSelectedDividerId(newElement.id);
            }
        );
        return newElement.id;
    };

    const updateDivider = (id: string, updates: Partial<DividerElement>) => {
        const previous = dividerElements.find(element => element.id === id);
        if (!previous) return;
        const next = { ...previous, ...updates };
        
        // Undo: restore previous state, Redo: apply updates
        record(
            () => setDividerElements(elements => elements.map(element => element.id === id ? previous : element)),
            () => setDividerElements(elements => elements.map(element => element.id === id ? next : element))
        );
        
        setDividerElements(prev => prev.map(el =>
            el.id === id ? next : el
        ));
    };

    const startUpdateBatch = () => {
        startBatch();
    };

    const endUpdateBatch = () => {
        endBatch();
    };

    const deleteDivider = (id: string) => {
        const index = dividerElements.findIndex(element => element.id === id);
        const deleted = dividerElements[index];
        if (!deleted) return;
        const previousSelection = selectedDividerId;
        
        // Undo: restore the element, Redo: delete it again
        record(
            () => {
                setDividerElements(elements => [...elements.slice(0, index), deleted, ...elements.slice(index)]);
                setSelectedDividerId(previousSelection);
            },
            () => {
                setDividerElements(elements => elements.filter(el => el.id !== id));
                setSelectedDividerId(current => current === id ? null : current);
            }
        );
        
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
                startUpdateBatch,
                endUpdateBatch,
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
