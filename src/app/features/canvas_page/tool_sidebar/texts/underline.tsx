'use client';

import Image from 'next/image';

interface UnderlineToggleProps {
  isUnderline: boolean;
  onToggle: () => void;
}

export function UnderlineToggle({ isUnderline, onToggle }: UnderlineToggleProps) {
  return (
    <button
      title={isUnderline ? 'Remove underline' : 'Underline'}
      aria-label={isUnderline ? 'Remove underline' : 'Underline'}
      aria-pressed={isUnderline}
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
        isUnderline ? '' : 'hover:bg-white/10 active:bg-white/20'
      }`}
      style={{
        width: 48,
        height: 40,
        flexShrink: 0,
        background: isUnderline ? 'rgba(255,255,255,0.18)' : 'transparent',
        border: isUnderline ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent',
      }}
    >
      <Image
        src="/assets/tools_icons/underline_icon.png"
        alt="Underline"
        width={26}
        height={26}
      />
    </button>
  );
}
