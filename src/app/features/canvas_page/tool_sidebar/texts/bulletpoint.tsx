'use client';

import Image from 'next/image';

export type ListType = 'none' | 'bullet' | 'number';

interface BulletListToggleProps {
  listType: ListType;
  onToggle: () => void;
}

export function BulletListToggle({ listType, onToggle }: BulletListToggleProps) {
  const isHighlighted = listType === 'bullet' || listType === 'number';
  const iconSrc =
    listType === 'number'
      ? '/assets/tools_icons/number_list_icon.png'
      : '/assets/tools_icons/bulletpoint_icon.png';

  const title =
    listType === 'none'
      ? 'Bullet list'
      : listType === 'bullet'
      ? 'Numbered list'
      : 'Remove list';

  return (
    <button
      title={title}
      aria-label={title}
      aria-pressed={isHighlighted}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`flex items-center justify-center rounded-lg transition-colors ${
        isHighlighted ? '' : 'hover:bg-white/10 active:bg-white/20'
      }`}
      style={{
        width: 48,
        height: 40,
        flexShrink: 0,
        background: isHighlighted ? 'rgba(255,255,255,0.18)' : 'transparent',
        border: isHighlighted ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent',
      }}
    >
      <Image
        src={iconSrc}
        alt={title}
        width={26}
        height={26}
      />
    </button>
  );
}

export const BulletpointToggle = BulletListToggle;

/**
 * Helper to convert multiline content between list types (none -> bullet -> number -> none)
 */
export function convertListContent(content: string, targetType: ListType): string {
  if (!content) {
    if (targetType === 'bullet') return '• ';
    if (targetType === 'number') return '1. ';
    return '';
  }

  const lines = content.split('\n');

  if (targetType === 'none') {
    return lines
      .map((line) => line.replace(/^(\s*)([•\-\*]|\d+[\.\)])\s*/, '$1'))
      .join('\n');
  }

  if (targetType === 'bullet') {
    return lines
      .map((line) => {
        const cleaned = line.replace(/^(\s*)([•\-\*]|\d+[\.\)])\s*/, '$1');
        return cleaned.trim().length > 0 || lines.length === 1 ? `• ${cleaned.trimStart()}` : cleaned;
      })
      .join('\n');
  }

  if (targetType === 'number') {
    let index = 1;
    return lines
      .map((line) => {
        const cleaned = line.replace(/^(\s*)([•\-\*]|\d+[\.\)])\s*/, '$1');
        if (cleaned.trim().length > 0 || lines.length === 1) {
          const res = `${index}. ${cleaned.trimStart()}`;
          index++;
          return res;
        }
        return cleaned;
      })
      .join('\n');
  }

  return content;
}

/** Detect list style of a plain-text block (all non-empty lines must match). */
export function detectListType(content: string): ListType {
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  if (!lines.length) return 'none';
  if (lines.every((l) => /^\s*•\s/.test(l))) return 'bullet';
  if (lines.every((l) => /^\s*\d+[\.\)]\s/.test(l))) return 'number';
  return 'none';
}

export function nextListType(current: ListType): ListType {
  if (current === 'bullet') return 'number';
  if (current === 'number') return 'none';
  return 'bullet';
}

/** Expand a caret/selection to whole-line bounds (plain text with `\n`). */
export function expandToLineBounds(
  content: string,
  selStart: number,
  selEnd: number,
): { start: number; end: number } {
  const start = content.lastIndexOf('\n', Math.max(0, selStart - 1)) + 1;
  let end = content.indexOf('\n', selEnd);
  if (end === -1) end = content.length;
  // If the selection ends exactly on a newline, keep that line out of the range
  if (selEnd > selStart && content[selEnd - 1] === '\n') {
    end = selEnd - 1;
    const lineStart = content.lastIndexOf('\n', Math.max(0, end - 1)) + 1;
    return { start, end: Math.max(end, lineStart) };
  }
  return { start, end };
}

/**
 * Convert only the lines covered by a plain-text selection (GDocs-style).
 * Collapsed caret still converts the current line.
 */
export function convertListContentInRange(
  content: string,
  selStart: number,
  selEnd: number,
  targetType: ListType,
): { content: string; selectionStart: number; selectionEnd: number } {
  const { start, end } = expandToLineBounds(content, selStart, selEnd);
  const before = content.slice(0, start);
  const selected = content.slice(start, end);
  const after = content.slice(end);
  const converted = convertListContent(selected, targetType);
  return {
    content: before + converted + after,
    selectionStart: start,
    selectionEnd: start + converted.length,
  };
}
