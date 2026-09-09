'use client';

/**
 * use.canvas.persistence.tsx
 * 
 * Custom hook that manages auto-saving and loading of canvas state
 * Syncs all element contexts with localStorage
 */

import { useEffect, useCallback, useRef } from 'react';
import { useText } from '../context/TextContext';
import { useIcon } from '../context/IconContext';
import { useDivider } from '../context/DividerContext';
import { usePen } from '../context/PenContext';
import { useGroup } from '../context/GroupContext';
import { 
  saveCanvasState, 
  loadCanvasState, 
  debounce,
  type CanvasState 
} from '../services/canvas.persistence';

/**
 * Hook to manage canvas persistence
 * Call this once at the top level of your canvas page
 */
export function useCanvasPersistence() {
  const { textElements, addFullTextElement } = useText();
  const { iconElements, addFullIconElement } = useIcon();
  const { dividerElements, addFullDividerElement } = useDivider();
  const { strokes, addFullStroke } = usePen();
  const { groupElements, addGroup } = useGroup();
  
  const hasLoadedRef = useRef(false);

  // Load saved state on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const savedState = loadCanvasState();
    if (!savedState) return;

    console.log('Loading saved canvas state...', savedState);

    // Restore text elements
    savedState.textElements.forEach(el => {
      addFullTextElement(el);
    });

    // Restore icon elements (includes shapes)
    savedState.iconElements.forEach(el => {
      addFullIconElement(el);
    });

    // Restore divider elements
    savedState.dividerElements.forEach(el => {
      addFullDividerElement(el);
    });

    // Restore pen strokes
    savedState.penStrokes.forEach(stroke => {
      addFullStroke(stroke);
    });

    // Restore groups
    savedState.groupElements.forEach(group => {
      addGroup(
        { x: group.x, y: group.y, width: group.width, height: group.height },
        group.members
      );
    });

  }, []); // Empty deps - only run once on mount

  // Auto-save whenever any elements change (debounced to avoid excessive writes)
  const debouncedSave = useCallback(
    debounce(() => {
      if (!hasLoadedRef.current) return; // Don't save during initial load
      
      saveCanvasState({
        textElements,
        iconElements,
        dividerElements,
        penStrokes: strokes,
        groupElements,
      });
    }, 1000), // Save 1 second after last change
    [textElements, iconElements, dividerElements, strokes, groupElements]
  );

  useEffect(() => {
    if (!hasLoadedRef.current) return; // Skip auto-save during initial load
    debouncedSave();
  }, [textElements, iconElements, dividerElements, strokes, groupElements, debouncedSave]);

  return {
    // Expose a manual save function if needed
    saveNow: () => saveCanvasState({
      textElements,
      iconElements,
      dividerElements,
      penStrokes: strokes,
      groupElements,
    }),
  };
}
