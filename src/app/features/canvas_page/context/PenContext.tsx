'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useUndo } from '../globals/undo';
import { useLayerOrder } from '../globals/layer.order';

export interface PenStroke {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** The unscaled SVG coordinate space for this drawing. */
  baseWidth: number;
  baseHeight: number;
  points: { x: number; y: number }[];
  color: string;
  thickness: number;
  zIndex?: number;
}

type Point = { x: number; y: number };

function pointsMatch(first: Point, second: Point) {
  return Math.abs(first.x - second.x) < 0.001 && Math.abs(first.y - second.y) < 0.001;
}

function outsideCircleSegments(start: Point, end: Point, center: Point, radius: number) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const fromCenterX = start.x - center.x;
  const fromCenterY = start.y - center.y;
  const segmentLengthSquared = dx * dx + dy * dy;

  if (segmentLengthSquared === 0) return [];

  const discriminant = (
    2 * (fromCenterX * dx + fromCenterY * dy)
  ) ** 2 - 4 * segmentLengthSquared * (
    fromCenterX ** 2 + fromCenterY ** 2 - radius ** 2
  );

  if (discriminant <= 0) {
    const midpointX = start.x + dx / 2 - center.x;
    const midpointY = start.y + dy / 2 - center.y;
    return midpointX ** 2 + midpointY ** 2 > radius ** 2 ? [[start, end]] : [];
  }

  const root = Math.sqrt(discriminant);
  const firstIntersection = (-2 * (fromCenterX * dx + fromCenterY * dy) - root) / (2 * segmentLengthSquared);
  const secondIntersection = (-2 * (fromCenterX * dx + fromCenterY * dy) + root) / (2 * segmentLengthSquared);
  const insideStart = Math.max(0, firstIntersection);
  const insideEnd = Math.min(1, secondIntersection);

  if (insideStart >= insideEnd) {
    const midpointX = start.x + dx / 2 - center.x;
    const midpointY = start.y + dy / 2 - center.y;
    return midpointX ** 2 + midpointY ** 2 > radius ** 2 ? [[start, end]] : [];
  }

  const at = (progress: number): Point => ({ x: start.x + dx * progress, y: start.y + dy * progress });
  const segments: [Point, Point][] = [];
  if (insideStart > 0) segments.push([start, at(insideStart)]);
  if (insideEnd < 1) segments.push([at(insideEnd), end]);
  return segments;
}

function eraseCircleFromStroke(stroke: PenStroke, center: Point, radius: number) {
  if (stroke.points.length < 2) return [stroke.points];

  let removedPart = false;
  const fragments: Point[][] = [];
  let currentFragment: Point[] | null = null;

  for (let index = 1; index < stroke.points.length; index += 1) {
    const start = stroke.points[index - 1];
    const end = stroke.points[index];
    const outsideSegments = outsideCircleSegments(start, end, center, radius);

    const keptWholeSegment = outsideSegments.length === 1
      && pointsMatch(outsideSegments[0][0], start)
      && pointsMatch(outsideSegments[0][1], end);
    if (!keptWholeSegment) removedPart = true;

    for (const [outsideStart, outsideEnd] of outsideSegments) {
      if (!currentFragment || !pointsMatch(currentFragment[currentFragment.length - 1], outsideStart)) {
        if (currentFragment && currentFragment.length > 1) fragments.push(currentFragment);
        currentFragment = [outsideStart, outsideEnd];
      } else if (!pointsMatch(currentFragment[currentFragment.length - 1], outsideEnd)) {
        currentFragment.push(outsideEnd);
      }
    }

    if (outsideSegments.length === 0 && currentFragment) {
      if (currentFragment.length > 1) fragments.push(currentFragment);
      currentFragment = null;
    }
  }

  if (currentFragment && currentFragment.length > 1) fragments.push(currentFragment);
  return removedPart ? fragments : [stroke.points];
}

interface PenContextType {
  isPenActive: boolean;
  setIsPenActive: (active: boolean) => void;
  penColor: string;
  setPenColor: (color: string) => void;
  penThickness: number;
  setPenThickness: (thickness: number) => void;
  eraserSize: number;
  setEraserSize: (size: number) => void;
  isEraserActive: boolean;
  setIsEraserActive: (active: boolean) => void;
  eraseStrokesAt: (point: Point, eraserSize: number, zoom: number) => void;
  strokes: PenStroke[];
  selectedStrokeId: string | null;
  setSelectedStrokeId: (id: string | null) => void;
  addStroke: (points: Point[], color: string, thickness: number) => string;
  addFullStroke: (stroke: Omit<PenStroke, 'id'>) => string;
  updateStroke: (id: string, updates: Partial<PenStroke>) => void;
  startUpdateBatch: () => void;
  endUpdateBatch: () => void;
  removeStroke: (id: string) => void;
  clearStrokes: () => void;
}

const PenContext = createContext<PenContextType | undefined>(undefined);

