'use client';

import Image from 'next/image';

interface ItalicToggleProps {
  isItalic: boolean;
  onToggle: () => void;
}

export function ItalicToggle({ isItalic, onToggle }: ItalicToggleProps) {
  return (
    <button
      title={isItalic ? 'Remove italic' : 'Italic'}
      aria-label={isItalic ? 'Remove italic' : 'Italic'}
      aria-pressed={isItalic}
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
        isItalic ? '' : 'hover:bg-white/10 active:bg-white/20'
      }`}
      style={{
        width: 48,
        height: 40,
        flexShrink: 0,
        background: isItalic ? 'rgba(255,255,255,0.18)' : 'transparent',
        border: isItalic ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent',
      }}
    >
      <Image
        src="/assets/tools_icons/italize_icon.png"
        alt="Italic"
        width={26}
        height={26}
      />
    </button>
  );
}

export const ItalizeToggle = ItalicToggle;
