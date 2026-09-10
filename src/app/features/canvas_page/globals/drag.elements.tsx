'use client';

/**
 * globals/drag.elements.tsx
 *
 * Universal drag + resize logic for every canvas element.
 *
 * Exports:
 *   useDragAndResize()   — generic hook; works for any element type
 *   DraggableText        — text element wrapper
 *   DraggableDivider     — divider element wrapper
 *
 * Adding a new element type later:
 *   1. Define its interface here (or import from its context)
 *   2. Call useDragAndResize() with its position/size refs
 *   3. Build its render wrapper — drag/resize events are already handled
 */

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Poppins } from 'next/font/google';
import { useCanvas } from '@/app/features/canvas_page/context/CanvasContext';
import { useText } from '@/app/features/canvas_page/context/TextContext';
import { useIcon } from '@/app/features/canvas_page/context/IconContext';
import { useDivider } from '@/app/features/canvas_page/context/DividerContext';
import { isTypingIntoField } from '../utils/keyboard';
import { estimateTextHeight } from '../canvas/safe.area';
import { TextToolbar } from '../tool_sidebar/texts/text.tools';
import { DividerToolbar } from '../tool_sidebar/divider/divider.tools';
import { CATEGORIES } from '../tool_sidebar/texts/font.size';
import {
  convertListContent,
  convertListContentInRange,
  detectListType,
  expandToLineBounds,
  nextListType,
  ListType,
} from '../tool_sidebar/texts/bulletpoint';
import {
  indentLinesInRange,
  outdentLinesInRange,
} from '../tool_sidebar/texts/indent.text';
import { getNextTextAlign } from '../tool_sidebar/texts/alignment';
import {
  applyExecCommand,
  contentToHtml,
  hasNonCollapsedSelection,
  htmlToPlain,
  looksLikeHtml,
  rangeToPlainOffsets,
  selectionInside,
  serializeEditorHtml,
  setPlainSelection,
} from '../utils/rich.text';
import { isRasterImageUrl } from '../utils/paste.image';
import { useRulerSnapping } from './ruler.snapping';
import { useLayerElementAnimation } from './layer.order';

/** Selected chrome (toolbar + dropdowns) must sit above Denise highlights (150000). */
const SELECTED_CHROME_Z = 200010;

// ─────────────────────────────────────────────────────────────────────────────
// Re-export element types so importers only need this one file
// ─────────────────────────────────────────────────────────────────────────────
export type { TextElement } from '../context/TextContext';
export type { DividerElement } from '../context/DividerContext';

// ─────────────────────────────────────────────────────────────────────────────
// Shared constants
// ─────────────────────────────────────────────────────────────────────────────
const HANDLE_SIZE = 16;
const HIT_PADDING = 8; // extra invisible hit area around thin divider line

// ─────────────────────────────────────────────────────────────────────────────
// Poppins font (text element)
// ─────────────────────────────────────────────────────────────────────────────
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-poppins',
});

// ─────────────────────────────────────────────────────────────────────────────
// Stepped font-size helper (text resize via corner handles)
// ─────────────────────────────────────────────────────────────────────────────
function steppedFontSize(
  current: number,
  scaleDelta: number,
  category: string | null | undefined,
): number {
  if (!category) return current;
  const cat = CATEGORIES.find(c => c.scale === category);
  if (!cat) return current;
  const sizes = cat.sizes;
  const idx = sizes.indexOf(current);
  if (scaleDelta > 0) {
    if (idx <= 0) return sizes[0];
    return sizes[idx - 1];
  } else {
    if (idx < 0) return sizes.reduce((a, b) => Math.abs(b - current) < Math.abs(a - current) ? b : a);
    if (idx >= sizes.length - 1) return sizes[sizes.length - 1];
    return sizes[idx + 1];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic drag hook
// Snapshot-based: records the element's position at drag-start alongside the
// mouse origin so onMove always gets the correct absolute target position.
// ─────────────────────────────────────────────────────────────────────────────
interface UseDragOptions {
  zoom: number;
  /** Called with the new absolute (x, y) the element should move to */
  onMove: (x: number, y: number) => void;
  onEnd?: () => void;
  /** Called when drag starts, for undo batching */
  onStart?: () => void;
}

function useDrag({ zoom, onMove, onEnd, onStart }: UseDragOptions) {
  const [isDragging, setIsDragging] = useState(false);
  // Store both the pointer origin AND the element origin at drag-start
  const snapshot = useRef<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null);

  // Use a ref for the callbacks so the event listeners never go stale
  const onMoveRef = useRef(onMove);
  const onEndRef = useRef(onEnd);
  const onStartRef = useRef(onStart);
  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);
  useEffect(() => { onStartRef.current = onStart; }, [onStart]);
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!snapshot.current) return;
    const { mouseX, mouseY, elX, elY } = snapshot.current;
    onMoveRef.current(
      elX + (e.clientX - mouseX) / zoomRef.current,
      elY + (e.clientY - mouseY) / zoomRef.current,
    );
  }, []); // stable — never recreated

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    snapshot.current = null;
    onEndRef.current?.();
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 1 || !snapshot.current) return;
    e.stopPropagation();
    const t = e.touches[0];
    const { mouseX, mouseY, elX, elY } = snapshot.current;
    onMoveRef.current(
      elX + (t.clientX - mouseX) / zoomRef.current,
      elY + (t.clientY - mouseY) / zoomRef.current,
    );
  }, []); // stable

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    snapshot.current = null;
    onEndRef.current?.();
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  /** Call on mousedown — pass current mouse position AND element's current position */
  const startMouse = useCallback((e: React.MouseEvent, elX: number, elY: number) => {
    snapshot.current = { mouseX: e.clientX, mouseY: e.clientY, elX, elY };
    setIsDragging(true);
    onStartRef.current?.();
  }, []);

  /** Call on touchstart — pass touch position AND element's current position */
  const startTouch = useCallback((clientX: number, clientY: number, elX: number, elY: number) => {
    snapshot.current = { mouseX: clientX, mouseY: clientY, elX, elY };
    setIsDragging(true);
    onStartRef.current?.();
  }, []);

  return { isDragging, startMouse, startTouch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic resize hook
// Handles mouse + touch resize for any handle set.  Callers supply applyResize.
// ─────────────────────────────────────────────────────────────────────────────
type ResizeHandleAll = 'nw' | 'ne' | 'se' | 'sw' | 'w' | 'e';

interface ResizeSnapshot {
  mouseX: number;
  mouseY: number;
  x: number;
  y: number;
  width: number;
  height?: number;
  fontSize: number;
  textCategory?: string | null;
}

interface UseResizeOptions<H extends string> {
  zoom: number;
  applyResize: (handle: H, snap: ResizeSnapshot, dx: number, dy: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

function useResize<H extends string>({ zoom, applyResize, onStart, onEnd }: UseResizeOptions<H>) {
  const [activeHandle, setActiveHandle] = useState<H | null>(null);
  const snapshot = useRef<ResizeSnapshot | null>(null);
  const applyResizeRef = useRef(applyResize);
  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);
  const zoomRef = useRef(zoom);

  useEffect(() => { applyResizeRef.current = applyResize; }, [applyResize]);
  useEffect(() => { onStartRef.current = onStart; }, [onStart]);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeHandle || !snapshot.current) return;
    applyResizeRef.current(
      activeHandle,
      snapshot.current,
      (e.clientX - snapshot.current.mouseX) / zoomRef.current,
      (e.clientY - snapshot.current.mouseY) / zoomRef.current,
    );
  }, [activeHandle]);

  const handleMouseUp = useCallback(() => {
    setActiveHandle(null);
    snapshot.current = null;
    onEndRef.current?.();
  }, []);

  useEffect(() => {
    if (!activeHandle) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeHandle, handleMouseMove, handleMouseUp]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!activeHandle || !snapshot.current || e.touches.length < 1) return;
    e.stopPropagation();
    const t = e.touches[0];
    applyResizeRef.current(
      activeHandle,
      snapshot.current,
      (t.clientX - snapshot.current.mouseX) / zoomRef.current,
      (t.clientY - snapshot.current.mouseY) / zoomRef.current,
    );
  }, [activeHandle]);

  const handleTouchEnd = useCallback(() => {
    setActiveHandle(null);
    snapshot.current = null;
    onEndRef.current?.();
  }, []);

  useEffect(() => {
    if (!activeHandle) return;
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [activeHandle, handleTouchMove, handleTouchEnd]);

  const startMouse = useCallback(
    (e: React.MouseEvent, handle: H, snap: Omit<ResizeSnapshot, 'mouseX' | 'mouseY'>) => {
      e.stopPropagation();
      e.preventDefault();
      snapshot.current = { mouseX: e.clientX, mouseY: e.clientY, ...snap };
      setActiveHandle(handle);
      onStartRef.current?.();
    },
    [],
  );

  const startTouch = useCallback(
    (e: React.TouchEvent, handle: H, snap: Omit<ResizeSnapshot, 'mouseX' | 'mouseY'>) => {
      if (e.touches.length < 1) return;
      e.stopPropagation();
      e.preventDefault();
      const t = e.touches[0];
      snapshot.current = { mouseX: t.clientX, mouseY: t.clientY, ...snap };
      setActiveHandle(handle);
      onStartRef.current?.();
    },
    [],
  );

  return { activeHandle, startMouse, startTouch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared long-press hook (mobile copy/delete pill)
// ─────────────────────────────────────────────────────────────────────────────
function useLongPress(onLongPress?: () => void) {
  const [showPill, setShowPill] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(
    (startX: number, startY: number, cancelDrag: () => void) => {
      setShowPill(false);
      if (timer.current) clearTimeout(timer.current);

      timer.current = setTimeout(() => {
        cancelDrag();
        setShowPill(true);
        onLongPress?.();
      }, 600);

      const cancelOnMove = (e: TouchEvent) => {
        if (e.touches.length < 1) return;
        const t = e.touches[0];
        if (Math.hypot(t.clientX - startX, t.clientY - startY) > 8) {
          if (timer.current) { clearTimeout(timer.current); timer.current = null; }
          document.removeEventListener('touchmove', cancelOnMove);
        }
      };
      const cancelOnEnd = () => {
        if (timer.current) { clearTimeout(timer.current); timer.current = null; }
        document.removeEventListener('touchmove', cancelOnMove);
        document.removeEventListener('touchend', cancelOnEnd);
      };
      document.addEventListener('touchmove', cancelOnMove, { passive: true });
      document.addEventListener('touchend', cancelOnEnd, { once: true });
    },
    [onLongPress],
  );

  const dismiss = useCallback(() => setShowPill(false), []);

  return { showPill, startLongPress: start, dismissPill: dismiss };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared mobile Copy/Delete pill UI
// ─────────────────────────────────────────────────────────────────────────────
function CopyDeletePill({
  onCopy,
  onDelete,
}: {
  onCopy: () => void;
  onDelete: () => void;
}) {
  const btnBase: React.CSSProperties = {
    background: 'rgba(20, 22, 30, 0.92)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderRadius: '20px',
    padding: '8px 22px',
    fontSize: '15px',
    fontWeight: 600,
    fontFamily: 'var(--font-poppins), Arial, sans-serif',
    letterSpacing: '0.01em',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translate(-50%, 10px)',
        zIndex: 999,
        display: 'flex',
        gap: '8px',
      }}
      onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
      onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
    >
      <button
        className={poppins.className}
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onCopy(); }}
        style={{ ...btnBase, color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}
      >
        <span style={{ fontSize: '17px' }}>⎘</span> Copy
      </button>
      <button
        className={poppins.className}
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(); }}
        style={{ ...btnBase, color: '#ef4444', border: '1px solid rgba(239,68,68,0.45)' }}
      >
        Delete
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared selection handles UI
// ─────────────────────────────────────────────────────────────────────────────
type HandleVariant = 'square' | 'circle';

