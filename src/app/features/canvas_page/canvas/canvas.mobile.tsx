'use client';

import { useEffect, useRef, useState } from 'react';
import { useCanvas } from '../context/CanvasContext';

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
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);

  // Touch pan
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch = pan
        setIsPanning(true);
        setPanStart({ 
          x: e.touches[0].clientX - pan.x, 
          y: e.touches[0].clientY - pan.y 
        });
      } else if (e.touches.length === 2) {
        // Two fingers = prepare for pinch zoom
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        setLastTouchDistance(distance);
        setIsPanning(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1 && isPanning) {
        // Pan
        setPan({
          x: e.touches[0].clientX - panStart.x,
          y: e.touches[0].clientY - panStart.y,
        });
      } else if (e.touches.length === 2) {
        // Pinch zoom
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
  }, [isPanning, panStart, pan, zoom, lastTouchDistance, setPan, setZoom]);

  return (
    <div
      ref={viewportRef}
      className="fixed inset-0 overflow-hidden"
      style={{
        touchAction: 'none', // Prevent default touch behaviors
      }}
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
          >
            {/* Canvas content will go here */}
          </div>
        </div>
      </div>
    </div>
  );
}