export function PenProvider({ children }: { children: ReactNode }) {
  const [isPenActive, setIsPenActive] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [penThickness, setPenThickness] = useState(4);
  const [eraserSize, setEraserSize] = useState(20);
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [strokes, setStrokes] = useState<PenStroke[]>([]);
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);
  const { record, startBatch, endBatch } = useUndo();
  const { getNextLayer } = useLayerOrder();

  const addStroke = (points: Point[], color: string, thickness: number) => {
    const padding = thickness / 2;
    const x = Math.min(...points.map(point => point.x)) - padding;
    const y = Math.min(...points.map(point => point.y)) - padding;
    const width = Math.max(1, Math.max(...points.map(point => point.x)) - x + padding);
    const height = Math.max(1, Math.max(...points.map(point => point.y)) - y + padding);
    const stroke: PenStroke = {
      id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x, y, width, height, baseWidth: width, baseHeight: height,
      points: points.map(point => ({ x: point.x - x, y: point.y - y })),
      color, thickness, zIndex: getNextLayer(),
    };
    setStrokes(prev => [...prev, stroke]);
    setSelectedStrokeId(stroke.id);
    
    // Record undo/redo actions
    // Undo: remove the stroke, Redo: add it back
    record(
      () => setStrokes(prev => prev.filter(s => s.id !== stroke.id)),
      () => setStrokes(prev => [...prev, stroke])
    );
    return stroke.id;
  };

  const addFullStroke = (stroke: Omit<PenStroke, 'id'>) => {
    const full: PenStroke = { ...stroke, id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, zIndex: getNextLayer() };
    setStrokes(prev => [...prev, full]);
    setSelectedStrokeId(full.id);
    record(
      () => setStrokes(prev => prev.filter(item => item.id !== full.id)),
      () => setStrokes(prev => [...prev, full]),
    );
    return full.id;
  };

  const updateStroke = (id: string, updates: Partial<PenStroke>) => {
    const previous = strokes.find(stroke => stroke.id === id);
    if (!previous) return;
    const next = { ...previous, ...updates };
    record(
      () => setStrokes(items => items.map(item => item.id === id ? previous : item)),
      () => setStrokes(items => items.map(item => item.id === id ? next : item)),
    );
    setStrokes(items => items.map(item => item.id === id ? next : item));
  };

  const removeStroke = (id: string) => {
    const strokeToRemove = strokes.find(s => s.id === id);
    if (!strokeToRemove) return;
    
    const index = strokes.findIndex(s => s.id === id);
    setStrokes(prev => prev.filter(s => s.id !== id));
    setSelectedStrokeId(current => current === id ? null : current);
    
    // Record undo/redo actions
    // Undo: restore the stroke, Redo: remove it again
    record(
      () => setStrokes(prev => [...prev.slice(0, index), strokeToRemove, ...prev.slice(index)]),
      () => setStrokes(prev => prev.filter(s => s.id !== id))
    );
  };

  const clearStrokes = () => {
    const previousStrokes = [...strokes];
    setStrokes([]);
    setSelectedStrokeId(null);
    
    // Record undo/redo actions
    // Undo: restore all strokes, Redo: clear them again
    record(
      () => setStrokes(previousStrokes),
      () => setStrokes([])
    );
  };

  const eraseStrokesAt = (point: Point, eraserDiameter: number, zoom: number) => {
    setStrokes((previousStrokes) => previousStrokes.flatMap((stroke) => {
      // Include half the visible pen width so the eraser removes every touched pixel.
      const scaleX = stroke.baseWidth / stroke.width;
      const scaleY = stroke.baseHeight / stroke.height;
      const localPoint = { x: (point.x - stroke.x) * scaleX, y: (point.y - stroke.y) * scaleY };
      const radius = (eraserDiameter + stroke.thickness) / (2 * zoom) * Math.max(scaleX, scaleY);
      const fragments = eraseCircleFromStroke(stroke, localPoint, radius);

      if (fragments.length === 1 && fragments[0] === stroke.points) return [stroke];

      return fragments.map((points, index) => ({
        ...stroke,
        id: `${stroke.id}-erased-${Date.now()}-${index}`,
        points,
      }));
    }));
    setSelectedStrokeId(null);
  };

  return (
    <PenContext.Provider
      value={{
        isPenActive,
        setIsPenActive,
        penColor,
        setPenColor,
        penThickness,
        setPenThickness,
        eraserSize,
        setEraserSize,
        isEraserActive,
        setIsEraserActive,
        eraseStrokesAt,
        strokes,
        selectedStrokeId,
        setSelectedStrokeId,
        addStroke,
        addFullStroke,
        updateStroke,
        startUpdateBatch: startBatch,
        endUpdateBatch: endBatch,
        removeStroke,
        clearStrokes,
      }}
    >
      {children}
    </PenContext.Provider>
  );
}

export function usePen() {
  const context = useContext(PenContext);
  if (!context) {
    throw new Error('usePen must be used within a PenProvider');
  }
  return context;
}
