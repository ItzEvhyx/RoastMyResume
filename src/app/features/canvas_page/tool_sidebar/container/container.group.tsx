'use client';

/**
 * container.group.tsx
 *
 * Two exports:
 *
 *  1. SelectionBoundary  — an SVG overlay (rendered alongside LassoCanvas)
 *     that draws a solid purple bounding-box around all committed selected
 *     elements with individual highlight rings.
 *
 *  2. ContainerGroupToolbar — a floating pill rendered in the fixed viewport
 *     (outside the canvas transform chain) that appears above the selection
 *     bounding box with two actions:
 *       • Group   → groups all selected elements by computing their bounding
 *                   box, recording a composite undo, then clearing the lasso.
 *                   Currently "grouping" is implemented as deselecting and
 *                   exiting container mode — a future iteration can add a
 *                   proper GroupElement to IconContext.
 *       • Delete  → composite-undoable delete of every selected element.
 */

import { useCallback, useMemo } from 'react';
import { Poppins } from 'next/font/google';
import { useContainer } from '../../context/ContainerContext';
import { useText } from '../../context/TextContext';
import { useDivider } from '../../context/DividerContext';
import { useIcon } from '../../context/IconContext';
import { usePen } from '../../context/PenContext';
import { useCanvas } from '../../context/CanvasContext';
import { useGroup } from '../../context/GroupContext';
import { getTextHeight, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../canvas/safe.area';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-poppins',
});

// ─── Bounding box helpers ─────────────────────────────────────────────────────

interface BBox { x: number; y: number; w: number; h: number }

