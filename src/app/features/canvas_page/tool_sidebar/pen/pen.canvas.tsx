'use client';

import { useEffect, useRef, useState } from 'react';
import { usePen } from '../../context/PenContext';
import { useCanvas } from '../../context/CanvasContext';
import { CANVAS_HEIGHT, CANVAS_WIDTH, SAFE_MARGIN } from '../../canvas/safe.area';

type Point = { x: number; y: number };

function isInsidePenSafeArea(point: Point, radius: number) {
  return (
    point.x >= SAFE_MARGIN + radius
    && point.x <= CANVAS_WIDTH - SAFE_MARGIN - radius
    && point.y >= SAFE_MARGIN + radius
    && point.y <= CANVAS_HEIGHT - SAFE_MARGIN - radius
  );
}

export function PenCanvas() {
  const {
    isPenActive,
    isEraserActive,
    eraserSize,
    penColor,
    penThickness,
    strokes,
    addStroke,
    eraseStrokesAt,
  } = usePen();
  const { zoom, pan } = useCanvas();
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [cursorPoint, setCursorPoint] = useState<Point | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lastEraserPointRef = useRef<Point | null>(null);
  const brushRadius = penThickness / (2 * zoom);
  const brushGuideRadius = Math.max(brushRadius, 10 / zoom);

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

    const eraseAt = (point: Point) => {
      const previousPoint = lastEraserPointRef.current;
      if (!previousPoint) {
        eraseStrokesAt(point, eraserSize, zoom);
        lastEraserPointRef.current = point;
        return;
      }

      const distance = Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y);
      const maxStep = Math.max(1, eraserSize / (zoom * 3));
      const steps = Math.max(1, Math.ceil(distance / maxStep));
      for (let step = 1; step <= steps; step += 1) {
        eraseStrokesAt({
          x: previousPoint.x + ((point.x - previousPoint.x) * step) / steps,
          y: previousPoint.y + ((point.y - previousPoint.y) * step) / steps,
        }, eraserSize, zoom);
      }
      lastEraserPointRef.current = point;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!isPenActive) return;
      e.preventDefault();
      e.stopPropagation();
      
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      const interactionRadius = (isEraserActive ? eraserSize : penThickness) / (2 * zoom);
      if (!isInsidePenSafeArea(coords, interactionRadius)) {
        setCursorPoint(null);
        return;
      }

      if (isEraserActive) {
        lastEraserPointRef.current = null;
        setIsErasing(true);
        eraseAt(coords);
        return;
      }

      setCursorPoint(coords);
      setIsDrawing(true);
      setCurrentPoints([coords]);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPenActive) return;
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      const interactionRadius = (isEraserActive ? eraserSize : penThickness) / (2 * zoom);
      const isInsideSafeArea = isInsidePenSafeArea(coords, interactionRadius);
      if (!isEraserActive) setCursorPoint(isInsideSafeArea ? coords : null);

      if (isEraserActive ? !isErasing : !isDrawing) return;
      if (!isInsideSafeArea) return;
      e.preventDefault();
      e.stopPropagation();

      if (isEraserActive) {
        if (isErasing) eraseAt(coords);
        return;
      }

      if (!isDrawing) return;
      setCurrentPoints(prev => [...prev, coords]);
    };

    const handleMouseLeave = () => {
      setCursorPoint(null);
    };

    const handleMouseUp = () => {
      if (isErasing) {
        setIsErasing(false);
        lastEraserPointRef.current = null;
        return;
      }

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
      const interactionRadius = (isEraserActive ? eraserSize : penThickness) / (2 * zoom);
      if (!isInsidePenSafeArea(coords, interactionRadius)) return;

      if (isEraserActive) {
        lastEraserPointRef.current = null;
        setIsErasing(true);
        eraseAt(coords);
        return;
      }

      setCursorPoint(null);
      setIsDrawing(true);
      setCurrentPoints([coords]);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPenActive || e.touches.length !== 1 || (isEraserActive ? !isErasing : !isDrawing)) return;
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
      const interactionRadius = (isEraserActive ? eraserSize : penThickness) / (2 * zoom);
      if (!isInsidePenSafeArea(coords, interactionRadius)) return;

      if (isEraserActive) {
        if (isErasing) eraseAt(coords);
        return;
      }

      if (!isDrawing) return;
      setCurrentPoints(prev => [...prev, coords]);
    };

    const handleTouchEnd = () => {
      handleMouseUp();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    isPenActive,
    isEraserActive,
    isDrawing,
    isErasing,
    currentPoints,
    eraserSize,
    penColor,
    penThickness,
    addStroke,
    eraseStrokesAt,
    zoom,
    pan,
  ]);

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
        cursor: isPenActive ? (isEraserActive ? 'cell' : 'none') : 'default',
      }}
    >
      {/* The print-danger zone is visible whenever the pen is active. */}
      {isPenActive && (
        <g pointerEvents="none" fill="rgba(239,68,68,0.14)">
          <rect x={0} y={0} width={CANVAS_WIDTH} height={SAFE_MARGIN} />
          <rect x={0} y={CANVAS_HEIGHT - SAFE_MARGIN} width={CANVAS_WIDTH} height={SAFE_MARGIN} />
          <rect x={0} y={SAFE_MARGIN} width={SAFE_MARGIN} height={CANVAS_HEIGHT - SAFE_MARGIN * 2} />
          <rect x={CANVAS_WIDTH - SAFE_MARGIN} y={SAFE_MARGIN} width={SAFE_MARGIN} height={CANVAS_HEIGHT - SAFE_MARGIN * 2} />
        </g>
      )}

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
      {isDrawing && !isEraserActive && currentPoints.length > 1 && (
        <path
          d={pointsToPath(currentPoints)}
          stroke={penColor}
          strokeWidth={penThickness / zoom}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* The centre disc is the exact stroke diameter; the outer ring keeps thin pens visible. */}
      {isPenActive && !isEraserActive && cursorPoint && (
        <g pointerEvents="none">
          <circle
            cx={cursorPoint.x}
            cy={cursorPoint.y}
            r={brushGuideRadius}
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(15,16,21,0.7)"
            strokeWidth={1.5 / zoom}
          />
          <circle
            cx={cursorPoint.x}
            cy={cursorPoint.y}
            r={brushRadius}
            fill={penColor}
            fillOpacity={0.35}
          />
        </g>
      )}
    </svg>
  );
}
