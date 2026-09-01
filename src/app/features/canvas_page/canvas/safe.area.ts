import { createElement, Fragment } from 'react';
import type { DividerElement } from '../context/DividerContext';
import type { TextElement } from '../context/TextContext';

export const CANVAS_WIDTH = 794;
export const CANVAS_HEIGHT = 1123;
export const SAFE_MARGIN = 48;

interface ClampResult<T> {
  updates: Partial<T>;
  wasClamped: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

export function getTextHeight(text: TextElement) {
  const lines = Math.max(1, text.content.split('\n').length);
  return Math.max(text.fontSize + 8, lines * text.fontSize * 1.2);
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
  return createElement(Fragment, null,
    createElement('div', { className: 'pointer-events-none absolute', style: { inset: 0, background: `linear-gradient(to right, rgba(239,68,68,0.14) ${SAFE_MARGIN}px, transparent ${SAFE_MARGIN}px, transparent calc(100% - ${SAFE_MARGIN}px), rgba(239,68,68,0.14) calc(100% - ${SAFE_MARGIN}px))` } }),
    createElement('div', { className: 'pointer-events-none absolute', style: { inset: 0, background: `linear-gradient(to bottom, rgba(239,68,68,0.14) ${SAFE_MARGIN}px, transparent ${SAFE_MARGIN}px, transparent calc(100% - ${SAFE_MARGIN}px), rgba(239,68,68,0.14) calc(100% - ${SAFE_MARGIN}px))` } }),
    createElement('div', { className: 'pointer-events-none absolute', style: { left: clamp(x, SAFE_MARGIN, CANVAS_WIDTH - SAFE_MARGIN - pillWidth), top: Math.min(y + height + 20, CANVAS_HEIGHT - SAFE_MARGIN), width: pillWidth, zIndex: 200, borderRadius: 999, background: 'rgba(127, 29, 29, 0.92)', color: '#fff', padding: '12px 20px', fontSize: 15, fontFamily: "'Poppins', sans-serif", fontWeight: 700, boxShadow: '0 6px 18px rgba(127,29,29,0.28)', textAlign: 'center' } }, 'Too close to the edge — might get clipped when printed.'),
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