function union(boxes: BBox[]): BBox | null {
  if (boxes.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const b of boxes) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// ─── SelectionBoundary ────────────────────────────────────────────────────────

/**
 * Rendered inside the canvas SVG layer. Shows per-element highlight rings and
 * an outer bounding box around the whole committed selection.
 */
export function SelectionBoundary() {
  const { lassoState, selection } = useContainer();
  const { textElements } = useText();
  const { dividerElements } = useDivider();
  const { iconElements } = useIcon();
  const { strokes } = usePen();
  const { zoom } = useCanvas();

  if (lassoState !== 'committed') return null;

  const selectedTexts = textElements.filter(el => selection.textIds.includes(el.id));
  const selectedDividers = dividerElements.filter(el => selection.dividerIds.includes(el.id));
  const selectedIcons = iconElements.filter(el => selection.iconIds.includes(el.id));
  const selectedStrokes = strokes.filter(el => selection.strokeIds.includes(el.id));

  const allBoxes: BBox[] = [
    ...selectedTexts.map(el => ({ x: el.x, y: el.y, w: el.width, h: getTextHeight(el) })),
    ...selectedDividers.map(el => ({ x: el.x, y: el.y, w: el.width, h: el.thickness ?? 2 })),
    ...selectedIcons.map(el => ({ x: el.x, y: el.y, w: el.width ?? el.size, h: el.height ?? el.size })),
    ...selectedStrokes.map(el => ({ x: el.x, y: el.y, w: el.width, h: el.height })),
  ];

  const outer = union(allBoxes);
  const pad = 10;

  return (
    <>
      {/* Per-element highlight rings */}
      {selectedTexts.map(el => (
        <rect
          key={`sel-text-${el.id}`}
          x={el.x - 3}
          y={el.y - 3}
          width={el.width + 6}
          height={getTextHeight(el) + 6}
          fill="rgba(99,102,241,0.06)"
          stroke="rgba(99,102,241,0.7)"
          strokeWidth={1.5 / zoom}
          rx={4 / zoom}
        />
      ))}
      {selectedDividers.map(el => (
        <rect
          key={`sel-div-${el.id}`}
          x={el.x - 3}
          y={el.y - 3}
          width={el.width + 6}
          height={(el.thickness ?? 2) + 6}
          fill="rgba(99,102,241,0.06)"
          stroke="rgba(99,102,241,0.7)"
          strokeWidth={1.5 / zoom}
          rx={4 / zoom}
        />
      ))}
      {selectedIcons.map(el => (
        <rect
          key={`sel-icon-${el.id}`}
          x={el.x - 3}
          y={el.y - 3}
          width={(el.width ?? el.size) + 6}
          height={(el.height ?? el.size) + 6}
          fill="rgba(99,102,241,0.06)"
          stroke="rgba(99,102,241,0.7)"
          strokeWidth={1.5 / zoom}
          rx={4 / zoom}
        />
      ))}
      {selectedStrokes.map(el => (
        <rect
          key={`sel-stroke-${el.id}`}
          x={el.x - 3}
          y={el.y - 3}
          width={el.width + 6}
          height={el.height + 6}
          fill="rgba(99,102,241,0.06)"
          stroke="rgba(99,102,241,0.7)"
          strokeWidth={1.5 / zoom}
          rx={4 / zoom}
        />
      ))}

      {/* Outer bounding box */}
      {outer && (
        <rect
          x={outer.x - pad}
          y={outer.y - pad}
          width={outer.w + pad * 2}
          height={outer.h + pad * 2}
          fill="none"
          stroke="rgba(99,102,241,0.9)"
          strokeWidth={2 / zoom}
          strokeDasharray={`${8 / zoom} ${4 / zoom}`}
          rx={6 / zoom}
        />
      )}
    </>
  );
}

// ─── ContainerGroupToolbar ────────────────────────────────────────────────────

/**
 * Floating pill toolbar rendered fixed in the viewport (outside the canvas
 * transform chain). Positions itself above the selection bounding box by
 * converting canvas coords → screen coords using the canvas element's rect.
 */
export function ContainerGroupToolbar() {
  const { lassoState, selection, selectionCount, clearLasso, setIsLassoActive } = useContainer();
  const { textElements, deleteElement, activeTool, setActiveTool } = useText();
  const { dividerElements, deleteDivider } = useDivider();
  const { iconElements, deleteIcon } = useIcon();
  const { strokes, removeStroke } = usePen();
  const { zoom, pan } = useCanvas();
  const { addGroup } = useGroup();

  // Compute bounding box of selected elements in canvas coords
  const boundingBox = useMemo(() => {
    const selectedTexts = textElements.filter(el => selection.textIds.includes(el.id));
    const selectedDividers = dividerElements.filter(el => selection.dividerIds.includes(el.id));
    const selectedIcons = iconElements.filter(el => selection.iconIds.includes(el.id));
    const selectedStrokes = strokes.filter(el => selection.strokeIds.includes(el.id));

    const boxes: BBox[] = [
      ...selectedTexts.map(el => ({ x: el.x, y: el.y, w: el.width, h: getTextHeight(el) })),
      ...selectedDividers.map(el => ({ x: el.x, y: el.y, w: el.width, h: el.thickness ?? 2 })),
      ...selectedIcons.map(el => ({ x: el.x, y: el.y, w: el.width ?? el.size, h: el.height ?? el.size })),
      ...selectedStrokes.map(el => ({ x: el.x, y: el.y, w: el.width, h: el.height })),
    ];

    return union(boxes);
  }, [selection, textElements, dividerElements, iconElements, strokes]);

  // Convert canvas bbox top-center to screen position
  const toolbarPosition = useMemo(() => {
    if (!boundingBox) return null;
    if (typeof document === 'undefined') return null;

    // Find the canvas DOM element to get its screen rect
    const canvasEl = document.getElementById('resume-canvas');
    if (!canvasEl) return null;

    const rect = canvasEl.getBoundingClientRect();

    // Canvas coords → screen coords
    // The canvas element is scaled via CSS transform: scale(zoom) so its
    // getBoundingClientRect() already includes the zoom.
    const scaleX = rect.width / CANVAS_WIDTH;
    const scaleY = rect.height / CANVAS_HEIGHT;

    const centerXScreen = rect.left + (boundingBox.x + boundingBox.w / 2) * scaleX;
    const topYScreen = rect.top + (boundingBox.y - 10) * scaleY;

    return { x: centerXScreen, y: topYScreen };
  }, [boundingBox, zoom, pan]);

  // ── Delete handler ───────────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    // Each context records a valid undo entry for its own deletion. Avoid a
    // duplicate no-op entry here, which previously consumed an undo step.
    selection.textIds.forEach(id => deleteElement(id));
    selection.dividerIds.forEach(id => deleteDivider(id));
    selection.iconIds.forEach(id => deleteIcon(id));
    selection.strokeIds.forEach(id => removeStroke(id));

    clearLasso();
  }, [
    selection,
    deleteElement,
    deleteDivider,
    deleteIcon,
    removeStroke,
    clearLasso,
  ]);

  // ── Group handler ────────────────────────────────────────────────────────
  const handleGroup = useCallback(() => {
    if (!boundingBox) return;

    const selectedTexts = textElements.filter(el => selection.textIds.includes(el.id));
    const selectedDividers = dividerElements.filter(el => selection.dividerIds.includes(el.id));
    const selectedIcons = iconElements.filter(el => selection.iconIds.includes(el.id));
    const selectedStrokes = strokes.filter(el => selection.strokeIds.includes(el.id));

    // 1. Create the group element with snapshots of all members
    addGroup(
      { x: boundingBox.x, y: boundingBox.y, width: boundingBox.w, height: boundingBox.h },
      { texts: selectedTexts, dividers: selectedDividers, icons: selectedIcons, strokes: selectedStrokes },
    );

    // 2. Remove the original elements from their contexts so they don't
    //    render independently while grouped.
    selection.textIds.forEach(id => deleteElement(id));
    selection.dividerIds.forEach(id => deleteDivider(id));
    selection.iconIds.forEach(id => deleteIcon(id));
    selection.strokeIds.forEach(id => removeStroke(id));

    // 3. Exit lasso mode and toggle off container tool
    clearLasso();
    setIsLassoActive(false);
    if (activeTool === 'container') {
      setActiveTool(null);
    }
  }, [
    boundingBox,
    selection,
    textElements,
    dividerElements,
    iconElements,
    strokes,
    addGroup,
    deleteElement,
    deleteDivider,
    deleteIcon,
    removeStroke,
    clearLasso,
    setIsLassoActive,
    activeTool,
    setActiveTool,
  ]);

  // ── Visibility guard ─────────────────────────────────────────────────────
  if (lassoState !== 'committed' || selectionCount === 0 || !toolbarPosition) return null;

  const TOOLBAR_HEIGHT = 52;
  const TOOLBAR_GAP = 14;

  return (
    <div
      className={`pointer-events-auto fixed select-none ${poppins.variable}`}
      style={{
        left: toolbarPosition.x,
        top: toolbarPosition.y - TOOLBAR_HEIGHT - TOOLBAR_GAP,
        transform: 'translateX(-50%)',
        zIndex: 60,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
      onMouseDown={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <div
        className="flex items-center gap-1"
        style={{
          height: TOOLBAR_HEIGHT,
          background: 'rgba(30, 32, 38, 0.94)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
          borderRadius: 999,
          padding: '0 10px',
        }}
      >
        {/* Selection count badge */}
        <span
          style={{
            fontFamily: 'var(--font-poppins)',
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.45)',
            padding: '0 6px',
            whiteSpace: 'nowrap',
          }}
        >
          {selectionCount} selected
        </span>

        <Divider />

        {/* Group button */}
        <ToolbarButton
          onClick={handleGroup}
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M6.5 10v4M17.5 10v4M10 6.5h4M10 17.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
          label="Group"
          color="#ffffff"
        />

        <Divider />

        {/* Delete button */}
        <ToolbarButton
          onClick={handleDelete}
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          label="Delete"
          color="rgba(255,120,120,1)"
        />
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 24,
        background: 'rgba(255,255,255,0.15)',
        marginInline: 4,
        flexShrink: 0,
      }}
    />
  );
}

function ToolbarButton({
  onClick,
  icon,
  label,
  color,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full px-3 transition-all duration-150 active:scale-95"
      style={{
        height: 34,
        background: 'transparent',
        border: 'none',
        color,
        fontFamily: 'var(--font-poppins)',
        fontWeight: 700,
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

