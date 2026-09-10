'use client';

/**
 * use.canvas.persistence.tsx
 *
 * Custom hook that manages auto-saving and loading of canvas state.
 * Syncs all element contexts with localStorage.
 *
 * Hydration *replaces* context state (never appends), so React Strict Mode's
 * mount→unmount→remount cycle cannot stack duplicate elements.
 */

import { useEffect, useRef } from 'react';
import { useText } from '../context/TextContext';
import { useIcon } from '../context/IconContext';
import { useDivider } from '../context/DividerContext';
import { usePen } from '../context/PenContext';
import { useGroup } from '../context/GroupContext';
import {
  saveCanvasState,
  loadCanvasState,
} from '../services/canvas.persistence';

/**
 * Hook to manage canvas persistence
 * Call this once at the top level of your canvas page
 */
export function useCanvasPersistence() {
  const { textElements, hydrateTextElements } = useText();
  const { iconElements, hydrateIconElements } = useIcon();
  const { dividerElements, hydrateDividerElements } = useDivider();
  const { strokes, hydrateStrokes } = usePen();
  const { groupElements, hydrateGroupElements } = useGroup();

  const readyToSaveRef = useRef(false);
  const latestRef = useRef({
    textElements,
    iconElements,
    dividerElements,
    strokes,
    groupElements,
  });
  latestRef.current = {
    textElements,
    iconElements,
    dividerElements,
    strokes,
    groupElements,
  };

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSave = () => {
    if (!readyToSaveRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      const snap = latestRef.current;
      saveCanvasState({
        textElements: snap.textElements,
        iconElements: snap.iconElements,
        dividerElements: snap.dividerElements,
        penStrokes: snap.strokes,
        groupElements: snap.groupElements,
      });
    }, 1000);
  };

  // Load once per mount — replace state so remounts don't stack duplicates
  useEffect(() => {
    const savedState = loadCanvasState();
    if (savedState) {
      console.log('Loading saved canvas state...', savedState);
      hydrateTextElements(savedState.textElements);
      hydrateIconElements(savedState.iconElements);
      hydrateDividerElements(savedState.dividerElements);
      hydrateStrokes(savedState.penStrokes);
      hydrateGroupElements(savedState.groupElements);
    }

    // Unlock saves after hydrate setStates flush
    const unlock = setTimeout(() => {
      readyToSaveRef.current = true;
    }, 0);

    return () => {
      clearTimeout(unlock);
      readyToSaveRef.current = false;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
    // Intentionally mount-only: hydrate* identities change every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scheduleSave();
  }, [textElements, iconElements, dividerElements, strokes, groupElements]);

  return {
    saveNow: () => {
      const snap = latestRef.current;
      saveCanvasState({
        textElements: snap.textElements,
        iconElements: snap.iconElements,
        dividerElements: snap.dividerElements,
        penStrokes: snap.strokes,
        groupElements: snap.groupElements,
      });
    },
  };
}
