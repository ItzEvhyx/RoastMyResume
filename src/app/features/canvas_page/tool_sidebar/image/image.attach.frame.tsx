'use client';

/**
 * image.attach.frame.tsx
 *
 * Provides the drag-to-frame attachment mechanic for images in the Photos panel.
 *
 * How it works
 * ────────────
 * 1. `useImageDragToFrame` — returns event handlers to attach to an ImageThumbnail.
 *    When a drag starts it writes two keys into `dataTransfer`:
 *      • tool          = 'image-panel'
 *      • image-data-url = <base64 data URL>
 *    The canvas element's drop handler in drag.elements.tsx reads these and calls
 *    `onUpdate({ frameImage: dataUrl })` when the target is a frame shape.
 *
 * 2. `FrameDropHighlight` — an absolute overlay rendered on top of an
 *    `ImageThumbnail` while it is being dragged, so the user gets clear affordance
 *    that the image is "live" and can be dropped onto a frame.
 *
 * The shape-side changes (accepting the drop) live in drag.elements.tsx.
 */

import { useCallback, useState } from 'react';

// ─── Drag source ──────────────────────────────────────────────────────────────

export const IMAGE_PANEL_DRAG_KEY = 'tool';
export const IMAGE_PANEL_DRAG_VALUE = 'image-panel';
export const IMAGE_DATA_URL_KEY = 'image-data-url';

interface UseImageDragToFrameResult {
  isDragging: boolean;
  dragHandlers: {
    draggable: true;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
  };
}

/**
 * Returns drag event handlers to attach to an image thumbnail so the user
 * can drag it onto a frame shape on the canvas.
 */
export function useImageDragToFrame(dataUrl: string): UseImageDragToFrameResult {
  const [isDragging, setIsDragging] = useState(false);

  const onDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData(IMAGE_PANEL_DRAG_KEY, IMAGE_PANEL_DRAG_VALUE);
      e.dataTransfer.setData(IMAGE_DATA_URL_KEY, dataUrl);
      e.dataTransfer.effectAllowed = 'copy';
      setIsDragging(true);
    },
    [dataUrl],
  );

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    isDragging,
    dragHandlers: { draggable: true, onDragStart, onDragEnd },
  };
}

// ─── Drop highlight ───────────────────────────────────────────────────────────

/**
 * Thin overlay that appears on top of a thumbnail while it is being dragged.
 * Gives the user a visual cue that the item is "in-flight" without hiding
 * the image itself completely.
 */
export function DragActiveOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        background: 'rgba(255,255,255,0.18)',
        border: '2px solid rgba(255,255,255,0.6)',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
}

// ─── Frame drop acceptance helpers (consumed by drag.elements.tsx) ────────────

/**
 * Returns true when the drag event originated from the Photos panel.
 * Used in handleFrameDragOver to decide whether to accept the drag.
 */
export function isImagePanelDrag(event: React.DragEvent | DragEvent): boolean {
  return event.dataTransfer?.types.includes(IMAGE_DATA_URL_KEY) ?? false;
}

/**
 * Extracts the image data URL from a drop event that originated from the
 * Photos panel. Returns null if the event is not an image-panel drag.
 */
export function extractImageDataUrl(event: React.DragEvent | DragEvent): string | null {
  if (!isImagePanelDrag(event)) return null;
  const url = (event.dataTransfer as DataTransfer).getData(IMAGE_DATA_URL_KEY);
  return url || null;
}
