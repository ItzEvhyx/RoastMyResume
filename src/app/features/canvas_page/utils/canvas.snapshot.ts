// src/app/features/canvas_page/utils/canvas.snapshot.ts

/**
 * Canvas Snapshot Utility
 *
 * Collects all visible canvas elements (text, dividers, icons, pen strokes,
 * groups) and serializes them into a compact, spatially-ordered text block
 * that Claude can reason over as resume context.
 *
 * Design decisions:
 *   - Elements are sorted top-to-bottom, left-to-right (reading order) so
 *     Claude sees the resume the way a human would read it.
 *   - The serialized format is deliberately terse to minimize token cost while
 *     keeping enough spatial + style info for Claude to understand layout.
 *   - Locked elements are included (they're still visible content).
 *   - Group member details are inlined under their group header.
 */

import type { TextElement } from '../context/TextContext';
import type { DividerElement } from '../context/DividerContext';
import type { IconElement } from '../context/IconContext';
import type { PenStroke } from '../context/PenContext';
import type { GroupElement } from '../context/GroupContext';
import { htmlToPlain } from './rich.text';

// ─── Snapshot types ───────────────────────────────────────────────────────────

export interface CanvasSnapshot {
  texts: TextElement[];
  dividers: DividerElement[];
  icons: IconElement[];
  strokes: PenStroke[];
  groups: GroupElement[];
  /** Total count of all elements (top-level). */
  elementCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sort any element array by y-position first, then x-position (reading order). */
function sortByPosition<T extends { x: number; y: number }>(elements: T[]): T[] {
  return [...elements].sort((a, b) => {
    // Cluster by row: treat elements within 10px vertically as the same line.
    const rowDiff = Math.round(a.y / 10) - Math.round(b.y / 10);
    if (rowDiff !== 0) return rowDiff;
    return a.x - b.x;
  });
}

/** Human-readable font weight label. */
function weightLabel(weight?: number): string {
  if (!weight || weight <= 400) return '';
  if (weight <= 600) return ' SemiBold';
  if (weight <= 700) return ' Bold';
  return ' ExtraBold';
}

/** Keep enough text for Denise to see full bullet lists (was 300 — far too short). */
function truncate(text: string, maxLength = 5000): string {
  const cleaned = text.replace(/\r\n/g, '\n').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength) + '…';
}

// ─── Serializers for each element type ────────────────────────────────────────

function serializeText(el: TextElement): string {
  const font = `${el.fontSize}px`;
  const family = el.fontFamily?.split(',')[0]?.trim() ?? 'Arial';
  const weight = weightLabel(el.fontWeight);
  const style = el.fontStyle === 'italic' ? ' Italic' : '';
  const decoration = el.textDecoration === 'underline' ? ' Underlined' : '';
  const category = el.textCategory ? ` [${el.textCategory}]` : '';
  const align = el.textAlign && el.textAlign !== 'none' ? ` align:${el.textAlign}` : '';
  const body = truncate(htmlToPlain(el.content)).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  return `[Text${category}] id:${el.id} (x:${Math.round(el.x)}, y:${Math.round(el.y)}, ${font} ${family}${weight}${style}${decoration}${align}) "${body}"`;
}

function serializeDivider(el: DividerElement): string {
  const thick = el.thickness ?? 2;
  return `[Divider] (x:${Math.round(el.x)}, y:${Math.round(el.y)}, width:${Math.round(el.width)}, thickness:${thick}px, color:${el.color ?? '#000'})`;
}

function serializeIcon(el: IconElement): string {
  if (el.isShape) {
    const kind = el.shapeKind ?? 'square';
    const w = Math.round(el.width ?? el.size);
    const h = Math.round(el.height ?? el.size);
    const frame = el.isFrame ? ', hasImage:true' : '';
    return `[Shape:${kind}] (x:${Math.round(el.x)}, y:${Math.round(el.y)}, ${w}×${h}${frame})`;
  }
  return `[Icon] (x:${Math.round(el.x)}, y:${Math.round(el.y)}, size:${el.size}px, color:${el.color ?? '#000'})`;
}

function serializeStroke(el: PenStroke): string {
  const w = Math.round(el.width);
  const h = Math.round(el.height);
  return `[PenStroke] (x:${Math.round(el.x)}, y:${Math.round(el.y)}, ${w}×${h}, thickness:${el.thickness}px, color:${el.color})`;
}

function serializeGroup(group: GroupElement): string {
  const lines: string[] = [];
  const w = Math.round(group.width);
  const h = Math.round(group.height);
  const memberCount =
    group.members.texts.length +
    group.members.dividers.length +
    group.members.icons.length +
    group.members.strokes.length;

  lines.push(
    `[Group] (x:${Math.round(group.x)}, y:${Math.round(group.y)}, ${w}×${h}, members:${memberCount})`
  );

  // Inline member details, indented
  for (const t of sortByPosition(group.members.texts)) {
    lines.push(`  ${serializeText(t)}`);
  }
  for (const d of sortByPosition(group.members.dividers)) {
    lines.push(`  ${serializeDivider(d)}`);
  }
  for (const i of sortByPosition(group.members.icons)) {
    lines.push(`  ${serializeIcon(i)}`);
  }
  for (const s of sortByPosition(group.members.strokes)) {
    lines.push(`  ${serializeStroke(s)}`);
  }

  return lines.join('\n');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build a structured snapshot from all canvas element arrays.
 */
export function buildCanvasSnapshot(
  texts: TextElement[],
  dividers: DividerElement[],
  icons: IconElement[],
  strokes: PenStroke[],
  groups: GroupElement[],
): CanvasSnapshot {
  return {
    texts,
    dividers,
    icons,
    strokes,
    groups,
    elementCount: texts.length + dividers.length + icons.length + strokes.length + groups.length,
  };
}

/**
 * Serialize a canvas snapshot into a compact text block suitable for injection
 * into a Claude system prompt.
 *
 * Returns an empty string when the canvas is completely empty.
 */
export function serializeSnapshotForClaude(snapshot: CanvasSnapshot): string {
  if (snapshot.elementCount === 0) return '';

  const lines: string[] = ['=== RESUME CANVAS CONTENT ==='];
  lines.push(`Total elements: ${snapshot.elementCount}`);
  lines.push('');

  // Merge everything into one positionally-sorted stream for reading order.
  // Each item gets a tag so we know its type when sorting.
  type Tagged = { y: number; x: number; serialized: string };
  const all: Tagged[] = [];

  for (const t of snapshot.texts) {
    all.push({ y: t.y, x: t.x, serialized: serializeText(t) });
  }
  for (const d of snapshot.dividers) {
    all.push({ y: d.y, x: d.x, serialized: serializeDivider(d) });
  }
  for (const i of snapshot.icons) {
    all.push({ y: i.y, x: i.x, serialized: serializeIcon(i) });
  }
  for (const s of snapshot.strokes) {
    all.push({ y: s.y, x: s.x, serialized: serializeStroke(s) });
  }
  for (const g of snapshot.groups) {
    all.push({ y: g.y, x: g.x, serialized: serializeGroup(g) });
  }

  // Sort in reading order (top→bottom, left→right)
  all.sort((a, b) => {
    const rowDiff = Math.round(a.y / 10) - Math.round(b.y / 10);
    if (rowDiff !== 0) return rowDiff;
    return a.x - b.x;
  });

  for (const item of all) {
    lines.push(item.serialized);
  }

  lines.push('');
  lines.push('=== END CANVAS CONTENT ===');
  return lines.join('\n');
}
