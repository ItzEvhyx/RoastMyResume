'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { useText } from '../context/TextContext';
import { useDivider } from '../context/DividerContext';
import { useIcon } from '../context/IconContext';
import { usePen } from '../context/PenContext';
import { useClipboard, ClipboardEntry } from '../globals/pasting';
import { DraggableText, DraggableDivider, DraggableIcon } from '../globals/drag.elements';
import { PenCanvas } from '../tool_sidebar/pen/pen.canvas';
import type { TextElement } from '../context/TextContext';
import type { DividerElement } from '../context/DividerContext';
import type { IconElement } from '../context/IconContext';
import type { PenStroke } from '../context/PenContext';
import { clampDividerToSafeArea, clampTextToSafeArea, clampIconToSafeArea, getTextHeight, SafeAreaWarning } from './safe.area';

/**
 * Mobile version: pinch-to-zoom and drag-to-pan
 * A4 dimensions: 794px × 1123px
 */
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const CANVAS_HORIZONTAL_PADDING = 32;

// Paste pill position in canvas-space coords
interface PasteTarget {
  canvasX: number;
  canvasY: number;
  screenX: number; // screen px for positioning the pill overlay
  screenY: number;
}

interface EdgeWarning {
  x: number;
  y: number;
  height: number;
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
  const {
    dividerElements,
    selectedDividerId,
    setSelectedDividerId,
    addDividerElement,
    updateDivider,
    deleteDivider,
  } = useDivider();
  const { iconElements, selectedIconId, setSelectedIconId, updateIcon, deleteIcon, addFullIconElement } = useIcon();
  const { strokes, selectedStrokeId, setSelectedStrokeId, addStroke, isPenActive } = usePen();
  const { clipboard, register, unregister, copy } = useClipboard();

