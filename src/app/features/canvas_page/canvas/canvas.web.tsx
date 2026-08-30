'use client';

import { useEffect, useRef, useState } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { useText } from '../context/TextContext';
import { DraggableText } from '../tool_sidebar/texts/drag.text';

/**
 * A4 Resume dimensions:
 * - Physical A4: 210mm × 297mm (21.0cm × 29.7cm)
 * - At 96 DPI: 794px × 1123px
 * - At 300 DPI (export): 2480px × 3508px
 * 
 * We use 210mm × 297mm ratio = 0.707 (width/height)
 * To get cleaner numbers: 794 × 1123 maintains this ratio
 */
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;

export default function CanvasWeb() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  
  const { zoom, setZoom, pan, setPan, isGrabMode } = useCanvas();
  const { textElements, selectedId, setSelectedId, updateElement, deleteElement, addTextElement } = useText();
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Handle drop on canvas
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tool = e.dataTransfer.getData('tool');
    
    if (tool === 'text' && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;
      addTextElement(x, y);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Pan with mouse drag (only in grab mode)
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only pan if grab mode is enabled
      if (!isGrabMode) return;
      if (e.button === 0 || e.button === 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning || !isGrabMode) return;
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    viewport.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      viewport.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart, pan, isGrabMode, setPan]);

  // Zoom with pinch gesture only (not mouse wheel)
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let lastTouchDistance = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault(); // Prevent default pinch zoom
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (lastTouchDistance > 0) {
          const delta = (currentDistance - lastTouchDistance) * 0.01;
          const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
          setZoom(newZoom);
        }

        lastTouchDistance = currentDistance;
      }
    };

    const handleTouchEnd = () => {
      lastTouchDistance = 0;
    };

    viewport.addEventListener('touchstart', handleTouchStart);
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd);

    return () => {
      viewport.removeEventListener('touchstart', handleTouchStart);
      viewport.removeEventListener('touchmove', handleTouchMove);
      viewport.removeEventListener('touchend', handleTouchEnd);
    };
  }, [zoom, setZoom]);

  return (
    <div
      ref={viewportRef}
      className="fixed inset-0 overflow-auto no-scrollbar"
      style={{
        cursor: isGrabMode ? (isPanning ? 'grabbing' : 'grab') : 'default',
      }}
      onClick={(e) => {
        // Deselect text when clicking outside canvas
        if (e.target === e.currentTarget) {
          setSelectedId(null);
        }
      }}
    >
      {/* Large container to enable scrolling when zoomed */}
      <div
        style={{
          minHeight: '100%',
          minWidth: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={(e) => {
          // Deselect when clicking the background
          if (e.target === e.currentTarget) {
            setSelectedId(null);
          }
        }}
      >
        {/* Pannable and zoomable container */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
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
              onClick={(e) => {
                // Deselect text when clicking canvas background
                if (e.target === e.currentTarget) {
                  setSelectedId(null);
                }
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {/* Render text elements */}
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
    </div>
  );
}
