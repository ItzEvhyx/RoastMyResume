'use client';

import { useEffect, useRef, useState } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { useText } from '../context/TextContext';
import { DraggableText } from '../tool_sidebar/texts/drag.text';

/**
 * Mobile version: pinch-to-zoom and drag-to-pan
 * A4 dimensions: 794px × 1123px
 */
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;

export default function CanvasMobile() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  
  const { zoom, setZoom, pan, setPan } = useCanvas();
  const { textElements, selectedId, setSelectedId, updateElement, deleteElement, addTextElement } = useText();
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);

  // Global clipboard paste
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
        updateElement(selectedId, {
          content: text,
          width: Math.max(150, estimatedWidth),
        });
      } else {
        addTextElement(
          PAGE_WIDTH / 2 - Math.min(estimatedWidth, 400) / 2,
          PAGE_HEIGHT / 3,
          text,
          estimatedWidth
        );
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [selectedId, updateElement, addTextElement]);

  // Touch pan + pinch-zoom
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
          y: e.touches[0].clientY - pan.y 
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
            // Tap on canvas background → deselect
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedId(null);
            }}
            onTouchEnd={(e) => {
              if (e.target === e.currentTarget) setSelectedId(null);
            }}
          >
            {textElements.map(element => (
              <DraggableText
                key={element.id}
                element={element}
                isSelected={selectedId === element.id}
                onSelect={() => setSelectedId(element.id)}
                onUpdate={(updates) => updateElement(element.id, updates)}
                onDelete={() => deleteElement(element.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
