'use client';

import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';

export interface SnapBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

type AxisGuide = { axis: 'x' | 'y'; position: number; start: number; end: number };
type DistanceGuide = { axis: 'x' | 'y'; start: number; end: number; cross: number; value: number };

interface RulerState {
  enabled: boolean;
  toggle: () => void;
  setElements: (elements: SnapBounds[]) => void;
  snap: (moving: SnapBounds) => { x: number; y: number };
  endDrag: () => void;
  guides: AxisGuide[];
  distances: DistanceGuide[];
}

const RulerSnappingContext = createContext<RulerState | undefined>(undefined);
const SNAP_THRESHOLD = 6;
const GUIDE_COLOR = '#111318';

const overlaps = (startA: number, endA: number, startB: number, endB: number) =>
  Math.min(endA, endB) - Math.max(startA, startB) > 0;

const edgeCandidates = (other: SnapBounds, moving: SnapBounds) => ({
  x: [
    { value: other.x, guide: other.x },
    { value: other.x + other.width / 2 - moving.width / 2, guide: other.x + other.width / 2 },
    { value: other.x + other.width - moving.width, guide: other.x + other.width },
  ],
  y: [
    { value: other.y, guide: other.y },
    { value: other.y + other.height / 2 - moving.height / 2, guide: other.y + other.height / 2 },
    { value: other.y + other.height - moving.height, guide: other.y + other.height },
  ],
});

function nearest<T extends { value: number }>(value: number, candidates: T[]) {
  return candidates.reduce<T | null>((best, candidate) => {
    if (!best || Math.abs(candidate.value - value) < Math.abs(best.value - value)) return candidate;
    return best;
  }, null);
}

/**
 * Canva-style smart guides. They only nudge within a small threshold; moving
 * farther away immediately keeps the user's exact requested position.
 */
export function RulerSnappingProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const [guides, setGuides] = useState<AxisGuide[]>([]);
  const [distances, setDistances] = useState<DistanceGuide[]>([]);
  const elementsRef = useRef<SnapBounds[]>([]);
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<{ guides: AxisGuide[]; distances: DistanceGuide[] } | null>(null);

  const setElements = useCallback((elements: SnapBounds[]) => {
    elementsRef.current = elements;
  }, []);

  const publish = useCallback((nextGuides: AxisGuide[], nextDistances: DistanceGuide[]) => {
    pendingRef.current = { guides: nextGuides, distances: nextDistances };
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) {
        setGuides(pending.guides);
        setDistances(pending.distances);
      }
    });
  }, []);

  const snap = useCallback((moving: SnapBounds) => {
    if (!enabled) return { x: moving.x, y: moving.y };

    const others = elementsRef.current.filter(element => element.id !== moving.id);
    const xCandidates: { value: number; guide: number; other: SnapBounds }[] = [];
    const yCandidates: { value: number; guide: number; other: SnapBounds }[] = [];

    for (const other of others) {
      const edges = edgeCandidates(other, moving);
      xCandidates.push(...edges.x.map(candidate => ({ ...candidate, other })));
      yCandidates.push(...edges.y.map(candidate => ({ ...candidate, other })));
    }

    // Infer a repeated gap from any pair of existing objects and offer that
    // same distance on either side of the pair. This is what makes a third
    // square softly lock into a two-pixel rhythm beside two existing squares.
    for (const anchor of others) {
      for (const reference of others) {
        if (anchor.id === reference.id) continue;
        if (overlaps(anchor.y, anchor.y + anchor.height, reference.y, reference.y + reference.height)) {
          if (anchor.x >= reference.x + reference.width) {
            const gap = anchor.x - (reference.x + reference.width);
            xCandidates.push({ value: anchor.x + anchor.width + gap, guide: anchor.x + anchor.width + gap, other: anchor });
            xCandidates.push({ value: reference.x - moving.width - gap, guide: reference.x - gap, other: reference });
          }
        }
        if (overlaps(anchor.x, anchor.x + anchor.width, reference.x, reference.x + reference.width)) {
          if (anchor.y >= reference.y + reference.height) {
            const gap = anchor.y - (reference.y + reference.height);
            yCandidates.push({ value: anchor.y + anchor.height + gap, guide: anchor.y + anchor.height + gap, other: anchor });
            yCandidates.push({ value: reference.y - moving.height - gap, guide: reference.y - gap, other: reference });
          }
        }
      }
    }

    const nearestX = nearest(moving.x, xCandidates);
    const nearestY = nearest(moving.y, yCandidates);
    const snappedX = nearestX && Math.abs(nearestX.value - moving.x) <= SNAP_THRESHOLD ? nearestX.value : moving.x;
    const snappedY = nearestY && Math.abs(nearestY.value - moving.y) <= SNAP_THRESHOLD ? nearestY.value : moving.y;
    const snapped = { ...moving, x: snappedX, y: snappedY };
    const nextGuides: AxisGuide[] = [];

    if (nearestX && snappedX === nearestX.value) {
      nextGuides.push({
        axis: 'x',
        position: nearestX.guide,
        start: Math.min(snapped.y, nearestX.other.y),
        end: Math.max(snapped.y + snapped.height, nearestX.other.y + nearestX.other.height),
      });
    }
    if (nearestY && snappedY === nearestY.value) {
      nextGuides.push({
        axis: 'y',
        position: nearestY.guide,
        start: Math.min(snapped.x, nearestY.other.x),
        end: Math.max(snapped.x + snapped.width, nearestY.other.x + nearestY.other.width),
      });
    }

    const nextDistances: DistanceGuide[] = [];
    for (const other of others) {
      if (overlaps(snapped.y, snapped.y + snapped.height, other.y, other.y + other.height)) {
        const start = snapped.x >= other.x + other.width ? other.x + other.width : snapped.x + snapped.width <= other.x ? snapped.x + snapped.width : 0;
        const end = snapped.x >= other.x + other.width ? snapped.x : snapped.x + snapped.width <= other.x ? other.x : 0;
        if (end > start) nextDistances.push({ axis: 'x', start, end, cross: Math.max(snapped.y, other.y) + 12, value: Math.round(end - start) });
      }
      if (overlaps(snapped.x, snapped.x + snapped.width, other.x, other.x + other.width)) {
        const start = snapped.y >= other.y + other.height ? other.y + other.height : snapped.y + snapped.height <= other.y ? snapped.y + snapped.height : 0;
        const end = snapped.y >= other.y + other.height ? snapped.y : snapped.y + snapped.height <= other.y ? other.y : 0;
        if (end > start) nextDistances.push({ axis: 'y', start, end, cross: Math.max(snapped.x, other.x) + 12, value: Math.round(end - start) });
      }
    }

    publish(nextGuides, nextDistances.sort((a, b) => a.value - b.value).slice(0, 4));
    return { x: snappedX, y: snappedY };
  }, [enabled, publish]);

  const endDrag = useCallback(() => {
    pendingRef.current = null;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    setGuides([]);
    setDistances([]);
  }, []);

  const value = useMemo(() => ({
    enabled,
    toggle: () => setEnabled(current => !current),
    setElements,
    snap,
    endDrag,
    guides,
    distances,
  }), [enabled, setElements, snap, endDrag, guides, distances]);

  return <RulerSnappingContext.Provider value={value}>{children}</RulerSnappingContext.Provider>;
}

