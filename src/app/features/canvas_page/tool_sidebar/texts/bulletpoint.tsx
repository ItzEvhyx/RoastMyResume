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
