'use client';

import { expandToLineBounds } from './bulletpoint';

/** One indent level — matches Docs/Canva-style line indent on plain text. */
export const INDENT_UNIT = '  ';

function outdentLine(line: string): { line: string; removed: number } {
  if (line.startsWith(INDENT_UNIT)) {
    return { line: line.slice(INDENT_UNIT.length), removed: INDENT_UNIT.length };
  }
  if (line.startsWith('\t')) {
    return { line: line.slice(1), removed: 1 };
  }
  const spaces = line.match(/^ +/)?.[0].length ?? 0;
  if (spaces > 0) {
    const removed = Math.min(spaces, INDENT_UNIT.length);
    return { line: line.slice(removed), removed };
  }
  return { line, removed: 0 };
}

function lineStartsInRange(block: string, blockStart: number): number[] {
  const starts: number[] = [blockStart];
  for (let i = 0; i < block.length; i++) {
    if (block[i] === '\n') starts.push(blockStart + i + 1);
  }
  return starts;
}

/**
 * Indent every line covered by a caret/selection (collapsed caret = current line).
 * Leading spaces sit before list markers so existing `(\s*)•` / `(\s*)\d+.` regexes keep working.
 */
export function indentLinesInRange(
  content: string,
  selStart: number,
  selEnd: number,
): { content: string; selectionStart: number; selectionEnd: number } {
  const { start, end } = expandToLineBounds(content, selStart, selEnd);
  const before = content.slice(0, start);
  const selected = content.slice(start, end);
  const after = content.slice(end);

  const lines = selected.split('\n');
  const indented = lines.map((line) => INDENT_UNIT + line).join('\n');
  const unit = INDENT_UNIT.length;
  const starts = lineStartsInRange(selected, start);

  let newStart = selStart;
  let newEnd = selEnd;
  for (const lineStart of starts) {
    // Insertions at/before the caret shift it; insertions at the selection
    // start stay *inside* the selection (Docs/Canva behavior).
    if (lineStart < selStart) newStart += unit;
    if (lineStart < selEnd) newEnd += unit;
  }

  if (selStart === selEnd) {
    newStart = selStart + unit;
    newEnd = newStart;
  }

  return {
    content: before + indented + after,
    selectionStart: newStart,
    selectionEnd: newEnd,
  };
}

/** Outdent one level from every line in the caret/selection range. */
export function outdentLinesInRange(
  content: string,
  selStart: number,
  selEnd: number,
): { content: string; selectionStart: number; selectionEnd: number } {
  const { start, end } = expandToLineBounds(content, selStart, selEnd);
  const before = content.slice(0, start);
  const selected = content.slice(start, end);
  const after = content.slice(end);

  const lines = selected.split('\n');
  const results = lines.map(outdentLine);
  const outdented = results.map((r) => r.line).join('\n');
  const starts = lineStartsInRange(selected, start);

  let newStart = selStart;
  let newEnd = selEnd;
  for (let i = 0; i < results.length; i++) {
    const lineStart = starts[i];
    const { removed } = results[i];
    if (removed <= 0) continue;
    if (lineStart <= selStart) {
      newStart -= Math.min(removed, Math.max(0, selStart - lineStart));
    }
    if (lineStart < selEnd || selStart === selEnd) {
      newEnd -= Math.min(removed, Math.max(0, selEnd - lineStart));
    }
  }

  if (selStart === selEnd) {
    newEnd = newStart;
  }

  return {
    content: before + outdented + after,
    selectionStart: Math.max(0, newStart),
    selectionEnd: Math.max(0, newEnd),
  };
}
