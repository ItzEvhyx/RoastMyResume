'use client';

/**
 * container.tools.tsx
 *
 * LassoCanvas — rendered inside the canvas (sibling of PenCanvas).
 *
 * When the container tool is active it:
 *   1. Attaches mousedown / mousemove / mouseup listeners to [data-canvas-area]
 *      exactly like PenCanvas does, intercepting events before element drag handlers.
 *   2. On mousedown → ContainerContext.startLasso(canvasX, canvasY)
 *   3. On mousemove → ContainerContext.updateLasso(canvasX, canvasY)
 *   4. On mouseup   → hit-tests all elements, calls ContainerContext.commitLasso()
 *
 * The SVG overlay has zIndex 10 and pointerEvents auto while active (same as
 * PenCanvas), so element drag/select handlers never fire during a lasso drag.
 *
 * Hit testing lives here so this file owns the full drag→select cycle,
 * keeping canvas.web.tsx unchanged.
 */

import { useEffect, useRef } from 'react';
import { useContainer } from '../../context/ContainerContext';
import { useText } from '../../context/TextContext';
import { useDivider } from '../../context/DividerContext';
import { useIcon } from '../../context/IconContext';
import { usePen } from '../../context/PenContext';
import { useCanvas } from '../../context/CanvasContext';
import { getTextHeight, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../canvas/safe.area';
import type { SelectedElementIds } from '../../context/ContainerContext';

// ─── Hit-test helper ──────────────────────────────────────────────────────────

interface Rect { x: number; y: number; w: number; h: number }

/** Returns true if element rect overlaps lasso rect (partial overlap counts). */
function overlaps(el: Rect, lasso: Rect): boolean {
  return (
    el.x < lasso.x + lasso.w &&
    el.x + el.w > lasso.x &&
    el.y < lasso.y + lasso.h &&
    el.y + el.h > lasso.y
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LassoCanvas() {
  const {
    isLassoActive,
    lassoState,
    lassoRect,
    startLasso,
    updateLasso,
    commitLasso,
    clearLasso,
  } = useContainer();

  const { textElements, setSelectedId } = useText();
  const { dividerElements, setSelectedDividerId } = useDivider();
  const { iconElements, setSelectedIconId } = useIcon();
  const { strokes, setSelectedStrokeId } = usePen();
  const { zoom } = useCanvas();

  const svgRef = useRef<SVGSVGElement>(null);
  const isDrawingRef = useRef(false);

  // ── Coordinate conversion ────────────────────────────────────────────────
  const toCanvasCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const inv = svg.getScreenCTM()?.inverse();
    if (!inv) return { x: 0, y: 0 };
    const p = pt.matrixTransform(inv);
    return { x: p.x, y: p.y };
  };

  // ── Hit-test on commit ───────────────────────────────────────────────────
  const hitTest = (rect: { x: number; y: number; width: number; height: number }): SelectedElementIds => {
    const lasso: Rect = { x: rect.x, y: rect.y, w: rect.width, h: rect.height };

    const textIds = textElements
      .filter(el => overlaps({ x: el.x, y: el.y, w: el.width, h: getTextHeight(el) }, lasso))
      .map(el => el.id);

    const dividerIds = dividerElements
      .filter(el => overlaps({ x: el.x, y: el.y, w: el.width, h: el.thickness ?? 2 }, lasso))
      .map(el => el.id);

    const iconIds = iconElements
      .filter(el => overlaps({ x: el.x, y: el.y, w: el.width ?? el.size, h: el.height ?? el.size }, lasso))
      .map(el => el.id);

    const strokeIds = strokes
      .filter(el => overlaps({ x: el.x, y: el.y, w: el.width, h: el.height }, lasso))
      .map(el => el.id);

    return { textIds, dividerIds, iconIds, strokeIds };
  };

  // ── Event listeners on [data-canvas-area] ────────────────────────────────
  useEffect(() => {
    if (!isLassoActive) return;

    const canvas = document.querySelector('[data-canvas-area]') as HTMLElement | null;
    if (!canvas) return;

    const begin = (clientX: number, clientY: number) => {
      setSelectedId(null);
      setSelectedDividerId(null);
      setSelectedIconId(null);
      setSelectedStrokeId(null);
      const { x, y } = toCanvasCoords(clientX, clientY);
      isDrawingRef.current = true;
      startLasso(x, y);
    };

    const move = (clientX: number, clientY: number) => {
      if (!isDrawingRef.current) return;
      const { x, y } = toCanvasCoords(clientX, clientY);
      updateLasso(x, y);
    };

    const end = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      const rectEl = svgRef.current?.querySelector('[data-lasso-rect]');
      if (!rectEl) {
        commitLasso({ textIds: [], dividerIds: [], iconIds: [], strokeIds: [] });
        return;
      }
      const rx = parseFloat(rectEl.getAttribute('x') ?? '0');
      const ry = parseFloat(rectEl.getAttribute('y') ?? '0');
      const rw = parseFloat(rectEl.getAttribute('width') ?? '0');
      const rh = parseFloat(rectEl.getAttribute('height') ?? '0');

      if (rw < 4 && rh < 4) {
        commitLasso({ textIds: [], dividerIds: [], iconIds: [], strokeIds: [] });
        return;
      }

      const sel = hitTest({ x: rx, y: ry, width: rw, height: rh });
      commitLasso(sel);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      begin(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      move(e.clientX, e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      end();
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Touch / pen — mouse already handled above to avoid double-start
      if (e.pointerType === 'mouse') return;
      e.preventDefault();
      e.stopPropagation();
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      begin(e.clientX, e.clientY);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      if (!isDrawingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      move(e.clientX, e.clientY);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      if (!isDrawingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      end();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        isDrawingRef.current = false;
        clearLasso();
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown, { capture: true });
    canvas.addEventListener('mousemove', handleMouseMove, { capture: true });
    window.addEventListener('mouseup', handleMouseUp, { capture: true });
    canvas.addEventListener('pointerdown', handlePointerDown, { capture: true });
    canvas.addEventListener('pointermove', handlePointerMove, { capture: true });
    window.addEventListener('pointerup', handlePointerUp, { capture: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown, { capture: true });
      canvas.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
      canvas.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      canvas.removeEventListener('pointermove', handlePointerMove, { capture: true });
      window.removeEventListener('pointerup', handlePointerUp, { capture: true });
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isLassoActive,
    startLasso,
    updateLasso,
    commitLasso,
    clearLasso,
    textElements,
    dividerElements,
    iconElements,
    strokes,
    setSelectedId,
    setSelectedDividerId,
    setSelectedIconId,
    setSelectedStrokeId,
    zoom,
  ]);

  // ── Render ───────────────────────────────────────────────────────────────
  // Always mount the SVG so svgRef is available; control visibility via CSS.
  const isVisible = isLassoActive && lassoRect !== null;
  const isCommitted = lassoState === 'committed';

  return (
    <svg
      ref={svgRef}
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        overflow: 'visible',
        pointerEvents: isLassoActive ? 'auto' : 'none',
        zIndex: isLassoActive ? 200000 : 0,
        cursor: isLassoActive && !isCommitted ? 'crosshair' : 'default',
      }}
    >
      {isVisible && lassoRect && (
        <>
          {/* Semi-transparent fill */}
          <rect
            data-lasso-rect
            x={lassoRect.x}
            y={lassoRect.y}
            width={lassoRect.width}
            height={lassoRect.height}
            fill={isCommitted ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.10)'}
            stroke={isCommitted ? 'rgba(99,102,241,0.9)' : 'rgba(99,102,241,0.75)'}
            strokeWidth={1.5 / zoom}
            strokeDasharray={isCommitted ? 'none' : `${6 / zoom} ${3 / zoom}`}
            rx={4 / zoom}
          />

          {/* Highlight rings on hit elements while drawing */}
          {!isCommitted && (
            <>
              {textElements
                .filter(el => overlaps(
                  { x: el.x, y: el.y, w: el.width, h: getTextHeight(el) },
                  { x: lassoRect.x, y: lassoRect.y, w: lassoRect.width, h: lassoRect.height },
                ))
                .map(el => (
                  <rect
                    key={`hit-text-${el.id}`}
                    x={el.x - 2}
                    y={el.y - 2}
                    width={el.width + 4}
                    height={getTextHeight(el) + 4}
                    fill="none"
                    stroke="rgba(99,102,241,0.5)"
                    strokeWidth={1 / zoom}
                    rx={3 / zoom}
                  />
                ))}
              {dividerElements
                .filter(el => overlaps(
                  { x: el.x, y: el.y, w: el.width, h: el.thickness ?? 2 },
                  { x: lassoRect.x, y: lassoRect.y, w: lassoRect.width, h: lassoRect.height },
                ))
                .map(el => (
                  <rect
                    key={`hit-div-${el.id}`}
                    x={el.x - 2}
                    y={el.y - 2}
                    width={el.width + 4}
                    height={(el.thickness ?? 2) + 4}
                    fill="none"
                    stroke="rgba(99,102,241,0.5)"
                    strokeWidth={1 / zoom}
                    rx={3 / zoom}
                  />
                ))}
              {iconElements
                .filter(el => overlaps(
                  { x: el.x, y: el.y, w: el.width ?? el.size, h: el.height ?? el.size },
                  { x: lassoRect.x, y: lassoRect.y, w: lassoRect.width, h: lassoRect.height },
                ))
                .map(el => (
                  <rect
                    key={`hit-icon-${el.id}`}
                    x={el.x - 2}
                    y={el.y - 2}
                    width={(el.width ?? el.size) + 4}
                    height={(el.height ?? el.size) + 4}
                    fill="none"
                    stroke="rgba(99,102,241,0.5)"
                    strokeWidth={1 / zoom}
                    rx={3 / zoom}
                  />
                ))}
              {strokes
                .filter(el => overlaps(
                  { x: el.x, y: el.y, w: el.width, h: el.height },
                  { x: lassoRect.x, y: lassoRect.y, w: lassoRect.width, h: lassoRect.height },
                ))
                .map(el => (
                  <rect
                    key={`hit-stroke-${el.id}`}
                    x={el.x - 2}
                    y={el.y - 2}
                    width={el.width + 4}
                    height={el.height + 4}
                    fill="none"
                    stroke="rgba(99,102,241,0.5)"
                    strokeWidth={1 / zoom}
                    rx={3 / zoom}
                  />
                ))}
            </>
          )}
        </>
      )}
    </svg>
  );
}
