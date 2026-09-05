'use client';

import { useEffect, useRef, useState } from 'react';
import { usePen } from '../../context/PenContext';
import { useCanvas } from '../../context/CanvasContext';

export function PenCanvas() {
  const { isPenActive, penColor, penThickness, strokes, addStroke } = usePen();
  const { zoom, pan } = useCanvas();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!isPenActive) return;

    const canvas = document.querySelector('[data-canvas-area]') as HTMLElement;
    if (!canvas) return;

    const getCanvasCoordinates = (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      
      // Transform the point from screen coordinates to SVG coordinates
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      return { x: svgP.x, y: svgP.y };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!isPenActive) return;
      e.preventDefault();
      e.stopPropagation();
      
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      setIsDrawing(true);
      setCurrentPoints([coords]);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing || !isPenActive) return;
      e.preventDefault();
      e.stopPropagation();
      
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      setCurrentPoints(prev => [...prev, coords]);
    };

    const handleMouseUp = () => {
      if (!isDrawing || currentPoints.length < 2) {
        setIsDrawing(false);
        setCurrentPoints([]);
        return;
      }

      // Save the stroke
      addStroke({
        id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        points: currentPoints,
        color: penColor,
        thickness: penThickness,
      });

      setIsDrawing(false);
      setCurrentPoints([]);
    };

    // Touch support
    const handleTouchStart = (e: TouchEvent) => {
      if (!isPenActive || e.touches.length !== 1) return;
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
      setIsDrawing(true);
      setCurrentPoints([coords]);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDrawing || !isPenActive || e.touches.length !== 1) return;
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
      setCurrentPoints(prev => [...prev, coords]);
    };

    const handleTouchEnd = () => {
      handleMouseUp();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPenActive, isDrawing, currentPoints, penColor, penThickness, addStroke, zoom, pan]);

  // Convert points array to SVG path with smoothing
  const pointsToPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    
    // Start at first point
    let path = `M ${points[0].x} ${points[0].y}`;
    
    // Use quadratic curves for smoother lines
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      path += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`;
    }
    
    // Line to last point
    if (points.length > 1) {
      const last = points[points.length - 1];
      path += ` L ${last.x} ${last.y}`;
    }
    
    return path;
  };

  if (!isPenActive && strokes.length === 0) return null;

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isPenActive ? 'auto' : 'none',
        zIndex: 10,
        cursor: isPenActive ? 'crosshair' : 'default',
      }}
    >
      {/* Render saved strokes */}
      {strokes.map(stroke => (
        <path
          key={stroke.id}
          d={pointsToPath(stroke.points)}
          stroke={stroke.color}
          strokeWidth={stroke.thickness / zoom}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* Render current drawing stroke */}
      {isDrawing && currentPoints.length > 1 && (
        <path
          d={pointsToPath(currentPoints)}
          stroke={penColor}
          strokeWidth={penThickness / zoom}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
