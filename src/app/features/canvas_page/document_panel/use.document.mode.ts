'use client';

import { useCallback, useRef } from 'react';
import { useCanvas } from '@/app/features/canvas_page/context/CanvasContext';
import { useText } from '@/app/features/canvas_page/context/TextContext';
import { useDivider } from '@/app/features/canvas_page/context/DividerContext';
import {
  assignDocFieldsHeuristic,
  blankAtsDocumentSeed,
  buildDocumentSections,
  canvasHasDocFields,
  canvasLooksEmpty,
  planAddEntry,
  planContentHeightChange,
  planRemoveEntry,
  reorderEntryPatches,
  type DocSectionId,
} from '@/app/features/canvas_page/globals/convert.document';

/**
 * Orchestrates enter/exit document mode and entry mutations.
 *
 * Blank canvas → document mode materializes a temporary ATS layout for the form.
 * Converting back from that session clears it so the user returns to an empty
 * freeform canvas. Template canvases keep their content either way.
 */
export function useDocumentMode() {
  const { isDocumentMode, setIsDocumentMode, setIsGrabMode } = useCanvas();
  const {
    textElements,
    updateElement,
    deleteElement,
    addFullTextElement,
    hydrateTextElements,
    setSelectedId,
    setActiveTool,
    setToolbarExpanded,
  } = useText();
  const { dividerElements, updateDivider, hydrateDividerElements } =
    useDivider();

  /** True when this document session started from an empty (scratch) canvas. */
  const sessionFromBlankRef = useRef(false);

  const applyTextPatches = useCallback(
    (patches: { id: string; updates: Parameters<typeof updateElement>[1] }[]) => {
      for (const p of patches) updateElement(p.id, p.updates);
    },
    [updateElement],
  );

  const enterDocumentMode = useCallback(() => {
    setIsGrabMode(false);
    setActiveTool(null);
    setToolbarExpanded(false);
    setSelectedId(null);

    if (canvasLooksEmpty(textElements)) {
      sessionFromBlankRef.current = true;
      const seed = blankAtsDocumentSeed();
      const now = Date.now();
      hydrateTextElements(
        seed.texts.map((t, i) => ({
          ...t,
          id: `text-doc-${now}-${i}`,
        })),
      );
      hydrateDividerElements(
        seed.dividers.map((d, i) => ({
          ...d,
          id: `divider-doc-${now}-${i}`,
        })),
      );
    } else {
      sessionFromBlankRef.current = false;
      if (!canvasHasDocFields(textElements)) {
        applyTextPatches(assignDocFieldsHeuristic(textElements));
      }
    }

    setIsDocumentMode(true);
  }, [
    textElements,
    setIsGrabMode,
    setActiveTool,
    setToolbarExpanded,
    setSelectedId,
    hydrateTextElements,
    hydrateDividerElements,
    applyTextPatches,
    setIsDocumentMode,
  ]);

  const exitDocumentMode = useCallback(() => {
    setSelectedId(null);
    setActiveTool(null);
    // Re-expand the tool rail so docks (shapes/icons/image/layers) work again.
    // Enter left toolbarExpanded false; local rail state used to desync from that.
    setToolbarExpanded(true);

    // Scratch → document was a temporary ATS scaffold. Leaving document mode
    // restores the empty freeform canvas so the user can drag / drop again.
    if (sessionFromBlankRef.current) {
      hydrateTextElements([]);
      hydrateDividerElements([]);
      sessionFromBlankRef.current = false;
    }

    setIsDocumentMode(false);
  }, [
    setSelectedId,
    setActiveTool,
    setToolbarExpanded,
    hydrateTextElements,
    hydrateDividerElements,
    setIsDocumentMode,
  ]);

  const toggleDocumentMode = useCallback(() => {
    if (isDocumentMode) exitDocumentMode();
    else enterDocumentMode();
  }, [isDocumentMode, enterDocumentMode, exitDocumentMode]);

  const focusField = useCallback(
    (textId: string) => {
      setSelectedId(textId);
    },
    [setSelectedId],
  );

  const writeField = useCallback(
    (textId: string, content: string) => {
      const plan = planContentHeightChange(
        textElements,
        dividerElements,
        textId,
        content,
      );
      if (plan) {
        applyTextPatches(plan.textPatches);
        for (const p of plan.dividerPatches) updateDivider(p.id, p.updates);
      }
      updateElement(textId, { content });
      setSelectedId(textId);
    },
    [
      textElements,
      dividerElements,
      applyTextPatches,
      updateDivider,
      updateElement,
      setSelectedId,
    ],
  );

  const addEntry = useCallback(
    (section: DocSectionId) => {
      const plan = planAddEntry(textElements, dividerElements, section);
      if (!plan) return;
      applyTextPatches(plan.textPatches);
      for (const p of plan.dividerPatches) updateDivider(p.id, p.updates);
      for (const t of plan.newTexts) {
        const id = addFullTextElement(t);
        setSelectedId(id);
      }
    },
    [
      textElements,
      dividerElements,
      applyTextPatches,
      updateDivider,
      addFullTextElement,
      setSelectedId,
    ],
  );

  const removeEntry = useCallback(
    (section: DocSectionId, entryIndex: number) => {
      const plan = planRemoveEntry(textElements, dividerElements, section, entryIndex);
      if (!plan) return;
      applyTextPatches(plan.textPatches);
      for (const p of plan.dividerPatches) updateDivider(p.id, p.updates);
      for (const id of plan.deleteIds) deleteElement(id);
      setSelectedId(null);
    },
    [
      textElements,
      dividerElements,
      applyTextPatches,
      updateDivider,
      deleteElement,
      setSelectedId,
    ],
  );

  const reorderEntry = useCallback(
    (section: DocSectionId, fromIndex: number, toIndex: number) => {
      applyTextPatches(reorderEntryPatches(textElements, section, fromIndex, toIndex));
    },
    [textElements, applyTextPatches],
  );

  const sections = buildDocumentSections(textElements);

  return {
    isDocumentMode,
    sections,
    toggleDocumentMode,
    enterDocumentMode,
    exitDocumentMode,
    focusField,
    writeField,
    addEntry,
    removeEntry,
    reorderEntry,
  };
}
