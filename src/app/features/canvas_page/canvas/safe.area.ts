import { createElement, Fragment } from 'react';
import type { DividerElement } from '../context/DividerContext';
import type { TextElement } from '../context/TextContext';
import type { PenStroke } from '../context/PenContext';
import type { IconElement } from '../context/IconContext';
import { contentToHtml, htmlToPlain } from '../utils/rich.text';

export const CANVAS_WIDTH = 794;
export const CANVAS_HEIGHT = 1123;
export const SAFE_MARGIN = 48;

interface ClampResult<T> {
  updates: Partial<T>;
  wasClamped: boolean;
}

export interface GroupSafeAreaBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/** Average glyph width factor for proportional resume fonts (Poppins / Arial). */
const CHAR_WIDTH_FACTOR = 0.52;

type TextMetrics = Pick<
  TextElement,
  'content' | 'fontSize' | 'width' | 'fontFamily' | 'fontWeight'
>;

/**
 * Estimate wrapped line count for a plain-text paragraph inside `width`.
 * Uses Canvas measureText when available; falls back to a char-width heuristic.
 */
function countWrappedLines(
  paragraph: string,
  width: number,
  fontSize: number,
  fontFamily?: string,
  fontWeight?: number,
): number {
  if (!paragraph) return 1;

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const weight = fontWeight && fontWeight >= 700 ? '700' : '400';
      ctx.font = `${weight} ${fontSize}px ${fontFamily || 'Arial, sans-serif'}`;
      const words = paragraph.split(/(\s+)/);
      let line = '';
      let lines = 1;
      for (const word of words) {
        if (!word) continue;
        const test = line + word;
        if (ctx.measureText(test).width > width && line.trim().length > 0) {
          lines += 1;
          if (ctx.measureText(word).width > width) {
            const charsPerLine = Math.max(1, Math.floor(width / Math.max(1, ctx.measureText('M').width)));
            lines += Math.ceil(word.length / charsPerLine) - 1;
            line = '';
          } else {
            line = word;
          }
        } else {
          line = test;
        }
      }
      return Math.max(1, lines);
    }
  }

  const charsPerLine = Math.max(1, Math.floor(width / Math.max(1, fontSize * CHAR_WIDTH_FACTOR)));
  return Math.max(1, Math.ceil(Math.max(1, paragraph.length) / charsPerLine));
}

/** Fast metric fallback when DOM measurement is unavailable. */
function estimateTextHeightMetrics(text: TextMetrics): number {
  const plain = htmlToPlain(text.content || '');
  const paragraphs = plain.length ? plain.split('\n') : [''];
  let lines = 0;
  for (const paragraph of paragraphs) {
    lines += countWrappedLines(
      paragraph,
      Math.max(1, text.width),
      text.fontSize,
      text.fontFamily,
      text.fontWeight,
    );
  }
  return Math.max(text.fontSize + 8, lines * text.fontSize * 1.2);
}

/**
 * Offscreen DOM probe — matches canvas text styling so wrap height matches
 * what the user actually sees (Canva-style auto-height).
 */
export function measureTextHeightDom(text: TextMetrics): number {
  if (typeof document === 'undefined') return estimateTextHeightMetrics(text);

  const probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = [
    'position:absolute',
    'left:-99999px',
    'top:0',
    'visibility:hidden',
    'pointer-events:none',
    `width:${Math.max(1, text.width)}px`,
    `font-size:${text.fontSize}px`,
    `font-family:${text.fontFamily || 'Arial, sans-serif'}`,
    `font-weight:${text.fontWeight ?? 400}`,
    'line-height:1.2',
    'white-space:pre-wrap',
    'overflow-wrap:break-word',
    'word-break:break-word',
  ].join(';');
  probe.innerHTML = contentToHtml(text.content || '');
  document.body.appendChild(probe);
  const h = Math.max(probe.scrollHeight, probe.offsetHeight);
  document.body.removeChild(probe);
  return Math.max(text.fontSize + 8, h);
}

/** Pure estimate — prefers offscreen DOM, falls back to metrics. */
export function estimateTextHeight(text: TextMetrics): number {
  return measureTextHeightDom(text);
}

/**
 * Visual height of a text box on the canvas.
 * Prefer the live DOM node (scrollHeight), otherwise offscreen / metrics.
 */
export function getTextHeight(text: TextElement): number {
  if (typeof document !== 'undefined' && text.id) {
    try {
      const el = document.querySelector(
        `[data-text-id="${CSS.escape(text.id)}"]`,
      ) as HTMLElement | null;
      if (el) {
        const h = Math.max(el.scrollHeight, el.offsetHeight);
        if (h > 0) return h;
      }
    } catch {
      // CSS.escape / querySelector can throw on exotic ids — fall through
    }
  }
  return estimateTextHeight(text);
}

export function clampTextToSafeArea(element: TextElement, updates: Partial<TextElement>): ClampResult<TextElement> {
  const next = { ...element, ...updates };
  const width = Math.min(next.width, CANVAS_WIDTH - SAFE_MARGIN * 2);
  const x = clamp(next.x, SAFE_MARGIN, CANVAS_WIDTH - SAFE_MARGIN - width);
  const y = clamp(next.y, SAFE_MARGIN, CANVAS_HEIGHT - SAFE_MARGIN - getTextHeight({ ...next, width }));

  return {
    updates: { ...updates, x, y, width },
    wasClamped: x !== next.x || y !== next.y || width !== next.width,
  };
}

