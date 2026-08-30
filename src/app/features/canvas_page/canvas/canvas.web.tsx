'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A4 Resume dimensions:
 * - Editing (true size): 794px × 1123px at 96 DPI — this is what the DOM
 *   element actually measures. Never change these for "fit" purposes;
 *   scale the wrapper visually instead (see fitScale below).
 * - Export: 2480px × 3508px at 300 DPI for print-quality PDF output.
 * - Physical: 21.0cm × 29.7cm
 */
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

export default function CanvasWeb() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    function calculateFitScale() {
      const container = containerRef.current;
      if (!container) return;
      // leave breathing room around the page instead of edge-to-edge
      const padding = 64;
      const availableWidth = container.clientWidth - padding * 2;
      const availableHeight = container.clientHeight - padding * 2;
      const scale = Math.min(
        availableWidth / PAGE_WIDTH,
        availableHeight / PAGE_HEIGHT,
        1 // never zoom in past true size, only down
      );
      setFitScale(scale);
    }

    calculateFitScale();
    window.addEventListener('resize', calculateFitScale);
    return () => window.removeEventListener('resize', calculateFitScale);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center overflow-auto"
      style={{
        minHeight: '100vh',
        width: '100%',
        paddingTop: '120px', // Space for toolbar + extra push down
        paddingBottom: '100px',
      }}
    >
      {/*
        This outer div reserves the SCALED footprint in layout so the
        centering flexbox doesn't leave a gap where the unscaled size used
        to be. Without this, transform:scale() shrinks the visual box but
        not the space it occupies, so it won't stay centered.
      */}
      <div
        style={{
          width: PAGE_WIDTH * fitScale,
          height: PAGE_HEIGHT * fitScale,
        }}
      >
        <div
          ref={canvasRef}
          id="resume-canvas"
          style={{
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            transform: `scale(${fitScale})`,
            transformOrigin: 'top left',
            position: 'relative',
            backgroundColor: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Canvas content will go here */}
        </div>
      </div>
    </div>
  );
}