function ResizeHandleNode({
  style,
  variant = 'square',
  cursor,
  onMouseDown,
  onTouchStart,
  dataNoExport = false,
}: {
  style: React.CSSProperties;
  variant?: HandleVariant;
  cursor: string;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  dataNoExport?: boolean;
}) {
  return (
    <div
      data-no-export={dataNoExport ? 'true' : undefined}
      className={`absolute bg-white border-2 border-black ${variant === 'circle' ? 'rounded-full' : 'rounded-sm'}`}
      style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, cursor, zIndex: 2, ...style }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── DraggableText ────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

import type { TextElement } from '../context/TextContext';

const MIN_FONT = 8;
const MAX_FONT = 120;
const MIN_TEXT_WIDTH = 60;
const MAX_TEXT_WIDTH = 1100;

interface DraggableTextProps {
  element: TextElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextElement>) => void;
  onDelete: () => void;
  onDragEnd?: () => void;
  onLongPress?: () => void;
}

export function DraggableText({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDragEnd,
  onLongPress,
}: DraggableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const skipNextContentSync = useRef(false);
  const lastTapRef = useRef<number>(0);
  const { zoom, isDocumentMode } = useCanvas();
  const { startUpdateBatch, endUpdateBatch } = useText();
  const { snap: snapToGuides, endDrag: endGuideDrag } = useRulerSnapping();
  const plainContent = htmlToPlain(element.content || '');
  // Canva-style: frame height tracks wrapped content, not a stale estimate.
  const [frameHeight, setFrameHeight] = useState(() => estimateTextHeight(element));
  const textHeight = frameHeight;

  const measureFrameHeight = useCallback(() => {
    const node = isEditing ? editorRef.current : contentRef.current;
    let measured = 0;
    if (node) {
      const prevHeight = node.style.height;
      node.style.height = 'auto';
      measured = Math.max(node.scrollHeight, node.offsetHeight);
      node.style.height = prevHeight;
    }
    if (measured <= 0) {
      measured = estimateTextHeight(element);
    }
    const next = Math.max(element.fontSize + 8, Math.ceil(measured));
    setFrameHeight((prev) => (Math.abs(prev - next) < 1 ? prev : next));
  }, [
    isEditing,
    element.content,
    element.width,
    element.fontSize,
    element.fontFamily,
    element.fontWeight,
  ]);

  // Keep the control frame locked to live content (width reflow → height grows/shrinks).
  useLayoutEffect(() => {
    measureFrameHeight();
    const node = isEditing ? editorRef.current : contentRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measureFrameHeight());
    ro.observe(node);
    return () => ro.disconnect();
  }, [measureFrameHeight, isEditing]);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const { isDragging, startMouse: startDragMouse, startTouch: startDragTouch } = useDrag({
    zoom,
    onMove: (x, y) => {
      const snapped = snapToGuides({ id: element.id, x, y, width: element.width, height: textHeight });
      onUpdate(snapped);
    },
    onStart: startUpdateBatch,
    onEnd: () => {
      endUpdateBatch();
      endGuideDrag();
      onDragEnd?.();
    },
  });

  // ── Resize ────────────────────────────────────────────────────────────────
  const applyTextResize = useCallback(
    (handle: ResizeHandleAll, snap: ResizeSnapshot, dx: number, dy: number) => {
      if (handle === 'e') {
        onUpdate({ width: Math.max(MIN_TEXT_WIDTH, Math.min(MAX_TEXT_WIDTH, snap.width + dx)) });
      } else if (handle === 'w') {
        const newW = Math.max(MIN_TEXT_WIDTH, Math.min(MAX_TEXT_WIDTH, snap.width - dx));
        onUpdate({ x: snap.x + (snap.width - newW), width: newW });
      } else {
        const scaleDelta =
          handle === 'se' ? dx + dy :
          handle === 'sw' ? -dx + dy :
          handle === 'ne' ? dx - dy :
          -dx - dy; // nw
        const newW = Math.max(MIN_TEXT_WIDTH, Math.min(MAX_TEXT_WIDTH, snap.width + scaleDelta));
        const newFs = Math.max(MIN_FONT, Math.min(MAX_FONT,
          snap.textCategory
            ? steppedFontSize(snap.fontSize, scaleDelta, snap.textCategory)
            : snap.fontSize * (newW / snap.width),
        ));
        if (handle === 'nw' || handle === 'sw') {
          onUpdate({ x: snap.x + (snap.width - newW), width: newW, fontSize: newFs });
        } else {
          onUpdate({ width: newW, fontSize: newFs });
        }
      }
    },
    [onUpdate],
  );

  const { startMouse: startResizeMouse, startTouch: startResizeTouch } =
    useResize<ResizeHandleAll>({ 
      zoom, 
      applyResize: applyTextResize,
      onStart: startUpdateBatch,
      onEnd: () => {
        endUpdateBatch();
        onDragEnd?.();
      },
    });

  // ── Long-press ────────────────────────────────────────────────────────────
  const { showPill, startLongPress, dismissPill } = useLongPress(onLongPress);

  // ── Keyboard delete ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingIntoField(e)) return;
      if (isSelected && !isEditing && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        onDelete();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSelected, isEditing, onDelete]);

  // ── Enter edit mode: seed contentEditable once ────────────────────────────
  useEffect(() => {
    if (!isEditing || !editorRef.current) return;
    const el = editorRef.current;
    el.innerHTML = contentToHtml(element.content || '');
    el.focus();
    const plain = htmlToPlain(element.content || '');
    if (plain === 'Add text') {
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else {
      setPlainSelection(el, plain.length, plain.length);
    }
    // Let natural content height drive the frame (Canva auto-height).
    el.style.height = 'auto';
    measureFrameHeight();
    // Only run when entering edit mode — not on every content keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // External content updates while editing (e.g. toolbar list rewrite)
  useEffect(() => {
    if (!isEditing || !editorRef.current) return;
    if (skipNextContentSync.current) {
      skipNextContentSync.current = false;
      return;
    }
    if (document.activeElement === editorRef.current) return;
    editorRef.current.innerHTML = contentToHtml(element.content || '');
    editorRef.current.style.height = 'auto';
    measureFrameHeight();
  }, [isEditing, element.content, measureFrameHeight]);

  // Remeasure after width / typography changes (side-handle reflow like Canva).
  useLayoutEffect(() => {
    measureFrameHeight();
  }, [element.width, element.fontSize, element.fontFamily, element.fontWeight, element.content, measureFrameHeight]);

  const applyIndent = (outdent: boolean) => {
    const root = isEditing ? editorRef.current : null;
    if (root) {
      const range = selectionInside(root);
      const offsets = range ? rangeToPlainOffsets(root, range) : null;
      const value = htmlToPlain(serializeEditorHtml(root));
      const start = offsets?.start ?? 0;
      const end = offsets?.end ?? value.length;
      const result = outdent
        ? outdentLinesInRange(value, start, end)
        : indentLinesInRange(value, start, end);
      if (result.content === value) return;
      skipNextContentSync.current = true;
      onUpdate({ content: result.content });
      requestAnimationFrame(() => {
        if (!editorRef.current) return;
        editorRef.current.innerHTML = contentToHtml(result.content);
        setPlainSelection(editorRef.current, result.selectionStart, result.selectionEnd);
        growEditor();
      });
      return;
    }
    const value = htmlToPlain(element.content || '');
    const result = outdent
      ? outdentLinesInRange(value, 0, value.length)
      : indentLinesInRange(value, 0, value.length);
    if (result.content !== value) onUpdate({ content: result.content });
  };

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing || element.isLocked || isDocumentMode) {
      if (isDocumentMode) onSelect();
      return;
    }
    e.preventDefault();
    onSelect();
    startDragMouse(e, element.x, element.y);
  };

  // ── Touch handlers ────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditing || element.isLocked || e.touches.length !== 1) return;
    e.stopPropagation();

    const now = Date.now();
    if (isDocumentMode) {
      onSelect();
      return;
    }
    if (isSelected && !element.isLocked && now - lastTapRef.current < 300) {
      setIsEditing(true);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    onSelect();
    dismissPill();

    const t = e.touches[0];
    startDragTouch(t.clientX, t.clientY, element.x, element.y);
    startLongPress(t.clientX, t.clientY, () => {
      // cancel drag on long-press trigger
    });
  };

  // ── Text editing handlers ─────────────────────────────────────────────────
  const growEditor = () => {
    if (editorRef.current) editorRef.current.style.height = 'auto';
    measureFrameHeight();
  };

  const commitEditor = () => {
    if (!editorRef.current) return;
    skipNextContentSync.current = true;
    onUpdate({ content: serializeEditorHtml(editorRef.current) });
    growEditor();
  };

  const handleEditorInput = () => {
    commitEditor();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain');
    if (!pasted) return;
    applyExecCommand('insertText', pasted);
    commitEditor();
    const maxLen = Math.max(...pasted.split('\n').map((l) => l.length));
    if (element.width <= 200 && maxLen > 15) {
      onUpdate({
        width: Math.min(650, Math.max(element.width, Math.round(maxLen * element.fontSize * 0.55))),
      });
    }
    requestAnimationFrame(growEditor);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const root = editorRef.current;
      if (!root) return;
      const range = selectionInside(root);
      if (!range) return;
      const offsets = rangeToPlainOffsets(root, range);
      if (!offsets) return;
      const value = htmlToPlain(serializeEditorHtml(root));
      const result = e.shiftKey
        ? outdentLinesInRange(value, offsets.start, offsets.end)
        : indentLinesInRange(value, offsets.start, offsets.end);
      if (result.content === value) return;
      skipNextContentSync.current = true;
      onUpdate({ content: result.content });
      requestAnimationFrame(() => {
        if (!editorRef.current) return;
        editorRef.current.innerHTML = contentToHtml(result.content);
        setPlainSelection(
          editorRef.current,
          result.selectionStart,
          result.selectionEnd,
        );
        growEditor();
      });
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      const root = editorRef.current;
      if (!root) return;
      const range = selectionInside(root);
      if (!range) return;
      const offsets = rangeToPlainOffsets(root, range);
      if (!offsets) return;
      const value = htmlToPlain(serializeEditorHtml(root));
      const { selectionStart, selectionEnd } = {
        selectionStart: offsets.start,
        selectionEnd: offsets.end,
      };
      const before = value.substring(0, selectionStart);
      const after = value.substring(selectionEnd);
      const lastNl = before.lastIndexOf('\n');
      const line = lastNl === -1 ? before : before.substring(lastNl + 1);

      const bulletMatch = line.match(/^(\s*)•\s*(.*)$/);
      const numberMatch = line.match(/^(\s*)(\d+)\.\s*(.*)$/);

      const applyPlain = (next: string, caret: number) => {
        e.preventDefault();
        skipNextContentSync.current = true;
        onUpdate({
          content: next,
          listType: next.trim() === '' ? 'none' : element.listType,
        });
        requestAnimationFrame(() => {
          if (!editorRef.current) return;
          editorRef.current.innerHTML = contentToHtml(next);
          setPlainSelection(editorRef.current, caret, caret);
          growEditor();
        });
      };

      const insertAt = (text: string) => {
        applyPlain(before + text + after, selectionStart + text.length);
      };
      const removeLine = () => {
        const sol = lastNl === -1 ? 0 : lastNl + 1;
        applyPlain(value.substring(0, sol) + after, sol);
      };

      if (bulletMatch) {
        bulletMatch[2].trim() === '' ? removeLine() : insertAt(`\n${bulletMatch[1]}• `);
        return;
      }
      if (numberMatch) {
        numberMatch[3].trim() === ''
          ? removeLine()
          : insertAt(`\n${numberMatch[1]}${parseInt(numberMatch[2], 10) + 1}. `);
        return;
      }
      if (element.listType === 'bullet') {
        insertAt('\n• ');
        return;
      }
      if (element.listType === 'number') {
        insertAt(`\n${before.split('\n').length + 1}. `);
        return;
      }
    }

    if (e.key === 'Backspace') {
      const root = editorRef.current;
      if (!root) return;
      const range = selectionInside(root);
      if (!range || !range.collapsed) return;
      const offsets = rangeToPlainOffsets(root, range);
      if (!offsets) return;
      const value = htmlToPlain(serializeEditorHtml(root));
      const { selectionStart } = { selectionStart: offsets.start };
      const before = value.substring(0, selectionStart);
      const lastNl = before.lastIndexOf('\n');
      const line = lastNl === -1 ? before : before.substring(lastNl + 1);
      if (line.match(/^(\s*•\s*)$/) || line.match(/^(\s*\d+\.\s*)$/)) {
        e.preventDefault();
        const sol = lastNl === -1 ? 0 : lastNl + 1;
        const next = value.substring(0, sol) + value.substring(selectionStart);
        skipNextContentSync.current = true;
        onUpdate({ content: next, listType: next.trim() === '' ? 'none' : element.listType });
        requestAnimationFrame(() => {
          if (!editorRef.current) return;
          editorRef.current.innerHTML = contentToHtml(next);
          setPlainSelection(editorRef.current, sol, sol);
          growEditor();
        });
      }
    }
  };

  const syncFromEditor = () => {
    if (!editorRef.current) return;
    skipNextContentSync.current = true;
    onUpdate({ content: serializeEditorHtml(editorRef.current) });
  };

  /** When editing with a caret/selection, format that range; otherwise whole element. */
  const handleListToggle = () => {
    if (isEditing && editorRef.current) {
      const root = editorRef.current;
      const range = selectionInside(root);
      const plain = htmlToPlain(serializeEditorHtml(root));
      let selStart = 0;
      let selEnd = plain.length;
      if (range) {
        const offsets = rangeToPlainOffsets(root, range);
        if (offsets) {
          selStart = offsets.start;
          selEnd = offsets.end;
        }
      }
      const lineBounds = expandToLineBounds(plain, selStart, selEnd);
      const linePlain = plain.slice(lineBounds.start, lineBounds.end);
      const nextType = nextListType(detectListType(linePlain));
      const result = convertListContentInRange(plain, selStart, selEnd, nextType);
      skipNextContentSync.current = true;
      onUpdate({
        content: result.content,
        listType: detectListType(result.content),
      });
      requestAnimationFrame(() => {
        if (!editorRef.current) return;
        editorRef.current.innerHTML = contentToHtml(result.content);
        setPlainSelection(editorRef.current, result.selectionStart, result.selectionEnd);
        growEditor();
      });
      return;
    }

    const cur: ListType = element.listType || 'none';
    const next = nextListType(cur);
    onUpdate({ listType: next, content: convertListContent(plainContent, next) });
  };

  const handleAlignToggle = () => {
    if (isEditing && editorRef.current) {
      const next = getNextTextAlign(element.textAlign || 'none');
      const cmd =
        next === 'center'
          ? 'justifyCenter'
          : next === 'right'
            ? 'justifyRight'
            : next === 'justify'
              ? 'justifyFull'
              : 'justifyLeft';
      editorRef.current.focus();
      applyExecCommand(cmd);
      syncFromEditor();
      onUpdate({ textAlign: next });
      return;
    }
    onUpdate({ textAlign: getNextTextAlign(element.textAlign || 'none') });
  };

  const handleInlineToggle = (
    command: 'bold' | 'italic' | 'underline',
    wholeElementUpdate: () => void,
  ) => {
    if (isEditing && editorRef.current) {
      editorRef.current.focus();
      applyExecCommand(command);
      syncFromEditor();
      return;
    }
    wholeElementUpdate();
  };

  const handleColorChange = (color: string) => {
    if (isEditing && editorRef.current && hasNonCollapsedSelection(editorRef.current)) {
      editorRef.current.focus();
      applyExecCommand('foreColor', color);
      syncFromEditor();
      return;
    }
    onUpdate({ color });
  };

  const handleBlur = () => {
    if (editorRef.current) {
      skipNextContentSync.current = true;
      const next = serializeEditorHtml(editorRef.current);
      onUpdate({ content: next });
      setIsEditing(false);
      if (!htmlToPlain(next).trim()) onDelete();
      return;
    }
    setIsEditing(false);
    if (!htmlToPlain(element.content || '').trim()) onDelete();
  };

  const isRich = looksLikeHtml(element.content || '');
  const textStyle: React.CSSProperties = {
    fontSize: `${element.fontSize}px`,
    fontFamily: element.fontFamily || 'var(--font-poppins)',
    color: element.color ?? '#000000',
    // Element-level weight/style/decoration fight inline <b>/<i>/<u> — skip when rich.
    fontWeight: isRich ? undefined : (element.fontWeight ?? 400),
    fontStyle: isRich ? undefined : (element.fontStyle || 'normal'),
    textDecoration: isRich ? undefined : (element.textDecoration || 'none'),
    textAlign: element.textAlign && element.textAlign !== 'none' ? element.textAlign : 'left',
    minHeight: `${element.fontSize + 8}px`,
    lineHeight: '1.2',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  };

  const { animStyle, animKey } = useLayerElementAnimation(element.id);
  const snapBase = { x: element.x, y: element.y, width: element.width, fontSize: element.fontSize, textCategory: element.textCategory };

  return (
    <div
      key={`${element.id}-${animKey ?? 'idle'}`}
      data-canvas-element
      className={`absolute ${poppins.variable}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        // Explicit height so the selection chrome always matches wrapped text.
        height: frameHeight,
        zIndex: isSelected ? SELECTED_CHROME_Z + (element.zIndex ?? 1) : (element.zIndex ?? 1),
        cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'move',
        fontFamily: element.fontFamily || 'var(--font-poppins)',
        pointerEvents: 'auto',
        touchAction: 'none',
        boxSizing: 'border-box',
        ...animStyle,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onTouchStart={handleTouchStart}
    >
      {isEditing ? (
        <div
          ref={editorRef}
          data-text-id={element.id}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline
          onInput={handleEditorInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="w-full border-none bg-transparent outline-none block"
          style={{ ...textStyle, height: 'auto', overflow: 'visible' }}
        />
      ) : (
        <div
          ref={contentRef}
          data-text-id={element.id}
          onDoubleClick={(e) => { e.stopPropagation(); if (isSelected && !element.isLocked && !isDocumentMode) setIsEditing(true); }}
          style={{ ...textStyle, height: 'auto', overflow: 'visible' }}
          dangerouslySetInnerHTML={{ __html: contentToHtml(element.content || 'Add text') }}
        />
      )}

      {isSelected && !isDragging && (
        <>
          {!isDocumentMode && (
          <TextToolbar
            elementX={0}
            elementY={0}
            elementWidth={element.width}
            onFontSizeChange={(fontSize) => onUpdate({ fontSize })}
            onColorChange={handleColorChange}
            color={element.color ?? '#000000'}
            isBold={(element.fontWeight ?? 400) >= 700}
            onBoldToggle={() =>
              handleInlineToggle('bold', () =>
                onUpdate({ fontWeight: (element.fontWeight ?? 400) >= 700 ? 400 : 700 }),
              )
            }
            isItalic={element.fontStyle === 'italic'}
            onItalicToggle={() =>
              handleInlineToggle('italic', () =>
                onUpdate({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' }),
              )
            }
            isUnderline={element.textDecoration === 'underline'}
            onUnderlineToggle={() =>
              handleInlineToggle('underline', () =>
                onUpdate({
                  textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline',
                }),
              )
            }
            listType={element.listType || 'none'}
            onListToggle={handleListToggle}
            textAlign={element.textAlign || 'none'}
            onAlignToggle={handleAlignToggle}
            isLocked={element.isLocked}
            onLockToggle={() => onUpdate({ isLocked: !element.isLocked })}
            onIndent={() => applyIndent(false)}
            onOutdent={() => applyIndent(true)}
          />
          )}

          {/* Selection border — tied to explicit frame height (Canva-style) */}
          <div
            data-no-export="true"
            className="pointer-events-none absolute"
            style={{
              left: -2,
              top: -2,
              width: element.width + 4,
              height: frameHeight + 4,
              border: isDocumentMode ? '2px solid #38bdf8' : '2px solid #000000',
              boxSizing: 'border-box',
            }}
          />

          {/* Resize handles - only show when not locked and not in document mode */}
          {!element.isLocked && !isDocumentMode && (
            <>
              {/* Corner handles */}
              <ResizeHandleNode cursor="nwse-resize" style={{ left: -8, top: -8 }}
                onMouseDown={(e) => startResizeMouse(e, 'nw', snapBase)}
                onTouchStart={(e) => startResizeTouch(e, 'nw', snapBase)} 
                dataNoExport={true} />
              <ResizeHandleNode cursor="nesw-resize" style={{ right: -8, top: -8 }}
                onMouseDown={(e) => startResizeMouse(e, 'ne', snapBase)}
                onTouchStart={(e) => startResizeTouch(e, 'ne', snapBase)} 
                dataNoExport={true} />
              <ResizeHandleNode cursor="nwse-resize" style={{ right: -8, bottom: -8 }}
                onMouseDown={(e) => startResizeMouse(e, 'se', snapBase)}
                onTouchStart={(e) => startResizeTouch(e, 'se', snapBase)} 
                dataNoExport={true} />
              <ResizeHandleNode cursor="nesw-resize" style={{ left: -8, bottom: -8 }}
                onMouseDown={(e) => startResizeMouse(e, 'sw', snapBase)}
                onTouchStart={(e) => startResizeTouch(e, 'sw', snapBase)} 
                dataNoExport={true} />

              {/* Side handles (width only — height auto-adjusts on reflow, like Canva) */}
              <ResizeHandleNode cursor="ew-resize" style={{ left: -8, top: '50%', transform: 'translateY(-50%)' }}
                onMouseDown={(e) => startResizeMouse(e, 'w', snapBase)}
                onTouchStart={(e) => startResizeTouch(e, 'w', snapBase)} 
                dataNoExport={true} />
              <ResizeHandleNode cursor="ew-resize" style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
                onMouseDown={(e) => startResizeMouse(e, 'e', snapBase)}
                onTouchStart={(e) => startResizeTouch(e, 'e', snapBase)} 
                dataNoExport={true} />
            </>
          )}
        </>
      )}

      {showPill && isSelected && !isEditing && (
        <CopyDeletePill
          onCopy={() => { dismissPill(); onLongPress?.(); }}
          onDelete={() => { dismissPill(); onDelete(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── DraggableDivider ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

import type { DividerElement } from '../context/DividerContext';

type DividerResizeHandle = 'w' | 'e';

const MIN_DIV_WIDTH = 40;
const MAX_DIV_WIDTH = 1400;

interface DraggableDividerProps {
  element: DividerElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<DividerElement>) => void;
  onDelete: () => void;
  onDragEnd?: () => void;
  onLongPress?: () => void;
}

export function DraggableDivider({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDragEnd,
  onLongPress,
}: DraggableDividerProps) {
  const { zoom, isDocumentMode } = useCanvas();
  const { startUpdateBatch, endUpdateBatch } = useDivider();
  const { snap: snapToGuides, endDrag: endGuideDrag } = useRulerSnapping();
  const thickness = element.thickness ?? 2;
  const color = element.color ?? '#000000';

  // ── Drag ──────────────────────────────────────────────────────────────────
  const { isDragging, startMouse: startDragMouse, startTouch: startDragTouch } = useDrag({
    zoom,
    onMove: (x, y) => {
      const snapped = snapToGuides({ id: element.id, x, y, width: element.width, height: thickness });
      onUpdate(snapped);
    },
    onStart: startUpdateBatch,
    onEnd: () => {
      endUpdateBatch();
      endGuideDrag();
      onDragEnd?.();
    },
  });

  // ── Resize ────────────────────────────────────────────────────────────────
  const applyDividerResize = useCallback(
    (handle: DividerResizeHandle, snap: ResizeSnapshot, dx: number) => {
      if (handle === 'e') {
        onUpdate({ width: Math.max(MIN_DIV_WIDTH, Math.min(MAX_DIV_WIDTH, snap.width + dx)) });
      } else {
        const newW = Math.max(MIN_DIV_WIDTH, Math.min(MAX_DIV_WIDTH, snap.width - dx));
        onUpdate({ x: snap.x + (snap.width - newW), width: newW });
      }
    },
    [onUpdate],
  );

  const applyDividerResizeFull = useCallback(
    (handle: DividerResizeHandle, snap: ResizeSnapshot, dx: number, _dy: number) =>
      applyDividerResize(handle, snap, dx),
    [applyDividerResize],
  );

  const { startMouse: startResizeMouse, startTouch: startResizeTouch } =
    useResize<DividerResizeHandle>({ 
      zoom, 
      applyResize: applyDividerResizeFull,
      onStart: startUpdateBatch,
      onEnd: () => {
        endUpdateBatch();
        onDragEnd?.();
      },
    });

  // ── Long-press ────────────────────────────────────────────────────────────
  const { showPill, startLongPress, dismissPill } = useLongPress(onLongPress);

  // ── Keyboard delete ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingIntoField(e)) return;
      if (isSelected && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        onDelete();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSelected, onDelete]);

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (element.isLocked || isDocumentMode) {
      if (isDocumentMode) onSelect();
      return;
    }
    onSelect();
    startDragMouse(e, element.x, element.y);
  };

  // ── Touch handlers ────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (element.isLocked || e.touches.length !== 1) return;
    e.stopPropagation();
    onSelect();
    if (isDocumentMode) return;
    dismissPill();
    const t = e.touches[0];
    startDragTouch(t.clientX, t.clientY, element.x, element.y);
    startLongPress(t.clientX, t.clientY, () => {});
  };

  const { animStyle, animKey } = useLayerElementAnimation(element.id);
  const snapBase = { x: element.x, y: element.y, width: element.width, fontSize: 0 };

  return (
    <div
      key={`${element.id}-${animKey ?? 'idle'}`}
      data-canvas-element
      className="absolute"
      style={{
        left: element.x,
        top: element.y - HIT_PADDING,
        width: element.width,
        height: HIT_PADDING * 2 + thickness,
        zIndex: isSelected ? SELECTED_CHROME_Z + (element.zIndex ?? 1) : (element.zIndex ?? 1),
        cursor: isDragging ? 'grabbing' : 'move',
        pointerEvents: 'auto',
        touchAction: 'none',
        ...animStyle,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onTouchStart={handleTouchStart}
    >
      {/* Visible line, centred in hit area */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: HIT_PADDING, height: thickness, backgroundColor: color }} />

      {isSelected && !isDragging && (
        <>
          <DividerToolbar
            elementX={0}
            elementY={0}
            elementWidth={element.width}
            color={color}
            onColorChange={(c) => onUpdate({ color: c })}
            thickness={thickness}
            onThicknessSelect={(t) => onUpdate({ thickness: t })}
            isLocked={element.isLocked}
            onLockToggle={() => onUpdate({ isLocked: !element.isLocked })}
          />

          {/* Selection outline */}
          <div
            data-no-export="true"
            className="pointer-events-none absolute"
            style={{ left: -2, top: HIT_PADDING - 2, width: 'calc(100% + 4px)', height: thickness + 4, border: '1px dashed rgba(0,0,0,0.4)' }}
          />

          {/* Width indicator — right side, same style as shape W/H badge */}
          <output
            data-no-export="true"
            className="pointer-events-none absolute whitespace-nowrap rounded-lg px-3.5 py-2 text-sm text-white"
            aria-label={`Divider width: ${Math.round(element.width)} pixels`}
            style={{
              left: 'calc(100% + 14px)',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(30, 32, 38, 0.88)',
              backdropFilter: 'blur(12px) saturate(140%)',
              WebkitBackdropFilter: 'blur(12px) saturate(140%)',
              border: '1px solid rgba(139,92,246,0.55)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              zIndex: 60,
            }}
          >
            W: {Math.round(element.width)}px
          </output>

          {/* Resize handles - only show when not locked */}
          {!element.isLocked && (
            <>
              {/* Left handle */}
              <ResizeHandleNode
                variant="circle"
                cursor="ew-resize"
                style={{ left: -HANDLE_SIZE / 2, top: HIT_PADDING + thickness / 2 - HANDLE_SIZE / 2 }}
                onMouseDown={(e) => startResizeMouse(e, 'w', snapBase)}
                onTouchStart={(e) => startResizeTouch(e, 'w', snapBase)}
                dataNoExport={true}
              />

              {/* Right handle */}
              <ResizeHandleNode
                variant="circle"
                cursor="ew-resize"
                style={{ right: -HANDLE_SIZE / 2, top: HIT_PADDING + thickness / 2 - HANDLE_SIZE / 2 }}
                onMouseDown={(e) => startResizeMouse(e, 'e', snapBase)}
                onTouchStart={(e) => startResizeTouch(e, 'e', snapBase)}
                dataNoExport={true}
              />
            </>
          )}
        </>
      )}

      {showPill && isSelected && (
        <CopyDeletePill
          onCopy={() => { dismissPill(); onLongPress?.(); }}
          onDelete={() => { dismissPill(); onDelete(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── DraggableIcon ────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

import type { IconElement } from '../context/IconContext';
import { IconToolbar } from '../tool_sidebar/icons_set/icons.tools';
import { ShapeToolbar } from '../tool_sidebar/shapes/shapes.tools';
import { getNextFlip, flipToTransform, type FlipState } from './flip.element';
import { IconColorOverlay } from '../tool_sidebar/icons_set/color.overlay';
import { isImagePanelDrag, extractImageDataUrl } from '../tool_sidebar/image/image.attach.frame';

export type { IconElement } from '../context/IconContext';

type IconResizeHandle = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w';

const MIN_ICON_SIZE = 16;
const MAX_ICON_SIZE = 400;
const MIN_SHAPE_SIZE = 24;
const MAX_SHAPE_SIZE = 700;

interface DraggableIconProps {
  element: IconElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<IconElement>) => void;
  onDelete: () => void;
  onDragEnd?: () => void;
  onLongPress?: () => void;
}

function ShapeFill({
  element,
  isDragOver = false,
  onUploadClick,
}: {
  element: IconElement;
  isDragOver?: boolean;
  onUploadClick?: () => void;
}) {
  const borderRadius = element.cornerRadius === undefined
    ? (element.shapeKind === 'circle' ? '50%' : '0%')
    : `${element.cornerRadius / 2}%`;

  if (element.isFrame) {
    return (
      <div
        aria-hidden
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: isDragOver ? 'rgba(235, 243, 255, 0.95)' : '#f5f5f6',
          border: element.frameImage
            ? `${element.borderWidth ?? 0}px solid ${element.borderColor ?? '#ffffff'}`
            : isDragOver
              ? '2px dashed #2563eb'
              : '2px dashed #626370',
          boxShadow: isDragOver ? '0 0 0 3px rgba(37, 99, 235, 0.3)' : undefined,
          boxSizing: 'border-box',
          borderRadius,
          pointerEvents: 'none',
          transition: 'all 0.15s ease',
        }}
      >
        {element.frameImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={element.frameImage}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
          />
        ) : (
          <div
            onClick={onUploadClick ? (e) => { e.stopPropagation(); onUploadClick(); } : undefined}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              color: isDragOver ? '#2563eb' : '#9899a5',
              fontFamily: 'var(--font-poppins, Arial), sans-serif',
              fontSize: 16,
              overflow: 'hidden',
              textAlign: 'center',
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                flexShrink: 0,
                backgroundColor: 'currentColor',
                WebkitMaskImage: "url('/assets/tools_icons/frame_icon.png')",
                maskImage: "url('/assets/tools_icons/frame_icon.png')",
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                transform: isDragOver ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
            />
            <span style={{ fontWeight: 400, flexShrink: 0, userSelect: 'none' }}>
              {isDragOver ? 'Release to drop' : 'Drop photo here'}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      aria-hidden
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: element.color ?? '#000000',
        border: `${element.borderWidth ?? 0}px solid ${element.borderColor ?? '#ffffff'}`,
        boxSizing: 'border-box',
        // CSS reaches a fully round capsule at 50%; map the user-facing
        // 0–100% control into that 0–50% rendering range.
        borderRadius,
        transform: flipToTransform((element.flip ?? 0) as FlipState),
        transformOrigin: 'center',
        pointerEvents: 'none',
        transition: 'background-color 0.12s ease',
      }}
    />
  );
}

export function DraggableIcon({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDragEnd,
  onLongPress,
}: DraggableIconProps) {
  const { zoom, isDocumentMode } = useCanvas();
  const { startUpdateBatch, endUpdateBatch } = useIcon();
  const { snap: snapToGuides, endDrag: endGuideDrag } = useRulerSnapping();
  const elementWidth = element.width ?? element.size;
  const elementHeight = element.height ?? element.size;
  // Mobile's fitted canvas makes a 48px icon appear much smaller than a
  // comfortable finger target. This transparent extension preserves the
  // visible geometry while giving icons and shapes a ~48px on-screen target.
  const touchHitPadding = Math.max(10, Math.min(28, 24 / zoom));
  const pendingUpdateRef = useRef<Partial<IconElement> | null>(null);
  const updateFrameRef = useRef<number | null>(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  const flushPendingUpdate = useCallback(() => {
    if (updateFrameRef.current !== null) {
      cancelAnimationFrame(updateFrameRef.current);
      updateFrameRef.current = null;
    }
    const pending = pendingUpdateRef.current;
    pendingUpdateRef.current = null;
    if (pending) onUpdateRef.current(pending);
  }, []);

  const queueUpdate = useCallback((updates: Partial<IconElement>) => {
    pendingUpdateRef.current = { ...pendingUpdateRef.current, ...updates };
    if (updateFrameRef.current !== null) return;
    updateFrameRef.current = requestAnimationFrame(() => {
      updateFrameRef.current = null;
      const pending = pendingUpdateRef.current;
      pendingUpdateRef.current = null;
      if (pending) onUpdateRef.current(pending);
    });
  }, []);

  useEffect(() => () => {
    if (updateFrameRef.current !== null) cancelAnimationFrame(updateFrameRef.current);
  }, []);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const { isDragging, startMouse: startDragMouse, startTouch: startDragTouch } = useDrag({
    zoom,
    onMove: (x, y) => {
      const snapped = snapToGuides({ id: element.id, x, y, width: elementWidth, height: elementHeight });
      queueUpdate(snapped);
    },
    onStart: startUpdateBatch,
    onEnd: () => {
      flushPendingUpdate();
      endUpdateBatch();
      endGuideDrag();
      onDragEnd?.();
    },
  });

  // ── Resize — shapes and raster images resize freely; standard icons keep uniform scale ──
  const applyIconResize = useCallback(
    (handle: IconResizeHandle, snap: ResizeSnapshot, dx: number, dy: number) => {
      const isRaster = element.svgUrl.startsWith('data:image/');
      if (element.isShape || isRaster) {
        const startWidth = snap.width;
        const startHeight = snap.height ?? snap.width;
        let x = snap.x;
        let y = snap.y;
        let width = startWidth;
        let height = startHeight;

        if (handle === 'w' || handle === 'nw' || handle === 'sw') {
          width = Math.max(MIN_SHAPE_SIZE, Math.min(MAX_SHAPE_SIZE, startWidth - dx));
          x = snap.x + (startWidth - width);
        }
        if (handle === 'e' || handle === 'ne' || handle === 'se') {
          width = Math.max(MIN_SHAPE_SIZE, Math.min(MAX_SHAPE_SIZE, startWidth + dx));
        }
        if (handle === 'n' || handle === 'nw' || handle === 'ne') {
          height = Math.max(MIN_SHAPE_SIZE, Math.min(MAX_SHAPE_SIZE, startHeight - dy));
          y = snap.y + (startHeight - height);
        }
        if (handle === 's' || handle === 'sw' || handle === 'se') {
          height = Math.max(MIN_SHAPE_SIZE, Math.min(MAX_SHAPE_SIZE, startHeight + dy));
        }

        queueUpdate({ x, y, width, height });
        return;
      }

      const scaleDelta =
        handle === 'se' ? dx + dy :
        handle === 'sw' ? -dx + dy :
        handle === 'ne' ? dx - dy :
        -dx - dy; // nw
      const newSize = Math.max(MIN_ICON_SIZE, Math.min(MAX_ICON_SIZE, snap.fontSize + scaleDelta));
      if (handle === 'nw' || handle === 'sw') {
        // Keep right edge fixed: move x left as size grows
        queueUpdate({ x: snap.x + (snap.fontSize - newSize), size: newSize });
      } else {
        queueUpdate({ size: newSize });
      }
    },
    [element.isShape, element.svgUrl, queueUpdate],
  );

  const { startMouse: startResizeMouse, startTouch: startResizeTouch } =
    useResize<IconResizeHandle>({ 
      zoom, 
      applyResize: applyIconResize,
      onStart: startUpdateBatch,
      onEnd: () => {
        flushPendingUpdate();
        endUpdateBatch();
        onDragEnd?.();
      },
    });

  // ── Long-press ────────────────────────────────────────────────────────────
  const { showPill, startLongPress, dismissPill } = useLongPress(onLongPress);

  // ── Keyboard delete ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingIntoField(e)) return;
      if (isSelected && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        onDelete();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSelected, onDelete]);

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (element.isLocked || isDocumentMode) {
      if (isDocumentMode) onSelect();
      return;
    }
    onSelect();
    startDragMouse(e, element.x, element.y);
  };

  // ── Touch handlers ────────────────────────────────────────────────────────
  const lastTapRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (element.isLocked || e.touches.length !== 1) return;
    e.stopPropagation();
    const now = Date.now();
    lastTapRef.current = now;
    onSelect();
    if (isDocumentMode) return;
    dismissPill();
    const t = e.touches[0];
    startDragTouch(t.clientX, t.clientY, element.x, element.y);
    startLongPress(t.clientX, t.clientY, () => {});
  };

  const [isFrameDragOver, setIsFrameDragOver] = useState(false);
  const frameFileInputRef = useRef<HTMLInputElement>(null);

  const handleFrameFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdate({ frameImage: reader.result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFrameDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!element.isShape || !element.isFrame) return;
    const acceptsFiles = event.dataTransfer.types.includes('Files');
    const acceptsPanel = isImagePanelDrag(event);
    if (!acceptsFiles && !acceptsPanel) return;
    event.preventDefault();
    setIsFrameDragOver(true);
  };

  const handleFrameDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!element.isShape || !element.isFrame) return;
    const acceptsFiles = event.dataTransfer.types.includes('Files');
    const acceptsPanel = isImagePanelDrag(event);
    if (!acceptsFiles && !acceptsPanel) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    if (!isFrameDragOver) setIsFrameDragOver(true);
  };

  const handleFrameDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!element.isShape || !element.isFrame) return;
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsFrameDragOver(false);
    }
  };

  const handleFrameDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!element.isShape || !element.isFrame) return;
    setIsFrameDragOver(false);

    // ── Drop from Photos panel ────────────────────────────────────────────
    const panelDataUrl = extractImageDataUrl(event);
    if (panelDataUrl) {
      event.preventDefault();
      event.stopPropagation();
      onUpdate({ frameImage: panelDataUrl });
      return;
    }

    // ── Drop from OS filesystem ───────────────────────────────────────────
    const image = Array.from(event.dataTransfer.files).find(file => file.type.startsWith('image/'));
    if (!image) return;
    event.preventDefault();
    event.stopPropagation();
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onUpdate({ frameImage: reader.result });
    };
    reader.readAsDataURL(image);
  };

  const { animStyle, animKey } = useLayerElementAnimation(element.id);

  // Snapshot records the independent shape bounds at resize start.
  const snapBase: Omit<ResizeSnapshot, 'mouseX' | 'mouseY'> = {
    x: element.x,
    y: element.y,
    width: elementWidth,
    height: elementHeight,
    fontSize: element.size,
  };

  return (
    <div
      key={`${element.id}-${animKey ?? 'idle'}`}
      data-canvas-element
      className={`absolute ${poppins.variable}`}
      style={{
        left: element.x,
        top: element.y,
        width: elementWidth,
        height: elementHeight,
        // Selected chrome (toolbars / color pickers) must sit above Denise highlights.
        zIndex: isSelected ? SELECTED_CHROME_Z + (element.zIndex ?? 1) : (element.zIndex ?? 1),
        cursor: isDragging ? 'grabbing' : 'move',
        pointerEvents: 'auto',
        touchAction: 'none',
        userSelect: 'none',
        ...animStyle,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onTouchStart={handleTouchStart}
      onDragEnter={handleFrameDragEnter}
      onDragOver={handleFrameDragOver}
      onDragLeave={handleFrameDragLeave}
      onDrop={handleFrameDrop}
    >
      {element.isFrame && (
        <input
          ref={frameFileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          style={{ display: 'none' }}
          onChange={handleFrameFileInputChange}
        />
      )}
      {/* Shapes fill their full independent bounding box; icons retain SVG masking.
          Raster images (PNG/JPEG data URLs) bypass the CSS mask overlay and render
          directly as an <img> — the mask approach turns them into a solid black square. */}
      {element.isShape ? (
        <ShapeFill
          element={element}
          isDragOver={isFrameDragOver}
          onUploadClick={() => frameFileInputRef.current?.click()}
        />
      ) : isRasterImageUrl(element.svgUrl) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={element.svgUrl}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            display: 'block',
            width: elementWidth,
            height: elementHeight,
            objectFit: 'cover',
            transform: flipToTransform((element.flip ?? 0) as FlipState),
            transformOrigin: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            borderRadius: 0,
          }}
        />
      ) : (
        <IconColorOverlay
          svgUrl={element.svgUrl}
          color={element.color ?? '#000000'}
          size={element.size}
          width={elementWidth}
          height={elementHeight}
          flipTransform={flipToTransform((element.flip ?? 0) as FlipState)}
        />
      )}

      {/* Enlarged invisible touch target for small icons on the fitted mobile canvas. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: -touchHitPadding,
          zIndex: 0,
          background: 'transparent',
        }}
      />

      {/* Selection UI */}
      {isSelected && !isDragging && (
        <>
          {/* Toolbar above element */}
          {element.isShape ? (
            <ShapeToolbar
              elementX={0}
              elementY={0}
              elementWidth={elementWidth}
              color={element.color ?? '#000000'}
              onColorChange={(color) => onUpdate({ color })}
              borderWidth={element.borderWidth ?? 0}
              onBorderWidthChange={(borderWidth) => onUpdate({ borderWidth })}
              borderColor={element.borderColor ?? '#ffffff'}
              onBorderColorChange={(borderColor) => onUpdate({ borderColor })}
              cornerRadius={element.cornerRadius ?? (element.shapeKind === 'circle' ? 100 : 0)}
              onCornerRadiusChange={(cornerRadius) => onUpdate({ cornerRadius })}
              isFrame={element.isFrame ?? false}
              onFrameToggle={() => onUpdate({ isFrame: !element.isFrame, frameImage: undefined })}
              isLocked={element.isLocked}
              onLockToggle={() => onUpdate({ isLocked: !element.isLocked })}
            />
          ) : (
            <IconToolbar
              elementX={0}
              elementY={0}
              elementSize={element.size}
              elementWidth={elementWidth}
              color={element.color ?? '#000000'}
              onColorChange={(color) => onUpdate({ color })}
              flip={(element.flip ?? 0) as FlipState}
              onFlip={() => onUpdate({ flip: getNextFlip((element.flip ?? 0) as FlipState) })}
              isRaster={element.svgUrl.startsWith('data:image/')}
              isLocked={element.isLocked}
              onLockToggle={() => onUpdate({ isLocked: !element.isLocked })}
            />
          )}

          {/* Selection border */}
          <div
            data-no-export="true"
            className="pointer-events-none absolute inset-0"
            style={{
              border: '2px solid #000000',
              marginTop: -2,
              marginLeft: -2,
              width: 'calc(100% + 4px)',
              height: 'calc(100% + 4px)',
            }}
          />

          {element.isShape && (
            <output
              data-no-export="true"
              className="pointer-events-none absolute whitespace-nowrap rounded-lg px-3.5 py-2 text-sm text-white"
              aria-label={`Shape dimensions: width ${Math.round(elementWidth)} pixels, height ${Math.round(elementHeight)} pixels`}
              style={{
                left: 'calc(100% + 14px)',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(30, 32, 38, 0.88)',
                backdropFilter: 'blur(12px) saturate(140%)',
                WebkitBackdropFilter: 'blur(12px) saturate(140%)',
                border: '1px solid rgba(139,92,246,0.55)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                zIndex: 60,
              }}
            >
              W: {Math.round(elementWidth)}px&nbsp; | &nbsp;H: {Math.round(elementHeight)}px
            </output>
          )}

          {/* Resize handles - only show when not locked */}
          {!element.isLocked && (
            <>
              {element.isShape ? (
                <>
                  <ResizeHandleNode dataNoExport={true} variant="circle" cursor="nwse-resize" style={{ left: -8, top: -8 }} onMouseDown={(e) => startResizeMouse(e, 'nw', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'nw', snapBase)} />
                  <ResizeHandleNode dataNoExport={true} variant="circle" cursor="nesw-resize" style={{ right: -8, top: -8 }} onMouseDown={(e) => startResizeMouse(e, 'ne', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'ne', snapBase)} />
                  <ResizeHandleNode dataNoExport={true} variant="circle" cursor="nwse-resize" style={{ right: -8, bottom: -8 }} onMouseDown={(e) => startResizeMouse(e, 'se', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'se', snapBase)} />
                  <ResizeHandleNode dataNoExport={true} variant="circle" cursor="nesw-resize" style={{ left: -8, bottom: -8 }} onMouseDown={(e) => startResizeMouse(e, 'sw', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'sw', snapBase)} />
                  <ResizeHandleNode dataNoExport={true} cursor="ns-resize" style={{ left: '50%', top: -6, width: 20, height: 12, transform: 'translateX(-50%)' }} onMouseDown={(e) => startResizeMouse(e, 'n', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'n', snapBase)} />
                  <ResizeHandleNode dataNoExport={true} cursor="ew-resize" style={{ right: -6, top: '50%', width: 12, height: 20, transform: 'translateY(-50%)' }} onMouseDown={(e) => startResizeMouse(e, 'e', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'e', snapBase)} />
                  <ResizeHandleNode dataNoExport={true} cursor="ns-resize" style={{ left: '50%', bottom: -6, width: 20, height: 12, transform: 'translateX(-50%)' }} onMouseDown={(e) => startResizeMouse(e, 's', snapBase)} onTouchStart={(e) => startResizeTouch(e, 's', snapBase)} />
                  <ResizeHandleNode dataNoExport={true} cursor="ew-resize" style={{ left: -6, top: '50%', width: 12, height: 20, transform: 'translateY(-50%)' }} onMouseDown={(e) => startResizeMouse(e, 'w', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'w', snapBase)} />
                </>
              ) : (
                <>
                  <ResizeHandleNode dataNoExport={true} cursor="nwse-resize" style={{ left: -8, top: -8 }} onMouseDown={(e) => startResizeMouse(e, 'nw', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'nw', snapBase)} />
                  <ResizeHandleNode dataNoExport={true} cursor="nesw-resize" style={{ right: -8, top: -8 }} onMouseDown={(e) => startResizeMouse(e, 'ne', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'ne', snapBase)} />
                  <ResizeHandleNode dataNoExport={true} cursor="nwse-resize" style={{ right: -8, bottom: -8 }} onMouseDown={(e) => startResizeMouse(e, 'se', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'se', snapBase)} />
                  <ResizeHandleNode dataNoExport={true} cursor="nesw-resize" style={{ left: -8, bottom: -8 }} onMouseDown={(e) => startResizeMouse(e, 'sw', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'sw', snapBase)} />
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Mobile Copy/Delete pill */}
      {showPill && isSelected && (
        <CopyDeletePill
          onCopy={() => { dismissPill(); onLongPress?.(); }}
          onDelete={() => { dismissPill(); onDelete(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility — approximate hue rotation from a hex colour
// Good enough for basic tinting; for precise recolouring use an SVG filter.
// ─────────────────────────────────────────────────────────────────────────────
function colorToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round(h * 60);
}
