'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Poppins } from 'next/font/google';
import { useCanvas } from '@/app/features/canvas_page/context/CanvasContext';
import { TextToolbar } from './text.tools';
import { CATEGORIES } from './font.size';

// ---------------------------------------------------------------------------
// Stepped font size helper — used by corner resize
// If element has a textCategory, snap fontSize to the nearest category step
// in the direction of the drag (positive scaleDelta = grow, negative = shrink).
// Returns the new fontSize (may be unchanged if already at the limit).
// ---------------------------------------------------------------------------
function steppedFontSize(
  current: number,
  scaleDelta: number,
  category: string | null | undefined,
): number {
  if (!category) return current; // no category → free scaling
  const cat = CATEGORIES.find(c => c.scale === category);
  if (!cat) return current;

  const sizes = cat.sizes; // already largest → smallest
  const idx = sizes.indexOf(current);

  if (scaleDelta > 0) {
    // Growing → move toward larger sizes (lower index)
    if (idx <= 0) return sizes[0];            // already at max
    return sizes[idx - 1];
  } else {
    // Shrinking → move toward smaller sizes (higher index)
    if (idx < 0) {
      // current not in list — snap to closest
      const closest = sizes.reduce((a, b) =>
        Math.abs(b - current) < Math.abs(a - current) ? b : a
      );
      return closest;
    }
    if (idx >= sizes.length - 1) return sizes[sizes.length - 1]; // already at min
    return sizes[idx + 1];
  }
}

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

interface TextElement {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: number;
  textCategory?: 'header' | 'subheader' | 'body' | 'meta' | null;
}

interface DraggableTextProps {
  element: TextElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextElement>) => void;
  onDelete: () => void;
}

type ResizeHandle = 'nw' | 'ne' | 'se' | 'sw' | 'w' | 'e';

interface ResizeSnapshot {
  mouseX: number;
  mouseY: number;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  textCategory?: string | null;
}

const MIN_FONT = 8;
const MAX_FONT = 120;
const MIN_WIDTH = 60;
const MAX_WIDTH = 1100;

