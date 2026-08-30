'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Poppins } from 'next/font/google';
import { useCanvas } from '@/app/features/canvas_page/context/CanvasContext';
import { TextToolbar } from './text.tools';
import { CATEGORIES } from './font.size';
import { convertListContent, ListType } from './bulletpoint';
import { getNextTextAlign, TextAlign } from './alignment';

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
  style: ['normal', 'italic'],
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
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  listType?: ListType;
  textAlign?: TextAlign;
  textCategory?: 'header' | 'subheader' | 'body' | 'meta' | null;
}

interface DraggableTextProps {
  element: TextElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextElement>) => void;
  onDelete: () => void;
  /** Mobile only — called when the user long-presses the element */
  onLongPress?: () => void;
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
  onLongPress,
}: DraggableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [showCopyPill, setShowCopyPill] = useState(false);

  const dragSnapshot = useRef<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null);
  const resizeSnapshot = useRef<ResizeSnapshot | null>(null);
  // Double-tap detection
  const lastTapRef = useRef<number>(0);
  // Long-press timer
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  // Auto-focus and auto-grow textarea when editing starts
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isEditing && inputRef.current) {
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
    }
  }, [isEditing, element.content, element.fontSize, element.width]);

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
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.max(element.fontSize + 8, inputRef.current.scrollHeight)}px`;
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted) {
      const lines = pasted.split('\n');
      const maxLen = Math.max(...lines.map(l => l.length));
      if (element.width <= 200 && maxLen > 15) {
        const newWidth = Math.min(650, Math.max(element.width, Math.round(maxLen * (element.fontSize * 0.55))));
        onUpdate({ width: newWidth });
      }
    }
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = `${Math.max(element.fontSize + 8, inputRef.current.scrollHeight)}px`;
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const textarea = inputRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd, value } = textarea;
      const beforeCursor = value.substring(0, selectionStart);
      const afterCursor = value.substring(selectionEnd);
      const lastNewlineIdx = beforeCursor.lastIndexOf('\n');
      const currentLine = lastNewlineIdx === -1 ? beforeCursor : beforeCursor.substring(lastNewlineIdx + 1);

      const bulletMatch = currentLine.match(/^(\s*)•\s*(.*)$/);
      const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s*(.*)$/);

      if (bulletMatch) {
        e.preventDefault();
        const indent = bulletMatch[1];
        const textAfterBullet = bulletMatch[2];

        if (textAfterBullet.trim() === '') {
          // Empty bullet -> user pressed Enter -> remove bullet
          const startOfLine = lastNewlineIdx === -1 ? 0 : lastNewlineIdx + 1;
          const newValue = value.substring(0, startOfLine) + afterCursor;
          onUpdate({ content: newValue, listType: newValue.trim() === '' ? 'none' : element.listType });
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.selectionStart = startOfLine;
              inputRef.current.selectionEnd = startOfLine;
            }
          });
        } else {
          // Insert new bullet line
          const insertText = `\n${indent}• `;
          const newValue = beforeCursor + insertText + afterCursor;
          const newCursorPos = selectionStart + insertText.length;
          onUpdate({ content: newValue });
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.selectionStart = newCursorPos;
              inputRef.current.selectionEnd = newCursorPos;
            }
          });
        }
        return;
      }

      if (numberMatch) {
        e.preventDefault();
        const indent = numberMatch[1];
        const currentNum = parseInt(numberMatch[2], 10);
        const textAfterNumber = numberMatch[3];

        if (textAfterNumber.trim() === '') {
          // Empty number line -> remove number
          const startOfLine = lastNewlineIdx === -1 ? 0 : lastNewlineIdx + 1;
          const newValue = value.substring(0, startOfLine) + afterCursor;
          onUpdate({ content: newValue, listType: newValue.trim() === '' ? 'none' : element.listType });
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.selectionStart = startOfLine;
              inputRef.current.selectionEnd = startOfLine;
            }
          });
        } else {
          // Insert next numbered line
          const nextNum = currentNum + 1;
          const insertText = `\n${indent}${nextNum}. `;
          const newValue = beforeCursor + insertText + afterCursor;
          const newCursorPos = selectionStart + insertText.length;
          onUpdate({ content: newValue });
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.selectionStart = newCursorPos;
              inputRef.current.selectionEnd = newCursorPos;
            }
          });
        }
        return;
      }

      if (element.listType === 'bullet') {
        e.preventDefault();
        const insertText = '\n• ';
        const newValue = beforeCursor + insertText + afterCursor;
        const newCursorPos = selectionStart + insertText.length;
        onUpdate({ content: newValue });
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = newCursorPos;
            inputRef.current.selectionEnd = newCursorPos;
          }
        });
        return;
      }

      if (element.listType === 'number') {
        e.preventDefault();
        const lines = beforeCursor.split('\n');
        const nextNum = lines.length + 1;
        const insertText = `\n${nextNum}. `;
        const newValue = beforeCursor + insertText + afterCursor;
        const newCursorPos = selectionStart + insertText.length;
        onUpdate({ content: newValue });
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = newCursorPos;
            inputRef.current.selectionEnd = newCursorPos;
          }
        });
        return;
      }
    }

    if (e.key === 'Backspace') {
      const textarea = inputRef.current;
      if (!textarea || textarea.selectionStart !== textarea.selectionEnd) return;

      const { selectionStart, value } = textarea;
      const beforeCursor = value.substring(0, selectionStart);
      const lastNewlineIdx = beforeCursor.lastIndexOf('\n');
      const currentLine = lastNewlineIdx === -1 ? beforeCursor : beforeCursor.substring(lastNewlineIdx + 1);

      const bulletPrefixMatch = currentLine.match(/^(\s*•\s*)$/);
      const numberPrefixMatch = currentLine.match(/^(\s*\d+\.\s*)$/);

      if (bulletPrefixMatch || numberPrefixMatch) {
        e.preventDefault();
        const startOfLine = lastNewlineIdx === -1 ? 0 : lastNewlineIdx + 1;
        const newValue = value.substring(0, startOfLine) + value.substring(selectionStart);
        onUpdate({ content: newValue, listType: newValue.trim() === '' ? 'none' : element.listType });
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = startOfLine;
            inputRef.current.selectionEnd = startOfLine;
          }
        });
      }
    }
  };

  const handleListToggle = () => {
    const currentType: ListType = element.listType || 'none';
    let nextType: ListType = 'bullet';
    if (currentType === 'bullet') {
      nextType = 'number';
    } else if (currentType === 'number') {
      nextType = 'none';
    } else {
      nextType = 'bullet';
    }

    const newContent = convertListContent(element.content || '', nextType);
    onUpdate({ listType: nextType, content: newContent });
  };

  const handleAlignToggle = () => {
    const nextAlign = getNextTextAlign(element.textAlign || 'none');
    onUpdate({ textAlign: nextAlign });
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

    // Select immediately so it feels snappy
    onSelect();
    setShowCopyPill(false);

    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;

    dragSnapshot.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      elX: element.x,
      elY: element.y,
    };

    // Long-press: if finger hasn't moved much after 600ms, show copy pill
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      // Only fire if finger is still stationary
      setIsDragging(false);
      dragSnapshot.current = null;
      setShowCopyPill(true);
      if (onLongPress) onLongPress();
    }, 600);

    // Cancel long-press if finger moves more than 8px
    const cancelOnMove = (me: TouchEvent) => {
      if (me.touches.length < 1) return;
      const t = me.touches[0];
      const dist = Math.hypot(t.clientX - startX, t.clientY - startY);
      if (dist > 8) {
        if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
        document.removeEventListener('touchmove', cancelOnMove);
      }
    };
    const cancelOnEnd = () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
      document.removeEventListener('touchmove', cancelOnMove);
      document.removeEventListener('touchend', cancelOnEnd);
    };
    document.addEventListener('touchmove', cancelOnMove, { passive: true });
    document.addEventListener('touchend', cancelOnEnd, { once: true });

    setIsDragging(true);
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
      onTouchStart={startTouchDrag}
    >
      {/* Text content */}
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={element.content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="w-full resize-none border-none bg-transparent outline-none overflow-hidden block"
          style={{
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
          }}
        />
      ) : (
        <div
          onDoubleClick={handleTextDoubleClick}
          style={{
            fontSize: `${element.fontSize}px`,
            fontFamily: element.fontFamily || 'var(--font-poppins)',
            color: element.color ?? '#000000',
            fontWeight: element.fontWeight ?? 400,
            fontStyle: element.fontStyle || 'normal',
            textDecoration: element.textDecoration || 'none',
            textAlign: element.textAlign && element.textAlign !== 'none' ? element.textAlign : 'left',
            minHeight: `${element.fontSize + 8}px`,
            lineHeight: '1.2',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
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
      {/* Copy / Delete pill row — shown after long-press on mobile */}
      {showCopyPill && isSelected && !isEditing && (
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
          {/* Copy */}
          <button
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowCopyPill(false);
              if (onLongPress) onLongPress();
            }}
            style={{
              background: 'rgba(20, 22, 30, 0.92)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '20px',
              padding: '8px 22px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '0.01em',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            <span style={{ fontSize: '17px' }}>⎘</span> Copy
          </button>

          {/* Delete */}
          <button
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowCopyPill(false);
              onDelete();
            }}
            style={{
              background: 'rgba(20, 22, 30, 0.92)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(239,68,68,0.45)',
              borderRadius: '20px',
              padding: '8px 22px',
              color: '#ef4444',
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '0.01em',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export type { TextElement };
