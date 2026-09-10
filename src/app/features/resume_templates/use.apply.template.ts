'use client';

import { useCallback } from 'react';
import { useText } from '@/app/features/canvas_page/context/TextContext';
import { useIcon } from '@/app/features/canvas_page/context/IconContext';
import { useDivider } from '@/app/features/canvas_page/context/DividerContext';
import { usePen } from '@/app/features/canvas_page/context/PenContext';
import { useGroup } from '@/app/features/canvas_page/context/GroupContext';
import { saveCanvasState } from '@/app/features/canvas_page/services/canvas.persistence';
import { clearDeniseState } from '@/app/features/canvas_page/services/denise.persistence';
import { buildTemplateCanvasState, setActiveTemplateId } from './apply';

/** Apply a template copy into the live canvas contexts (layouts tab). */
export function useApplyTemplate() {
  const { hydrateTextElements, setSelectedId } = useText();
  const { hydrateIconElements, setSelectedIconId } = useIcon();
  const { hydrateDividerElements, setSelectedDividerId } = useDivider();
  const { hydrateStrokes, setSelectedStrokeId } = usePen();
  const { hydrateGroupElements, setSelectedGroupId } = useGroup();

  return useCallback(
    (templateId: string) => {
      const payload = buildTemplateCanvasState(templateId);
      if (!payload) return false;

      clearDeniseState();
      hydrateTextElements(payload.textElements);
      hydrateIconElements(payload.iconElements);
      hydrateDividerElements(payload.dividerElements);
      hydrateStrokes(payload.penStrokes);
      hydrateGroupElements(payload.groupElements);
      setSelectedId(null);
      setSelectedIconId(null);
      setSelectedDividerId(null);
      setSelectedStrokeId(null);
      setSelectedGroupId(null);
      saveCanvasState(payload);
      setActiveTemplateId(templateId);
      return true;
    },
    [
      hydrateTextElements,
      hydrateIconElements,
      hydrateDividerElements,
      hydrateStrokes,
      hydrateGroupElements,
      setSelectedId,
      setSelectedIconId,
      setSelectedDividerId,
      setSelectedStrokeId,
      setSelectedGroupId,
    ],
  );
}