export function DraggableText({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: DraggableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);

  const dragSnapshot = useRef<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null);
  const resizeSnapshot = useRef<ResizeSnapshot | null>(null);
  // Double-tap detection
  const lastTapRef = useRef<number>(0);

  const textRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { zoom } = useCanvas();

  // ---------------------------------------------------------------------------
  // Keyboard delete
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSelected && !isEditing && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        onDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, isEditing, onDelete]);

  // ---------------------------------------------------------------------------
  // Auto-focus textarea when editing starts
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // ---------------------------------------------------------------------------
  // Mouse drag
  // ---------------------------------------------------------------------------
  const handleDragMouseMove = useCallback((e: MouseEvent) => {
    if (!dragSnapshot.current) return;
    const { mouseX, mouseY, elX, elY } = dragSnapshot.current;
    const dx = (e.clientX - mouseX) / zoom;
    const dy = (e.clientY - mouseY) / zoom;
    onUpdate({ x: elX + dx, y: elY + dy });
  }, [zoom, onUpdate]);

  const handleDragMouseUp = useCallback(() => {
    setIsDragging(false);
    dragSnapshot.current = null;
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener('mousemove', handleDragMouseMove);
    document.addEventListener('mouseup', handleDragMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleDragMouseMove);
      document.removeEventListener('mouseup', handleDragMouseUp);
    };
  }, [isDragging, handleDragMouseMove, handleDragMouseUp]);

  // ---------------------------------------------------------------------------
  // Touch drag — mirrors mouse drag using snapshot approach
  // ---------------------------------------------------------------------------
  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Only single-finger drag; ignore if a resize is active
    if (e.touches.length !== 1 || !dragSnapshot.current) return;
    e.stopPropagation(); // don't bubble up to canvas pan handler
    const touch = e.touches[0];
    const { mouseX, mouseY, elX, elY } = dragSnapshot.current;
    const dx = (touch.clientX - mouseX) / zoom;
    const dy = (touch.clientY - mouseY) / zoom;
    onUpdate({ x: elX + dx, y: elY + dy });
  }, [zoom, onUpdate]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    dragSnapshot.current = null;
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

  // ---------------------------------------------------------------------------
  // Mouse resize
  // ---------------------------------------------------------------------------
  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!resizeHandle || !resizeSnapshot.current) return;
    const snap = resizeSnapshot.current;
    const rawDx = (e.clientX - snap.mouseX) / zoom;
    const rawDy = (e.clientY - snap.mouseY) / zoom;
    applyResize(resizeHandle, snap, rawDx, rawDy);
  }, [resizeHandle, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResizeMouseUp = useCallback(() => {
    setResizeHandle(null);
    resizeSnapshot.current = null;
  }, []);

  useEffect(() => {
    if (!resizeHandle) return;
    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [resizeHandle, handleResizeMouseMove, handleResizeMouseUp]);

  // ---------------------------------------------------------------------------
  // Touch resize — same snapshot logic, driven by touch position
  // ---------------------------------------------------------------------------
  const handleResizeTouchMove = useCallback((e: TouchEvent) => {
    if (!resizeHandle || !resizeSnapshot.current || e.touches.length < 1) return;
    e.stopPropagation();
    const touch = e.touches[0];
    const snap = resizeSnapshot.current;
    const rawDx = (touch.clientX - snap.mouseX) / zoom;
    const rawDy = (touch.clientY - snap.mouseY) / zoom;
    applyResize(resizeHandle, snap, rawDx, rawDy);
  }, [resizeHandle, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResizeTouchEnd = useCallback(() => {
    setResizeHandle(null);
    resizeSnapshot.current = null;
  }, []);

  useEffect(() => {
    if (!resizeHandle) return;
    document.addEventListener('touchmove', handleResizeTouchMove, { passive: false });
    document.addEventListener('touchend', handleResizeTouchEnd);
    document.addEventListener('touchcancel', handleResizeTouchEnd);
    return () => {
      document.removeEventListener('touchmove', handleResizeTouchMove);
      document.removeEventListener('touchend', handleResizeTouchEnd);
      document.removeEventListener('touchcancel', handleResizeTouchEnd);
    };
  }, [resizeHandle, handleResizeTouchMove, handleResizeTouchEnd]);

  // ---------------------------------------------------------------------------
  // Shared resize calculation (used by both mouse and touch)
  // ---------------------------------------------------------------------------
  const applyResize = (handle: ResizeHandle, snap: ResizeSnapshot, rawDx: number, rawDy: number) => {
    if (handle === 'e') {
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, snap.width + rawDx));
      onUpdate({ width: newWidth });
    } else if (handle === 'w') {
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, snap.width - rawDx));
      const clampedDx = snap.width - newWidth;
      onUpdate({ x: snap.x + clampedDx, width: newWidth });
    } else {
      let scaleDelta: number;
      if (handle === 'se') scaleDelta = rawDx + rawDy;
      else if (handle === 'sw') scaleDelta = -rawDx + rawDy;
      else if (handle === 'ne') scaleDelta = rawDx - rawDy;
      else scaleDelta = -rawDx - rawDy; // nw

      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, snap.width + scaleDelta));
      const ratio = newWidth / snap.width;
      const newFontSize = Math.max(MIN_FONT, Math.min(MAX_FONT, snap.fontSize * ratio));

      if (handle === 'nw' || handle === 'sw') {
        const widthDiff = snap.width - newWidth;
        onUpdate({ x: snap.x + widthDiff, width: newWidth, fontSize: newFontSize });
      } else {
        onUpdate({ width: newWidth, fontSize: newFontSize });
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Mouse event handlers
  // ---------------------------------------------------------------------------
  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleTextDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) setIsEditing(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ content: e.target.value });
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (!element.content || element.content.trim() === '') {
      onDelete();
    }
  };

  const startDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isEditing) return;
    dragSnapshot.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: element.x,
      elY: element.y,
    };
    setIsDragging(true);
    onSelect();
  };

  const startResize = (handle: ResizeHandle) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    resizeSnapshot.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: element.x,
      y: element.y,
      width: element.width,
      fontSize: element.fontSize,
    };
    setResizeHandle(handle);
    onSelect();
  };

  // ---------------------------------------------------------------------------
  // Touch event handlers
  // ---------------------------------------------------------------------------
  const startTouchDrag = (e: React.TouchEvent) => {
    if (isEditing || e.touches.length !== 1) return;
    e.stopPropagation();
    // Double-tap detection → enter edit mode
    const now = Date.now();
    if (isSelected && now - lastTapRef.current < 300) {
      setIsEditing(true);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    const touch = e.touches[0];
    dragSnapshot.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      elX: element.x,
      elY: element.y,
    };
    setIsDragging(true);
    onSelect();
  };

  const startResizeTouch = (handle: ResizeHandle) => (e: React.TouchEvent) => {
    if (e.touches.length < 1) return;
    e.stopPropagation();
    e.preventDefault();
    const touch = e.touches[0];
    resizeSnapshot.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      x: element.x,
      y: element.y,
      width: element.width,
      fontSize: element.fontSize,
    };
    setResizeHandle(handle);
    onSelect();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      ref={textRef}
      className={`absolute ${poppins.variable}`}
      style={{
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'move',
        fontFamily: element.fontFamily || 'var(--font-poppins)',
        pointerEvents: 'auto',
        touchAction: 'none', // prevent browser interfering with touch drag
      }}
      onMouseDown={startDrag}
      onClick={handleTextClick}
      onDoubleClick={handleTextDoubleClick}
      onTouchStart={startTouchDrag}
    >
      {/* Text content */}
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={element.content}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="w-full resize-none border-none bg-transparent outline-none overflow-hidden block"
          style={{
            fontSize: `${element.fontSize}px`,
            fontFamily: element.fontFamily || 'var(--font-poppins)',
            color: element.color ?? '#000000',
            fontWeight: element.fontWeight ?? 400,
            minHeight: `${element.fontSize + 8}px`,
            lineHeight: '1.2',
          }}
        />
      ) : (
        <div
          style={{
            fontSize: `${element.fontSize}px`,
            fontFamily: element.fontFamily || 'var(--font-poppins)',
            color: element.color ?? '#000000',
            fontWeight: element.fontWeight ?? 400,
            minHeight: `${element.fontSize + 8}px`,
            lineHeight: '1.2',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        >
          {element.content || 'Add text'}
        </div>
      )}

      {/* Selection UI */}
      {isSelected && !isEditing && !isDragging && (
        <>
          {/* Floating toolbar above the element */}
          <TextToolbar
            elementX={0}
            elementY={0}
            elementWidth={element.width}
            onFontSizeChange={(fontSize) => onUpdate({ fontSize })}
            onColorChange={(color) => onUpdate({ color })}
            color={element.color ?? '#000000'}
            isBold={(element.fontWeight ?? 400) >= 700}
            onBoldToggle={() => onUpdate({ fontWeight: (element.fontWeight ?? 400) >= 700 ? 400 : 700 })}
          />

          {/* Selection border */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              border: '2px solid #000000',
              marginTop: '-2px',
              marginLeft: '-2px',
              width: 'calc(100% + 4px)',
              height: 'calc(100% + 4px)',
            }}
          />

          {/* Corner handles — larger on mobile for finger targets */}
          <div
            className="absolute bg-white border-2 border-black rounded-sm cursor-nwse-resize"
            style={{ width: 16, height: 16, left: -8, top: -8 }}
            onMouseDown={startResize('nw')}
            onTouchStart={startResizeTouch('nw')}
          />
          <div
            className="absolute bg-white border-2 border-black rounded-sm cursor-nesw-resize"
            style={{ width: 16, height: 16, right: -8, top: -8 }}
            onMouseDown={startResize('ne')}
            onTouchStart={startResizeTouch('ne')}
          />
          <div
            className="absolute bg-white border-2 border-black rounded-sm cursor-nwse-resize"
            style={{ width: 16, height: 16, right: -8, bottom: -8 }}
            onMouseDown={startResize('se')}
            onTouchStart={startResizeTouch('se')}
          />
          <div
            className="absolute bg-white border-2 border-black rounded-sm cursor-nesw-resize"
            style={{ width: 16, height: 16, left: -8, bottom: -8 }}
            onMouseDown={startResize('sw')}
            onTouchStart={startResizeTouch('sw')}
          />

          {/* Side handles */}
          <div
            className="absolute bg-white border-2 border-black rounded-sm cursor-ew-resize"
            style={{ width: 16, height: 16, left: -8, top: '50%', transform: 'translateY(-50%)' }}
            onMouseDown={startResize('w')}
            onTouchStart={startResizeTouch('w')}
          />
          <div
            className="absolute bg-white border-2 border-black rounded-sm cursor-ew-resize"
            style={{ width: 16, height: 16, right: -8, top: '50%', transform: 'translateY(-50%)' }}
            onMouseDown={startResize('e')}
            onTouchStart={startResizeTouch('e')}
          />
        </>
      )}
    </div>
  );
}

export type { TextElement };
