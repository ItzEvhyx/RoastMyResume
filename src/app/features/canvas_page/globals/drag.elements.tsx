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

import { useState, useRef, useEffect, useCallback } from 'react';
import { Poppins } from 'next/font/google';
import { useCanvas } from '@/app/features/canvas_page/context/CanvasContext';
import { useText } from '@/app/features/canvas_page/context/TextContext';
import { useIcon } from '@/app/features/canvas_page/context/IconContext';
import { useDivider } from '@/app/features/canvas_page/context/DividerContext';
import { TextToolbar } from '../tool_sidebar/texts/text.tools';
import { DividerToolbar } from '../tool_sidebar/divider/divider.tools';
import { CATEGORIES } from '../tool_sidebar/texts/font.size';
import { convertListContent, ListType } from '../tool_sidebar/texts/bulletpoint';
import { getNextTextAlign, TextAlign } from '../tool_sidebar/texts/alignment';
import { useRulerSnapping } from './ruler.snapping';

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
}: {
  style: React.CSSProperties;
  variant?: HandleVariant;
  cursor: string;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}) {
  return (
    <div
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastTapRef = useRef<number>(0);
  const { zoom } = useCanvas();
  const { startUpdateBatch, endUpdateBatch } = useText();
  const { snap: snapToGuides, endDrag: endGuideDrag } = useRulerSnapping();
  const textHeight = Math.max(element.fontSize + 8, Math.max(1, element.content.split('\n').length) * element.fontSize * 1.2);

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
      onEnd: endUpdateBatch,
    });

  // ── Long-press ────────────────────────────────────────────────────────────
  const { showPill, startLongPress, dismissPill } = useLongPress(onLongPress);

  // ── Keyboard delete ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isSelected && !isEditing && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        onDelete();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSelected, isEditing, onDelete]);

  // ── Auto-grow textarea ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditing || !inputRef.current) return;
    inputRef.current.focus();
    if (element.content === 'Add text') {
      inputRef.current.select();
    } else {
      const len = inputRef.current.value.length;
      inputRef.current.selectionStart = len;
      inputRef.current.selectionEnd = len;
    }
    inputRef.current.style.height = 'auto';
    inputRef.current.style.height = `${Math.max(element.fontSize + 8, inputRef.current.scrollHeight)}px`;
  }, [isEditing, element.content, element.fontSize, element.width]);

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isEditing) return;
    onSelect();
    startDragMouse(e, element.x, element.y);
  };

  // ── Touch handlers ────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditing || e.touches.length !== 1) return;
    e.stopPropagation();

    const now = Date.now();
    if (isSelected && now - lastTapRef.current < 300) {
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
  const growTextarea = () => {
    if (!inputRef.current) return;
    inputRef.current.style.height = 'auto';
    inputRef.current.style.height = `${Math.max(element.fontSize + 8, inputRef.current.scrollHeight)}px`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ content: e.target.value });
    growTextarea();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted) {
      const maxLen = Math.max(...pasted.split('\n').map(l => l.length));
      if (element.width <= 200 && maxLen > 15) {
        onUpdate({ width: Math.min(650, Math.max(element.width, Math.round(maxLen * element.fontSize * 0.55))) });
      }
    }
    requestAnimationFrame(growTextarea);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const ta = inputRef.current;
      if (!ta) return;
      const { selectionStart, selectionEnd, value } = ta;
      const before = value.substring(0, selectionStart);
      const after = value.substring(selectionEnd);
      const lastNl = before.lastIndexOf('\n');
      const line = lastNl === -1 ? before : before.substring(lastNl + 1);

      const bulletMatch = line.match(/^(\s*)•\s*(.*)$/);
      const numberMatch = line.match(/^(\s*)(\d+)\.\s*(.*)$/);

      const insertAt = (text: string) => {
        const next = before + text + after;
        onUpdate({ content: next });
        requestAnimationFrame(() => {
          if (!inputRef.current) return;
          inputRef.current.selectionStart = selectionStart + text.length;
          inputRef.current.selectionEnd = selectionStart + text.length;
        });
      };
      const removeLine = () => {
        const sol = lastNl === -1 ? 0 : lastNl + 1;
        const next = value.substring(0, sol) + after;
        onUpdate({ content: next, listType: next.trim() === '' ? 'none' : element.listType });
        requestAnimationFrame(() => {
          if (!inputRef.current) return;
          inputRef.current.selectionStart = sol;
          inputRef.current.selectionEnd = sol;
        });
      };

      if (bulletMatch) {
        e.preventDefault();
        bulletMatch[2].trim() === '' ? removeLine() : insertAt(`\n${bulletMatch[1]}• `);
        return;
      }
      if (numberMatch) {
        e.preventDefault();
        numberMatch[3].trim() === '' ? removeLine() : insertAt(`\n${numberMatch[1]}${parseInt(numberMatch[2]) + 1}. `);
        return;
      }
      if (element.listType === 'bullet') {
        e.preventDefault();
        insertAt('\n• ');
        return;
      }
      if (element.listType === 'number') {
        e.preventDefault();
        insertAt(`\n${before.split('\n').length + 1}. `);
        return;
      }
    }

    if (e.key === 'Backspace') {
      const ta = inputRef.current;
      if (!ta || ta.selectionStart !== ta.selectionEnd) return;
      const { selectionStart, value } = ta;
      const before = value.substring(0, selectionStart);
      const lastNl = before.lastIndexOf('\n');
      const line = lastNl === -1 ? before : before.substring(lastNl + 1);
      if (line.match(/^(\s*•\s*)$/) || line.match(/^(\s*\d+\.\s*)$/)) {
        e.preventDefault();
        const sol = lastNl === -1 ? 0 : lastNl + 1;
        const next = value.substring(0, sol) + value.substring(selectionStart);
        onUpdate({ content: next, listType: next.trim() === '' ? 'none' : element.listType });
        requestAnimationFrame(() => {
          if (!inputRef.current) return;
          inputRef.current.selectionStart = sol;
          inputRef.current.selectionEnd = sol;
        });
      }
    }
  };

  const handleListToggle = () => {
    const cur: ListType = element.listType || 'none';
    const next: ListType = cur === 'bullet' ? 'number' : cur === 'number' ? 'none' : 'bullet';
    onUpdate({ listType: next, content: convertListContent(element.content || '', next) });
  };

  const handleAlignToggle = () => {
    onUpdate({ textAlign: getNextTextAlign(element.textAlign || 'none') });
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (!element.content?.trim()) onDelete();
  };

  const textStyle: React.CSSProperties = {
    fontSize: `${element.fontSize}px`,
    fontFamily: element.fontFamily || 'var(--font-poppins)',
    color: element.color ?? '#000000',
    fontWeight: element.fontWeight ?? 400,
    fontStyle: element.fontStyle || 'normal',
    textDecoration: element.textDecoration || 'none',
    textAlign: element.textAlign && element.textAlign !== 'none' ? element.textAlign : 'left',
    minHeight: `${element.fontSize + 8}px`,
    lineHeight: '1.2',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  };

  const snapBase = { x: element.x, y: element.y, width: element.width, fontSize: element.fontSize, textCategory: element.textCategory };

  return (
    <div
      data-canvas-element
      className={`absolute ${poppins.variable}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'move',
        fontFamily: element.fontFamily || 'var(--font-poppins)',
        pointerEvents: 'auto',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onTouchStart={handleTouchStart}
    >
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={element.content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="w-full resize-none border-none bg-transparent outline-none overflow-hidden block"
          style={textStyle}
        />
      ) : (
        <div
          onDoubleClick={(e) => { e.stopPropagation(); if (isSelected) setIsEditing(true); }}
          style={textStyle}
        >
          {element.content || 'Add text'}
        </div>
      )}

      {isSelected && !isDragging && (
        <>
          <TextToolbar
            elementX={0}
            elementY={0}
            elementWidth={element.width}
            onFontSizeChange={(fontSize) => onUpdate({ fontSize })}
            onColorChange={(color) => onUpdate({ color })}
            color={element.color ?? '#000000'}
            isBold={(element.fontWeight ?? 400) >= 700}
            onBoldToggle={() => onUpdate({ fontWeight: (element.fontWeight ?? 400) >= 700 ? 400 : 700 })}
            isItalic={element.fontStyle === 'italic'}
            onItalicToggle={() => onUpdate({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })}
            isUnderline={element.textDecoration === 'underline'}
            onUnderlineToggle={() => onUpdate({ textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' })}
            listType={element.listType || 'none'}
            onListToggle={handleListToggle}
            textAlign={element.textAlign || 'none'}
            onAlignToggle={handleAlignToggle}
          />

          {/* Selection border */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ border: '2px solid #000000', marginTop: -2, marginLeft: -2, width: 'calc(100% + 4px)', height: 'calc(100% + 4px)' }}
          />

          {/* Corner handles */}
          <ResizeHandleNode cursor="nwse-resize" style={{ left: -8, top: -8 }}
            onMouseDown={(e) => startResizeMouse(e, 'nw', snapBase)}
            onTouchStart={(e) => startResizeTouch(e, 'nw', snapBase)} />
          <ResizeHandleNode cursor="nesw-resize" style={{ right: -8, top: -8 }}
            onMouseDown={(e) => startResizeMouse(e, 'ne', snapBase)}
            onTouchStart={(e) => startResizeTouch(e, 'ne', snapBase)} />
          <ResizeHandleNode cursor="nwse-resize" style={{ right: -8, bottom: -8 }}
            onMouseDown={(e) => startResizeMouse(e, 'se', snapBase)}
            onTouchStart={(e) => startResizeTouch(e, 'se', snapBase)} />
          <ResizeHandleNode cursor="nesw-resize" style={{ left: -8, bottom: -8 }}
            onMouseDown={(e) => startResizeMouse(e, 'sw', snapBase)}
            onTouchStart={(e) => startResizeTouch(e, 'sw', snapBase)} />

          {/* Side handles */}
          <ResizeHandleNode cursor="ew-resize" style={{ left: -8, top: '50%', transform: 'translateY(-50%)' }}
            onMouseDown={(e) => startResizeMouse(e, 'w', snapBase)}
            onTouchStart={(e) => startResizeTouch(e, 'w', snapBase)} />
          <ResizeHandleNode cursor="ew-resize" style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
            onMouseDown={(e) => startResizeMouse(e, 'e', snapBase)}
            onTouchStart={(e) => startResizeTouch(e, 'e', snapBase)} />
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
  const { zoom } = useCanvas();
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
      onEnd: endUpdateBatch,
    });

  // ── Long-press ────────────────────────────────────────────────────────────
  const { showPill, startLongPress, dismissPill } = useLongPress(onLongPress);

  // ── Keyboard delete ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
    onSelect();
    startDragMouse(e, element.x, element.y);
  };

  // ── Touch handlers ────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    onSelect();
    dismissPill();
    const t = e.touches[0];
    startDragTouch(t.clientX, t.clientY, element.x, element.y);
    startLongPress(t.clientX, t.clientY, () => {});
  };

  const snapBase = { x: element.x, y: element.y, width: element.width, fontSize: 0 };

  return (
    <div
      data-canvas-element
      className="absolute"
      style={{
        left: element.x,
        top: element.y - HIT_PADDING,
        width: element.width,
        height: HIT_PADDING * 2 + thickness,
        cursor: isDragging ? 'grabbing' : 'move',
        pointerEvents: 'auto',
        touchAction: 'none',
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
          />

          {/* Selection outline */}
          <div
            className="pointer-events-none absolute"
            style={{ left: -2, top: HIT_PADDING - 2, width: 'calc(100% + 4px)', height: thickness + 4, border: '1px dashed rgba(0,0,0,0.4)' }}
          />

          {/* Left handle */}
          <ResizeHandleNode
            variant="circle"
            cursor="ew-resize"
            style={{ left: -HANDLE_SIZE / 2, top: HIT_PADDING + thickness / 2 - HANDLE_SIZE / 2 }}
            onMouseDown={(e) => startResizeMouse(e, 'w', snapBase)}
            onTouchStart={(e) => startResizeTouch(e, 'w', snapBase)}
          />

          {/* Right handle */}
          <ResizeHandleNode
            variant="circle"
            cursor="ew-resize"
            style={{ right: -HANDLE_SIZE / 2, top: HIT_PADDING + thickness / 2 - HANDLE_SIZE / 2 }}
            onMouseDown={(e) => startResizeMouse(e, 'e', snapBase)}
            onTouchStart={(e) => startResizeTouch(e, 'e', snapBase)}
          />
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

function ShapeFill({ element }: { element: IconElement }) {
  return (
    <div
      aria-hidden
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: element.color ?? '#000000',
        border: `${element.borderWidth ?? 0}px solid ${element.borderColor ?? '#ffffff'}`,
        boxSizing: 'border-box',
        borderRadius: element.cornerRadius === undefined
          ? (element.shapeKind === 'circle' ? '50%' : '0%')
          // CSS reaches a fully round capsule at 50%; map the user-facing
          // 0–100% control into that 0–50% rendering range.
          : `${element.cornerRadius / 2}%`,
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
  const { zoom } = useCanvas();
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

  // ── Resize — shapes resize freely; standard icons keep their uniform scale ──
  const applyIconResize = useCallback(
    (handle: IconResizeHandle, snap: ResizeSnapshot, dx: number, dy: number) => {
      if (element.isShape) {
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
    [element.isShape, queueUpdate],
  );

  const { startMouse: startResizeMouse, startTouch: startResizeTouch } =
    useResize<IconResizeHandle>({ 
      zoom, 
      applyResize: applyIconResize,
      onStart: startUpdateBatch,
      onEnd: () => {
        flushPendingUpdate();
        endUpdateBatch();
      },
    });

  // ── Long-press ────────────────────────────────────────────────────────────
  const { showPill, startLongPress, dismissPill } = useLongPress(onLongPress);

  // ── Keyboard delete ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
    onSelect();
    startDragMouse(e, element.x, element.y);
  };

  // ── Touch handlers ────────────────────────────────────────────────────────
  const lastTapRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    const now = Date.now();
    lastTapRef.current = now;
    onSelect();
    dismissPill();
    const t = e.touches[0];
    startDragTouch(t.clientX, t.clientY, element.x, element.y);
    startLongPress(t.clientX, t.clientY, () => {});
  };

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
      data-canvas-element
      className={`absolute ${poppins.variable}`}
      style={{
        left: element.x,
        top: element.y,
        width: elementWidth,
        height: elementHeight,
        // The pen drawing SVG occupies the canvas, so icon and shape hit areas
        // must have their own layer instead of relying on DOM paint order.
        zIndex: isSelected ? 20 : 2,
        cursor: isDragging ? 'grabbing' : 'move',
        pointerEvents: 'auto',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onTouchStart={handleTouchStart}
    >
      {/* Shapes fill their full independent bounding box; icons retain SVG masking. */}
      {element.isShape ? (
        <ShapeFill element={element} />
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
            />
          )}

          {/* Selection border */}
          <div
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
              className="pointer-events-none absolute whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs text-white"
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

          {element.isShape ? (
            <>
              <ResizeHandleNode variant="circle" cursor="nwse-resize" style={{ left: -8, top: -8 }} onMouseDown={(e) => startResizeMouse(e, 'nw', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'nw', snapBase)} />
              <ResizeHandleNode variant="circle" cursor="nesw-resize" style={{ right: -8, top: -8 }} onMouseDown={(e) => startResizeMouse(e, 'ne', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'ne', snapBase)} />
              <ResizeHandleNode variant="circle" cursor="nwse-resize" style={{ right: -8, bottom: -8 }} onMouseDown={(e) => startResizeMouse(e, 'se', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'se', snapBase)} />
              <ResizeHandleNode variant="circle" cursor="nesw-resize" style={{ left: -8, bottom: -8 }} onMouseDown={(e) => startResizeMouse(e, 'sw', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'sw', snapBase)} />
              <ResizeHandleNode cursor="ns-resize" style={{ left: '50%', top: -6, width: 20, height: 12, transform: 'translateX(-50%)' }} onMouseDown={(e) => startResizeMouse(e, 'n', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'n', snapBase)} />
              <ResizeHandleNode cursor="ew-resize" style={{ right: -6, top: '50%', width: 12, height: 20, transform: 'translateY(-50%)' }} onMouseDown={(e) => startResizeMouse(e, 'e', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'e', snapBase)} />
              <ResizeHandleNode cursor="ns-resize" style={{ left: '50%', bottom: -6, width: 20, height: 12, transform: 'translateX(-50%)' }} onMouseDown={(e) => startResizeMouse(e, 's', snapBase)} onTouchStart={(e) => startResizeTouch(e, 's', snapBase)} />
              <ResizeHandleNode cursor="ew-resize" style={{ left: -6, top: '50%', width: 12, height: 20, transform: 'translateY(-50%)' }} onMouseDown={(e) => startResizeMouse(e, 'w', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'w', snapBase)} />
            </>
          ) : (
            <>
              <ResizeHandleNode cursor="nwse-resize" style={{ left: -8, top: -8 }} onMouseDown={(e) => startResizeMouse(e, 'nw', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'nw', snapBase)} />
              <ResizeHandleNode cursor="nesw-resize" style={{ right: -8, top: -8 }} onMouseDown={(e) => startResizeMouse(e, 'ne', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'ne', snapBase)} />
              <ResizeHandleNode cursor="nwse-resize" style={{ right: -8, bottom: -8 }} onMouseDown={(e) => startResizeMouse(e, 'se', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'se', snapBase)} />
              <ResizeHandleNode cursor="nesw-resize" style={{ left: -8, bottom: -8 }} onMouseDown={(e) => startResizeMouse(e, 'sw', snapBase)} onTouchStart={(e) => startResizeTouch(e, 'sw', snapBase)} />
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
