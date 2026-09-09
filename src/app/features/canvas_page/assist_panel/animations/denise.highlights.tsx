'use client';

import { useEffect, useState } from 'react';
import {
  useDeniseAnalysis,
  type DeniseSeverity,
} from '../../context/DeniseAnalysisContext';
import { useCanvas } from '../../context/CanvasContext';
import { useText } from '../../context/TextContext';

interface HighlightRect {
  key: string;
  left: number;
  top: number;
  width: number;
  height: number;
  severity: DeniseSeverity;
}

const SEVERITY_FILL: Record<DeniseSeverity, string> = {
  weak: 'rgba(239, 68, 68, 0.45)',
  vague: 'rgba(249, 115, 22, 0.45)',
  improve: 'rgba(234, 179, 8, 0.45)',
};

function collectTextNodes(root: Node): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
}

/** Find quote in element text; tolerate truncation / case differences. */
function findQuoteMatch(
  full: string,
  quote: string,
): { start: number; length: number } | null {
  const needle = quote.trim();
  if (!needle || !full) return null;

  let start = full.indexOf(needle);
  if (start >= 0) return { start, length: needle.length };

  const lowerFull = full.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  start = lowerFull.indexOf(lowerNeedle);
  if (start >= 0) return { start, length: needle.length };

  const minLen = Math.min(12, needle.length);
  for (let len = needle.length - 1; len >= minLen; len--) {
    const partial = needle.slice(0, len);
    start = full.indexOf(partial);
    if (start >= 0) return { start, length: len };
    start = lowerFull.indexOf(partial.toLowerCase());
    if (start >= 0) return { start, length: len };
  }

  return null;
}

function measureQuoteRects(el: HTMLElement, quote: string): DOMRect[] | null {
  const full = el.textContent ?? '';
  const match = findQuoteMatch(full, quote);
  if (!match) return null;

  const { start, length } = match;
  const end = start + length;
  const textNodes = collectTextNodes(el);
  let offset = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;

  for (const node of textNodes) {
    const len = node.data.length;
    if (!startNode && offset + len > start) {
      startNode = node;
      startOffset = start - offset;
    }
    if (!endNode && offset + len >= end) {
      endNode = node;
      endOffset = end - offset;
      break;
    }
    offset += len;
  }

  if (!startNode || !endNode) return null;

  try {
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    const rects = Array.from(range.getClientRects()).filter(
      (r) => r.width > 0 && r.height > 0,
    );
    return rects.length ? rects : null;
  } catch {
    return null;
  }
}

function clientRectsToCanvas(
  rects: DOMRect[],
  canvasRect: DOMRect,
  zoom: number,
  severity: DeniseSeverity,
  keyPrefix: string,
): HighlightRect[] {
  const safeZoom = zoom || 1;
  return rects.map((r, i) => ({
    key: `${keyPrefix}-r${i}`,
    left: (r.left - canvasRect.left) / safeZoom,
    top: (r.top - canvasRect.top) / safeZoom,
    width: r.width / safeZoom,
    height: Math.max(r.height / safeZoom, 4),
    severity,
  }));
}

/**
 * Severity highlighter for weak resume phrases (roast + help).
 * Re-measures on every animation frame while active so highlights track drags.
 */
export default function DeniseHighlightsOverlay() {
  const { highlights, applied, showingAfter } = useDeniseAnalysis();
  const { zoom } = useCanvas();
  const { textElements } = useText();
  const [rects, setRects] = useState<HighlightRect[]>([]);

  // Include position so React deps catch moves; rAF covers mid-drag frames
  const layoutSignature = textElements
    .map((t) => `${t.id}:${t.content}:${Math.round(t.x)}:${Math.round(t.y)}:${Math.round(t.width)}`)
    .join('|');

  useEffect(() => {
    const active = applied && showingAfter ? [] : highlights;

    if (!active.length) {
      setRects([]);
      return;
    }

    let rafId = 0;
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const canvas = document.getElementById('resume-canvas');
      if (!canvas) {
        setRects([]);
        rafId = requestAnimationFrame(measure);
        return;
      }
      const canvasRect = canvas.getBoundingClientRect();
      const next: HighlightRect[] = [];

      active.forEach((h, highlightIndex) => {
        const el = document.querySelector(
          `[data-text-id="${CSS.escape(h.elementId)}"]`,
        ) as HTMLElement | null;

        if (!el) return;

        const uniquePrefix = `${h.elementId}-h${highlightIndex}`;
        const quoteRects = measureQuoteRects(el, h.quote);
        if (quoteRects) {
          next.push(
            ...clientRectsToCanvas(
              quoteRects,
              canvasRect,
              zoom,
              h.severity,
              `${uniquePrefix}-q`,
            ),
          );
        } else {
          const box = el.getBoundingClientRect();
          next.push(
            ...clientRectsToCanvas(
              [box],
              canvasRect,
              zoom,
              h.severity,
              `${uniquePrefix}-box`,
            ),
          );
        }
      });

      setRects(next);
      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [highlights, zoom, applied, showingAfter, layoutSignature]);

  if (!rects.length) return null;

  return (
    <div
      data-no-export="true"
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 150000,
        overflow: 'hidden',
      }}
    >
      {rects.map((r) => (
        <div
          key={r.key}
          style={{
            position: 'absolute',
            left: r.left,
            top: r.top,
            width: r.width,
            height: r.height,
            background: SEVERITY_FILL[r.severity],
            borderRadius: 3,
            mixBlendMode: 'multiply',
          }}
        />
      ))}
    </div>
  );
}
