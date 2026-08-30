'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { useText } from '../context/TextContext';
import { useClipboard, ClipboardEntry } from '../globals/pasting';
import { DraggableText } from '../tool_sidebar/texts/drag.text';
import type { TextElement } from '../context/TextContext';

/**
 * Mobile version: pinch-to-zoom and drag-to-pan
 * A4 dimensions: 794px × 1123px
 */
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;

// Paste pill position in canvas-space coords
interface PasteTarget {
  canvasX: number;
  canvasY: number;
  screenX: number; // screen px for positioning the pill overlay
  screenY: number;
}

export default function CanvasMobile() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const { zoom, setZoom, pan, setPan } = useCanvas();
  const {
    textElements,
    selectedId,
    setSelectedId,
    updateElement,
    deleteElement,
    addFullTextElement,
  } = useText();
  const { clipboard, register, unregister, copy } = useClipboard();

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [pasteTarget, setPasteTarget] = useState<PasteTarget | null>(null);

  // ---------------------------------------------------------------------------
  // Register text clipboard source (mirrors canvas.web.tsx)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    register('text', {
      getCurrent: () => {
        if (!selectedId) return null;
        const el = textElements.find(e => e.id === selectedId);
        if (!el) return null;
        return { type: 'text', data: { ...el } };
      },
      paste: (entry: ClipboardEntry, dx: number, dy: number) => {
        const src = entry.data as Record<string, unknown>;
        addFullTextElement({
          content:        (src.content as string)        ?? 'Add text',
          x:              ((src.x as number) ?? 100) + dx,
          y:              ((src.y as number) ?? 100) + dy,
          width:          (src.width as number)          ?? 150,
          fontSize:       (src.fontSize as number)       ?? 24,
          fontFamily:     (src.fontFamily as string)     ?? 'Arial, sans-serif',
          color:          (src.color as string)          ?? '#000000',
          fontWeight:     src.fontWeight  as number | undefined,
          fontStyle:      src.fontStyle   as 'normal' | 'italic' | undefined,
          textDecoration: src.textDecoration as 'none' | 'underline' | undefined,
          listType:       src.listType    as 'none' | 'bullet' | 'number' | undefined,
          textAlign:      src.textAlign   as 'none' | 'left' | 'right' | 'center' | 'justify' | undefined,
          textCategory:   src.textCategory as 'header' | 'subheader' | 'body' | 'meta' | null | undefined,
        });
      },
    });
    return () => unregister('text');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, textElements, register, unregister, addFullTextElement]);

  // ---------------------------------------------------------------------------
  // Convert screen touch position → canvas-space coordinates
  // ---------------------------------------------------------------------------
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { canvasX: 0, canvasY: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      canvasX: (clientX - rect.left) / zoom,
      canvasY: (clientY - rect.top) / zoom,
    };
  }, [zoom]);

  // ---------------------------------------------------------------------------
  // Long-press on element → copy it and show paste pill will appear on next tap
  // ---------------------------------------------------------------------------
  const handleElementLongPress = useCallback(() => {
    copy();  // copy the currently selected element via clipboard context
    setPasteTarget(null); // reset any old paste target
  }, [copy]);

  // ---------------------------------------------------------------------------
  // Tap on canvas background → if clipboard has something, show paste pill
  // ---------------------------------------------------------------------------
  const handleCanvasTap = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // only raw canvas background
    if (e.changedTouches.length < 1) return;

    if (!clipboard) {
      setSelectedId(null);
      return;
    }

    const touch = e.changedTouches[0];
    const { canvasX, canvasY } = screenToCanvas(touch.clientX, touch.clientY);

    setPasteTarget({
      canvasX,
      canvasY,
      screenX: touch.clientX,
      screenY: touch.clientY,
    });
    setSelectedId(null);
  }, [clipboard, screenToCanvas, setSelectedId]);

  // Paste the element at the tapped location
  const executePaste = useCallback(() => {
    if (!clipboard || !pasteTarget) return;
    const src = clipboard.data as Record<string, unknown>;
    const w = (src.width as number) ?? 150;
    addFullTextElement({
      content:        (src.content as string)        ?? 'Add text',
      x:              pasteTarget.canvasX - w / 2,
      y:              pasteTarget.canvasY,
      width:          w,
      fontSize:       (src.fontSize as number)       ?? 24,
      fontFamily:     (src.fontFamily as string)     ?? 'Arial, sans-serif',
      color:          (src.color as string)          ?? '#000000',
      fontWeight:     src.fontWeight  as number | undefined,
      fontStyle:      src.fontStyle   as 'normal' | 'italic' | undefined,
      textDecoration: src.textDecoration as 'none' | 'underline' | undefined,
      listType:       src.listType    as 'none' | 'bullet' | 'number' | undefined,
      textAlign:      src.textAlign   as 'none' | 'left' | 'right' | 'center' | 'justify' | undefined,
      textCategory:   src.textCategory as 'header' | 'subheader' | 'body' | 'meta' | null | undefined,
    } as Omit<TextElement, 'id'>);
    setPasteTarget(null);
  }, [clipboard, pasteTarget, addFullTextElement]);

  // ---------------------------------------------------------------------------
  // Global clipboard paste (system paste event fallback)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }
      const text = e.clipboardData?.getData('text');
      if (!text || text.trim() === '') return;
      e.preventDefault();
      const lines = text.split('\n');
      const maxLen = Math.max(...lines.map(l => l.length));
      const estimatedWidth = Math.min(650, Math.max(200, Math.round(maxLen * 14)));
      if (selectedId) {
        updateElement(selectedId, { content: text, width: Math.max(150, estimatedWidth) });
      } else {
        addFullTextElement({
          content: text,
          x: PAGE_WIDTH / 2 - Math.min(estimatedWidth, 400) / 2,
          y: PAGE_HEIGHT / 3,
          width: estimatedWidth,
          fontSize: 24,
          fontFamily: 'Arial, sans-serif',
          color: '#000000',
        });
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [selectedId, updateElement, addFullTextElement]);

  // ---------------------------------------------------------------------------
  // Touch pan + pinch-zoom
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Lock canvas pan/zoom whenever a text element is selected
      if (selectedId !== null) return;

      if (e.touches.length === 1) {
        setIsPanning(true);
        setPanStart({
          x: e.touches[0].clientX - pan.x,
          y: e.touches[0].clientY - pan.y,
        });
      } else if (e.touches.length === 2) {
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        setLastTouchDistance(distance);
        setIsPanning(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Lock canvas pan/zoom whenever a text element is selected
      if (selectedId !== null) return;

      e.preventDefault();

      if (e.touches.length === 1 && isPanning) {
        setPan({
          x: e.touches[0].clientX - panStart.x,
          y: e.touches[0].clientY - panStart.y,
        });
      } else if (e.touches.length === 2) {
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastTouchDistance > 0) {
          const scale = distance / lastTouchDistance;
          const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * scale));
          setZoom(newZoom);
        }
        setLastTouchDistance(distance);
      }
    };

    const handleTouchEnd = () => {
      setIsPanning(false);
      setLastTouchDistance(0);
    };

    viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd);

    return () => {
      viewport.removeEventListener('touchstart', handleTouchStart);
      viewport.removeEventListener('touchmove', handleTouchMove);
      viewport.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPanning, panStart, pan, zoom, lastTouchDistance, selectedId, setPan, setZoom]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      ref={viewportRef}
      className="fixed inset-0 overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Pannable and zoomable container */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
          willChange: 'transform',
        }}
      >
        {/* Canvas at current zoom */}
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
        >
          <div
            ref={canvasRef}
            id="resume-canvas"
            style={{
              width: PAGE_WIDTH,
              height: PAGE_HEIGHT,
              position: 'relative',
              backgroundColor: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            // Tap on canvas background → deselect or show paste target
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedId(null);
            }}
            onTouchEnd={handleCanvasTap}
          >
            {textElements.map(element => (
              <DraggableText
                key={element.id}
                element={element}
                isSelected={selectedId === element.id}
                onSelect={() => { setSelectedId(element.id); setPasteTarget(null); }}
                onUpdate={(updates) => updateElement(element.id, updates)}
                onDelete={() => deleteElement(element.id)}
                onLongPress={handleElementLongPress}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Paste pill — fixed over screen, appears after tapping canvas       */}
      {/* ----------------------------------------------------------------- */}
      {pasteTarget && clipboard && (
        <div
          style={{
            position: 'fixed',
            left: pasteTarget.screenX,
            top: pasteTarget.screenY,
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            pointerEvents: 'auto',
          }}
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
          onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
        >
          {/* Ripple dot to show where they tapped */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              width: 10,
              height: 10,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(99,102,241,0.35)',
              animation: 'mobileRipple 0.35s ease-out forwards',
            }}
          />
          <button
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              executePaste();
            }}
            style={{
              position: 'relative',
              background: 'rgba(20, 22, 30, 0.94)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '20px',
              padding: '9px 24px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '0.01em',
              boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              transform: 'translateY(28px)',
              animation: 'mobilePillPop 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards',
            }}
          >
            Paste here
          </button>
        </div>
      )}

      {/* Dismiss paste pill when tapping elsewhere */}
      {pasteTarget && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
          onTouchEnd={(e) => {
            // Only dismiss if not tapping the pill itself
            const target = e.target as HTMLElement;
            if (!target.closest('button')) setPasteTarget(null);
          }}
        />
      )}

      {/* Keyframe animations injected inline */}
      <style>{`
        @keyframes mobilePillPop {
          from { opacity: 0; transform: translateY(28px) scale(0.85); }
          to   { opacity: 1; transform: translateY(28px) scale(1); }
        }
        @keyframes mobileRipple {
          from { transform: translate(-50%,-50%) scale(1); opacity: 0.6; }
          to   { transform: translate(-50%,-50%) scale(4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
