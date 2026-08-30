'use client';

import { useEffect, useRef, useState } from 'react';
import { useCanvas } from '../context/CanvasContext';

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
const ZOOM_STEP = 0.05; // More subtle: 5% instead of 10%

export default function CanvasWeb() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  
  const { zoom, setZoom, pan, setPan, isGrabMode } = useCanvas();
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

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
  }, [isPanning, panStart, pan, isGrabMode]);

  // Zoom with mouse wheel
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
      
      setZoom(newZoom);
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [zoom]);

  return (
    <div
      ref={viewportRef}
      className="fixed inset-0 overflow-hidden"
      style={{
        cursor: isGrabMode ? (isPanning ? 'grabbing' : 'grab') : 'default',
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
