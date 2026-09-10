'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PenStroke } from '../context/PenContext';
import { useCanvas } from '../context/CanvasContext';
import { usePen } from '../context/PenContext';
import { useRulerSnapping } from './ruler.snapping';
import { useLayerElementAnimation } from './layer.order';
import { isTypingIntoField } from '../utils/keyboard';

const HANDLE_SIZE = 14;
const MIN_SCALE = 0.15;
const MAX_SIZE = 1400;

export function pointsToPath(points: PenStroke['points']) {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const next = points[index + 1];
    path += ` Q ${points[index].x} ${points[index].y} ${(points[index].x + next.x) / 2} ${(points[index].y + next.y) / 2}`;
  }
  const last = points[points.length - 1];
  return `${path} L ${last.x} ${last.y}`;
}

/** The visual part is shared by regular strokes and strokes rendered inside groups. */
export function PenStrokeGraphic({ stroke }: { stroke: PenStroke }) {
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${stroke.baseWidth} ${stroke.baseHeight}`} preserveAspectRatio="none" aria-hidden>
      <path d={pointsToPath(stroke.points)} stroke={stroke.color} strokeWidth={stroke.thickness} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Handle = 'nw' | 'ne' | 'se' | 'sw';

interface DraggablePenStrokeProps {
  stroke: PenStroke;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<PenStroke>) => void;
  onDelete: () => void;
}

export function DraggablePenStroke({ stroke, isSelected, onSelect, onUpdate, onDelete }: DraggablePenStrokeProps) {
  const { zoom } = useCanvas();
  const { startUpdateBatch, endUpdateBatch } = usePen();
  const { snap: snapToGuides, endDrag: endGuideDrag } = useRulerSnapping();
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<Handle | null>(null);
  const dragStart = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const resizeStart = useRef<{ pointerX: number; pointerY: number; x: number; y: number; width: number; height: number } | null>(null);

  const finish = useCallback(() => {
    if (!dragging && !resizing) return;
    setDragging(false);
    setResizing(null);
    dragStart.current = null;
    resizeStart.current = null;
    endUpdateBatch();
    endGuideDrag();
  }, [dragging, resizing, endUpdateBatch, endGuideDrag]);

  useEffect(() => {
    const move = (event: MouseEvent | TouchEvent) => {
      const point = 'touches' in event ? event.touches[0] : event;
      if (!point) return;
      if (dragStart.current) {
        const x = dragStart.current.x + (point.clientX - dragStart.current.pointerX) / zoom;
        const y = dragStart.current.y + (point.clientY - dragStart.current.pointerY) / zoom;
        onUpdate(snapToGuides({ id: stroke.id, x, y, width: stroke.width, height: stroke.height }));
      }
      if (resizing && resizeStart.current) {
        const start = resizeStart.current;
        const dx = (point.clientX - start.pointerX) / zoom;
        const dy = (point.clientY - start.pointerY) / zoom;
        const horizontal = resizing.includes('e') ? dx : -dx;
        const vertical = resizing.includes('s') ? dy : -dy;
        const scale = Math.max(MIN_SCALE, Math.min(MAX_SIZE / Math.max(stroke.baseWidth, stroke.baseHeight), Math.max((start.width + horizontal) / stroke.baseWidth, (start.height + vertical) / stroke.baseHeight)));
        const width = stroke.baseWidth * scale;
        const height = stroke.baseHeight * scale;
        onUpdate({
          width,
          height,
          x: resizing.includes('w') ? start.x + start.width - width : start.x,
          y: resizing.includes('n') ? start.y + start.height - height : start.y,
        });
      }
    };
    if (!dragging && !resizing) return;
    const preventTouchMove = (event: TouchEvent) => { event.preventDefault(); move(event); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', finish);
    document.addEventListener('touchmove', preventTouchMove, { passive: false });
    document.addEventListener('touchend', finish);
    document.addEventListener('touchcancel', finish);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', finish);
      document.removeEventListener('touchmove', preventTouchMove);
      document.removeEventListener('touchend', finish);
      document.removeEventListener('touchcancel', finish);
    };
  }, [dragging, resizing, finish, onUpdate, snapToGuides, stroke, zoom]);

  useEffect(() => {
    const removeOnKey = (event: KeyboardEvent) => {
      if (isTypingIntoField(event)) return;
      if (isSelected && (event.key === 'Backspace' || event.key === 'Delete')) {
        event.preventDefault();
        onDelete();
      }
    };
    window.addEventListener('keydown', removeOnKey);
    return () => window.removeEventListener('keydown', removeOnKey);
  }, [isSelected, onDelete]);

  const startDrag = (clientX: number, clientY: number) => {
    if (stroke.isLocked) return;
    onSelect();
    dragStart.current = { pointerX: clientX, pointerY: clientY, x: stroke.x, y: stroke.y };
    startUpdateBatch();
    setDragging(true);
  };
  const startResize = (event: React.MouseEvent | React.TouchEvent, handle: Handle) => {
    if (stroke.isLocked) return;
    event.preventDefault();
    event.stopPropagation();
    const point = 'touches' in event ? event.touches[0] : event;
    if (!point) return;
    resizeStart.current = { pointerX: point.clientX, pointerY: point.clientY, x: stroke.x, y: stroke.y, width: stroke.width, height: stroke.height };
    startUpdateBatch();
    setResizing(handle);
  };

  const { animStyle, animKey } = useLayerElementAnimation(stroke.id);

  return (
    <div
      key={`${stroke.id}-${animKey ?? 'idle'}`}
      data-canvas-element
      className="absolute"
      style={{
        left: stroke.x,
        top: stroke.y,
        width: stroke.width,
        height: stroke.height,
        zIndex: isSelected ? (stroke.zIndex ?? 1) + 1000 : (stroke.zIndex ?? 1),
        cursor: dragging ? 'grabbing' : 'move',
        touchAction: 'none',
        userSelect: 'none',
        ...animStyle,
      }}
      onMouseDown={event => { event.preventDefault(); event.stopPropagation(); startDrag(event.clientX, event.clientY); }}
      onTouchStart={event => { if (event.touches.length === 1) { event.stopPropagation(); startDrag(event.touches[0].clientX, event.touches[0].clientY); } }}
      onClick={event => { event.stopPropagation(); onSelect(); }}
    >
      <PenStrokeGraphic stroke={stroke} />
      {isSelected && !dragging && !resizing && (
        <>
          <div data-no-export="true" className="pointer-events-none absolute" style={{ inset: -3, border: '1px dashed rgba(99,102,241,0.9)', borderRadius: 3 }} />
          {!stroke.isLocked && (
            <>
              {(['nw', 'ne', 'se', 'sw'] as Handle[]).map(handle => (
                <div
                  key={handle}
                  data-no-export="true"
                  className="absolute bg-white border-2 border-black rounded-sm"
                  style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, left: handle.includes('w') ? -HANDLE_SIZE / 2 : undefined, right: handle.includes('e') ? -HANDLE_SIZE / 2 : undefined, top: handle.includes('n') ? -HANDLE_SIZE / 2 : undefined, bottom: handle.includes('s') ? -HANDLE_SIZE / 2 : undefined, cursor: `${handle}-resize`, zIndex: 2 }}
                  onMouseDown={event => startResize(event, handle)}
                  onTouchStart={event => startResize(event, handle)}
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
