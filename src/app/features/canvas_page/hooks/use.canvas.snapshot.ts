// src/app/features/canvas_page/hooks/use.canvas.snapshot.ts

'use client';

/**
 * useCanvasSnapshot
 *
 * Pulls from every element context on the canvas and returns a ready-to-send
 * serialized snapshot string for Claude. Keeps ask.denise.tsx clean — it just
 * calls `const snapshot = useCanvasSnapshot()` and passes the result along.
 */

import { useMemo } from 'react';
import { useText } from '../context/TextContext';
import { useDivider } from '../context/DividerContext';
import { useIcon } from '../context/IconContext';
import { usePen } from '../context/PenContext';
import { useGroup } from '../context/GroupContext';
import {
  buildCanvasSnapshot,
  serializeSnapshotForClaude,
} from '../utils/canvas.snapshot';

export function useCanvasSnapshot(): string {
  const { textElements } = useText();
  const { dividerElements } = useDivider();
  const { iconElements } = useIcon();
  const { strokes } = usePen();
  const { groupElements } = useGroup();

  return useMemo(() => {
    const snapshot = buildCanvasSnapshot(
      textElements,
      dividerElements,
      iconElements,
      strokes,
      groupElements,
    );
    return serializeSnapshotForClaude(snapshot);
  }, [textElements, dividerElements, iconElements, strokes, groupElements]);
}
