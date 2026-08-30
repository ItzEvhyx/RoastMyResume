'use client';

import Image from 'next/image';

export type TextAlign = 'none' | 'left' | 'right' | 'center' | 'justify';

interface AlignmentToggleProps {
  textAlign: TextAlign;
  onToggle: () => void;
}

export function AlignmentToggle({ textAlign, onToggle }: AlignmentToggleProps) {
  const isHighlighted = textAlign === 'right' || textAlign === 'center' || textAlign === 'justify';

  let iconSrc = '/assets/tools_icons/alignment_icon.png';
  let title = 'Align left';

  if (textAlign === 'right') {
    iconSrc = '/assets/tools_icons/alignment_right_icon.png';
    title = 'Align right';
  } else if (textAlign === 'center') {
    iconSrc = '/assets/tools_icons/alignment_center_icon.png';
    title = 'Align center';
  } else if (textAlign === 'justify') {
    iconSrc = '/assets/tools_icons/alignment_justify_icon.png';
    title = 'Justify';
  } else {
    iconSrc = '/assets/tools_icons/alignment_icon.png';
    title = 'Align left';
  }

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

export const AlignmentButton = AlignmentToggle;

export function getNextTextAlign(current?: TextAlign | null): TextAlign {
  switch (current) {
    case 'right':
      return 'center';
    case 'center':
      return 'justify';
    case 'justify':
      return 'left';
    case 'left':
    case 'none':
    default:
      return 'right';
  }
}