export function useRulerSnapping() {
  const context = useContext(RulerSnappingContext);
  if (!context) throw new Error('useRulerSnapping must be used inside RulerSnappingProvider');
  return context;
}

/** Canvas-space overlay; it inherits the canvas transform and never captures input. */
export function RulerGuides() {
  const { enabled, guides, distances } = useRulerSnapping();
  if (!enabled || (guides.length === 0 && distances.length === 0)) return null;

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 70 }} aria-hidden>
      {guides.map((guide, index) => guide.axis === 'x' ? (
        <div key={`x-${index}`} style={{ position: 'absolute', left: guide.position, top: guide.start, width: 1, height: Math.max(1, guide.end - guide.start), background: GUIDE_COLOR, boxShadow: '0 0 0 1px rgba(255,255,255,0.75)' }} />
      ) : (
        <div key={`y-${index}`} style={{ position: 'absolute', left: guide.start, top: guide.position, width: Math.max(1, guide.end - guide.start), height: 1, background: GUIDE_COLOR, boxShadow: '0 0 0 1px rgba(255,255,255,0.75)' }} />
      ))}
      {distances.map((distance, index) => distance.axis === 'x' ? (
        <div key={`dx-${index}`} style={{ position: 'absolute', left: distance.start, top: distance.cross, width: distance.end - distance.start, borderTop: `1px dashed ${GUIDE_COLOR}` }}>
          <span style={{ position: 'absolute', left: '50%', top: -20, transform: 'translateX(-50%)', borderRadius: 6, padding: '2px 5px', background: GUIDE_COLOR, color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-poppins, Arial), sans-serif', whiteSpace: 'nowrap' }}>{distance.value}px</span>
        </div>
      ) : (
        <div key={`dy-${index}`} style={{ position: 'absolute', left: distance.cross, top: distance.start, height: distance.end - distance.start, borderLeft: `1px dashed ${GUIDE_COLOR}` }}>
          <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', borderRadius: 6, padding: '2px 5px', background: GUIDE_COLOR, color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-poppins, Arial), sans-serif', whiteSpace: 'nowrap' }}>{distance.value}px</span>
        </div>
      ))}
    </div>
  );
}