export function SafeAreaWarning({ x, y, height }: { x: number; y: number; height: number }) {
  const pillWidth = 340;
  // Above Denise highlights (150000) and selection chrome (200001); below scan (300000)
  const SAFE_WARNING_Z = 250000;
  return createElement(Fragment, null,
    createElement('div', { className: 'pointer-events-none absolute', style: { inset: 0, zIndex: SAFE_WARNING_Z, background: `linear-gradient(to right, rgba(239,68,68,0.14) ${SAFE_MARGIN}px, transparent ${SAFE_MARGIN}px, transparent calc(100% - ${SAFE_MARGIN}px), rgba(239,68,68,0.14) calc(100% - ${SAFE_MARGIN}px))` } }),
    createElement('div', { className: 'pointer-events-none absolute', style: { inset: 0, zIndex: SAFE_WARNING_Z, background: `linear-gradient(to bottom, rgba(239,68,68,0.14) ${SAFE_MARGIN}px, transparent ${SAFE_MARGIN}px, transparent calc(100% - ${SAFE_MARGIN}px), rgba(239,68,68,0.14) calc(100% - ${SAFE_MARGIN}px))` } }),
    createElement('div', { className: 'pointer-events-none absolute', style: { left: clamp(x, SAFE_MARGIN, CANVAS_WIDTH - SAFE_MARGIN - pillWidth), top: Math.min(y + height + 20, CANVAS_HEIGHT - SAFE_MARGIN), width: pillWidth, zIndex: SAFE_WARNING_Z, borderRadius: 999, background: 'rgba(127, 29, 29, 0.92)', color: '#fff', padding: '12px 20px', fontSize: 15, fontFamily: "'Poppins', sans-serif", fontWeight: 700, boxShadow: '0 6px 18px rgba(127,29,29,0.28)', textAlign: 'center' } }, 'Too close to the edge — might get clipped when printed.'),
  );
}

export function clampDividerToSafeArea(element: DividerElement, updates: Partial<DividerElement>): ClampResult<DividerElement> {
  const next = { ...element, ...updates };
  const width = Math.min(next.width, CANVAS_WIDTH - SAFE_MARGIN * 2);
  const x = clamp(next.x, SAFE_MARGIN, CANVAS_WIDTH - SAFE_MARGIN - width);
  const y = clamp(next.y, SAFE_MARGIN, CANVAS_HEIGHT - SAFE_MARGIN - (next.thickness ?? 2));

  return {
    updates: { ...updates, x, y, width },
    wasClamped: x !== next.x || y !== next.y || width !== next.width,
  };
}

/** Clamp a group wrapper so every member stays within the printable safe area. */
export function clampGroupToSafeArea(
  group: GroupSafeAreaBounds,
  updates: Partial<GroupSafeAreaBounds>,
): ClampResult<GroupSafeAreaBounds> {
  const next = { ...group, ...updates };
  const width = Math.min(next.width, CANVAS_WIDTH - SAFE_MARGIN * 2);
  const height = Math.min(next.height, CANVAS_HEIGHT - SAFE_MARGIN * 2);
  const x = clamp(next.x, SAFE_MARGIN, CANVAS_WIDTH - SAFE_MARGIN - width);
  const y = clamp(next.y, SAFE_MARGIN, CANVAS_HEIGHT - SAFE_MARGIN - height);

  return {
    updates: { ...updates, x, y, width, height },
    wasClamped:
      x !== next.x ||
      y !== next.y ||
      width !== next.width ||
      height !== next.height,
  };
}

export function clampIconToSafeArea(element: IconElement, updates: Partial<IconElement>): ClampResult<IconElement> {
  const next = { ...element, ...updates };
  const w = next.width ?? next.size;
  const h = next.height ?? next.size;

  // Full-bleed template columns may sit on the page edge; still stay on-canvas.
  if (next.bypassSafeArea) {
    const x = clamp(next.x, 0, CANVAS_WIDTH - w);
    const y = clamp(next.y, 0, CANVAS_HEIGHT - h);
    return {
      updates: { ...updates, x, y },
      wasClamped: x !== next.x || y !== next.y,
    };
  }

  const x = clamp(next.x, SAFE_MARGIN, CANVAS_WIDTH - SAFE_MARGIN - w);
  const y = clamp(next.y, SAFE_MARGIN, CANVAS_HEIGHT - SAFE_MARGIN - h);
  return {
    updates: { ...updates, x, y },
    wasClamped: x !== next.x || y !== next.y,
  };
}

export function clampPenStrokeToSafeArea(element: PenStroke, updates: Partial<PenStroke>): ClampResult<PenStroke> {
  const next = { ...element, ...updates };
  const maxWidth = CANVAS_WIDTH - SAFE_MARGIN * 2;
  const maxHeight = CANVAS_HEIGHT - SAFE_MARGIN * 2;
  const scale = Math.min(1, maxWidth / next.width, maxHeight / next.height);
  const width = next.width * scale;
  const height = next.height * scale;
  const x = clamp(next.x, SAFE_MARGIN, CANVAS_WIDTH - SAFE_MARGIN - width);
  const y = clamp(next.y, SAFE_MARGIN, CANVAS_HEIGHT - SAFE_MARGIN - height);
  return {
    updates: { ...updates, x, y, width, height },
    wasClamped: x !== next.x || y !== next.y || width !== next.width || height !== next.height,
  };
}