  const [pasteTarget, setPasteTarget] = useState<PasteTarget | null>(null);
  const [edgeWarning, setEdgeWarning] = useState<EdgeWarning | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureRef = useRef({ isPanning: false, startX: 0, startY: 0, lastDistance: 0 });
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const selectionRef = useRef({ text: selectedId, divider: selectedDividerId, icon: selectedIconId });
  const penActiveRef = useRef(isPenActive);

  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => {
    selectionRef.current = { text: selectedId, divider: selectedDividerId, icon: selectedIconId };
  }, [selectedId, selectedDividerId, selectedIconId]);
  useEffect(() => { penActiveRef.current = isPenActive; }, [isPenActive]);

  const showEdgeWarning = useCallback((warning: EdgeWarning) => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    setEdgeWarning(warning);
  }, []);

  const clearEdgeWarning = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    setEdgeWarning(null);
  }, []);

  useEffect(() => () => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
  }, []);

  const updateTextSafely = (element: TextElement, updates: Partial<TextElement>) => {
    const result = clampTextToSafeArea(element, updates);
    updateElement(element.id, result.updates);
    if (result.wasClamped) {
      const next = { ...element, ...result.updates };
      showEdgeWarning({ x: next.x, y: next.y, height: getTextHeight(next) });
    } else {
      clearEdgeWarning();
    }
  };

  const updateDividerSafely = (element: DividerElement, updates: Partial<DividerElement>) => {
    const result = clampDividerToSafeArea(element, updates);
    updateDivider(element.id, result.updates);
    if (result.wasClamped) {
      const next = { ...element, ...result.updates };
      showEdgeWarning({ x: next.x, y: next.y, height: next.thickness ?? 2 });
    } else {
      clearEdgeWarning();
    }
  };

  const updateIconSafely = (element: IconElement, updates: Partial<IconElement>) => {
    const result = clampIconToSafeArea(element, updates);
    updateIcon(element.id, result.updates);
    if (result.wasClamped) {
      const next = { ...element, ...result.updates };
      showEdgeWarning({ x: next.x, y: next.y, height: next.size });
    } else {
      clearEdgeWarning();
    }
  };

  // Start with the full canvas width visible instead of the desktop zoom level.
  useEffect(() => {
    const fitToWidth = (window.innerWidth - CANVAS_HORIZONTAL_PADDING) / PAGE_WIDTH;
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, fitToWidth)));
  }, [setZoom]);

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
  }, [selectedId, textElements, register, unregister, addFullTextElement]);

  // Register dividers with the same global clipboard used by text elements.
  useEffect(() => {
    register('divider', {
      getCurrent: () => {
        if (!selectedDividerId) return null;
        const element = dividerElements.find(item => item.id === selectedDividerId);
        return element ? { type: 'divider', data: { ...element } } : null;
      },
      paste: (entry: ClipboardEntry, dx: number, dy: number) => {
        const src = entry.data as Record<string, unknown>;
        const width = (src.width as number) ?? 300;
        const id = addDividerElement(((src.x as number) ?? 100) + dx, ((src.y as number) ?? 100) + dy, width);
        updateDivider(id, {
          thickness: src.thickness as number | undefined,
          color: src.color as string | undefined,
        });
      },
    });
    return () => unregister('divider');
  }, [selectedDividerId, dividerElements, register, unregister, addDividerElement, updateDivider]);

  // Register icons for the global copy/paste workflow.
  useEffect(() => {
    register('icon', {
      getCurrent: () => {
        if (!selectedIconId) return null;
        const el = iconElements.find(e => e.id === selectedIconId);
        return el ? { type: 'icon', data: { ...el } } : null;
      },
      paste: (entry: ClipboardEntry, dx: number, dy: number) => {
        const src = entry.data as IconElement;
        addFullIconElement({
          x: (src.x ?? 100) + dx,
          y: (src.y ?? 100) + dy,
          size: src.size ?? 48,
          width: src.width,
          height: src.height,
          isShape: src.isShape,
          shapeKind: src.shapeKind,
          borderWidth: src.borderWidth,
          borderColor: src.borderColor,
          cornerRadius: src.cornerRadius,
          svgUrl: src.svgUrl ?? '',
          color: src.color ?? '#000000',
          flip: src.flip,
        });
      },
    });
    return () => unregister('icon');
  }, [selectedIconId, iconElements, register, unregister, addFullIconElement]);

  // Pen strokes use the same hold → Copy/Delete → tap canvas → Paste flow.
  useEffect(() => {
    register('pen-stroke', {
      getCurrent: () => {
        if (!selectedStrokeId) return null;
        const stroke = strokes.find(item => item.id === selectedStrokeId);
        return stroke ? { type: 'pen-stroke', data: { ...stroke } } : null;
      },
      paste: (entry: ClipboardEntry, dx: number, dy: number) => {
        const src = entry.data as unknown as PenStroke;
        addStroke({
          ...src,
          id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          points: src.points.map(point => ({ x: point.x + dx, y: point.y + dy })),
        });
      },
    });
    return () => unregister('pen-stroke');
  }, [selectedStrokeId, strokes, register, unregister, addStroke]);

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
      setSelectedDividerId(null);
      setSelectedIconId(null);
      setSelectedStrokeId(null);
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
    setSelectedDividerId(null);
    setSelectedIconId(null);
    setSelectedStrokeId(null);
  }, [clipboard, screenToCanvas, setSelectedId, setSelectedDividerId, setSelectedIconId, setSelectedStrokeId]);

  // Paste the element at the tapped location
  const executePaste = useCallback(() => {
    if (!clipboard || !pasteTarget) return;
    const src = clipboard.data as Record<string, unknown>;
    const w = (src.width as number) ?? 150;
    if (clipboard.type === 'divider') {
      const id = addDividerElement(pasteTarget.canvasX - w / 2, pasteTarget.canvasY, w);
      updateDivider(id, {
        thickness: src.thickness as number | undefined,
        color: src.color as string | undefined,
      });
      setPasteTarget(null);
      return;
    }
    if (clipboard.type === 'pen-stroke') {
      const stroke = src as unknown as PenStroke;
      const anchor = stroke.points[0];
      if (anchor) {
        addStroke({
          ...stroke,
          id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          points: stroke.points.map(point => ({
            x: point.x + pasteTarget.canvasX - anchor.x,
            y: point.y + pasteTarget.canvasY - anchor.y,
          })),
        });
      }
      setPasteTarget(null);
      return;
    }
    if (clipboard.type === 'icon') {
      const icon = src as unknown as IconElement;
      const size = icon.size ?? 48;
      const width = icon.width ?? size;
      const height = icon.height ?? size;
      addFullIconElement({
        x: pasteTarget.canvasX - width / 2,
        y: pasteTarget.canvasY - height / 2,
        size,
        width: icon.width,
        height: icon.height,
        isShape: icon.isShape,
        shapeKind: icon.shapeKind,
        borderWidth: icon.borderWidth,
        borderColor: icon.borderColor,
        cornerRadius: icon.cornerRadius,
        svgUrl: icon.svgUrl ?? '',
        color: icon.color ?? '#000000',
        flip: icon.flip,
      });
      setPasteTarget(null);
      return;
    }
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
  }, [clipboard, pasteTarget, addFullTextElement, addDividerElement, updateDivider, addFullIconElement, addStroke]);

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
      const gesture = gestureRef.current;
      if (e.touches.length === 2) {
        gesture.lastDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        gesture.isPanning = false;
        return;
      }

      const selection = selectionRef.current;
      if (e.touches.length === 1 && !penActiveRef.current && !selection.text && !selection.divider && !selection.icon) {
        gesture.isPanning = true;
        gesture.startX = e.touches[0].clientX - panRef.current.x;
        gesture.startY = e.touches[0].clientY - panRef.current.y;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const gesture = gestureRef.current;
      if (e.touches.length === 2) {
        e.preventDefault();
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        if (gesture.lastDistance > 0) {
          const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current * (distance / gesture.lastDistance)));
          zoomRef.current = nextZoom;
          setZoom(nextZoom);
        }
        gesture.lastDistance = distance;
        gesture.isPanning = false;
        return;
      }

      if (e.touches.length === 1 && gesture.isPanning) {
        e.preventDefault();
        const nextPan = {
          x: e.touches[0].clientX - gesture.startX,
          y: e.touches[0].clientY - gesture.startY,
        };
        panRef.current = nextPan;
        setPan(nextPan);
      }
    };

    const handleTouchEnd = () => {
      gestureRef.current.lastDistance = 0;
      gestureRef.current.isPanning = false;
    };

    // Capture phase means an element's own touch handler cannot swallow a
    // pinch before the canvas sees both fingers.
    viewport.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    viewport.addEventListener('touchend', handleTouchEnd, { capture: true });

    return () => {
      viewport.removeEventListener('touchstart', handleTouchStart, true);
      viewport.removeEventListener('touchmove', handleTouchMove, true);
      viewport.removeEventListener('touchend', handleTouchEnd, true);
    };
  }, [setPan, setZoom]);

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
            data-canvas-area
            style={{
              width: PAGE_WIDTH,
              height: PAGE_HEIGHT,
              position: 'relative',
              backgroundColor: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            // Tap on canvas background → deselect or show paste target
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedId(null);
                setSelectedDividerId(null);
                setSelectedIconId(null);
                setSelectedStrokeId(null);
              }
            }}
            onTouchEnd={handleCanvasTap}
          >
            {edgeWarning && <SafeAreaWarning x={edgeWarning.x} y={edgeWarning.y} height={edgeWarning.height} />}
            <PenCanvas />
            {textElements.map(element => (
              <DraggableText
                key={element.id}
                element={element}
                isSelected={selectedId === element.id}
                onSelect={() => {
                  setSelectedDividerId(null);
                  setSelectedIconId(null);
                  setSelectedStrokeId(null);
                  setSelectedId(element.id);
                  setPasteTarget(null);
                }}
                onUpdate={(updates) => updateTextSafely(element, updates)}
                onDelete={() => deleteElement(element.id)}
                onDragEnd={clearEdgeWarning}
                onLongPress={handleElementLongPress}
              />
            ))}
            {dividerElements.map(element => (
              <DraggableDivider
                key={element.id}
                element={element}
                isSelected={selectedDividerId === element.id}
                onSelect={() => {
                  setSelectedId(null);
                  setSelectedIconId(null);
                  setSelectedStrokeId(null);
                  setSelectedDividerId(element.id);
                  setPasteTarget(null);
                }}
                onUpdate={(updates) => updateDividerSafely(element, updates)}
                onDelete={() => deleteDivider(element.id)}
                onDragEnd={clearEdgeWarning}
                onLongPress={handleElementLongPress}
              />
            ))}
            {iconElements.map(element => (
              <DraggableIcon
                key={element.id}
                element={element}
                isSelected={selectedIconId === element.id}
                onSelect={() => {
                  setSelectedId(null);
                  setSelectedDividerId(null);
                  setSelectedStrokeId(null);
                  setSelectedIconId(element.id);
                  setPasteTarget(null);
                }}
                onUpdate={(updates) => updateIconSafely(element, updates)}
                onDelete={() => deleteIcon(element.id)}
                onDragEnd={clearEdgeWarning}
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
