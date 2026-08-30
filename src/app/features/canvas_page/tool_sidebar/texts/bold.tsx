'use client';

import Image from 'next/image';

interface BoldToggleProps {
  isBold: boolean;
  onToggle: () => void;
}

export function BoldToggle({ isBold, onToggle }: BoldToggleProps) {
  return (
    <button
      title={isBold ? 'Remove bold' : 'Bold'}
      aria-label={isBold ? 'Remove bold' : 'Bold'}
      aria-pressed={isBold}
      onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="flex items-center justify-center rounded-lg transition-colors"
      style={{
        width: 48,
        height: 40,
        flexShrink: 0,
        background: isBold ? 'rgba(255,255,255,0.18)' : 'transparent',
        border: isBold ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent',
      }}
    >
      <Image
        src="/assets/tools_icons/bold_icon.png"
        alt="Bold"
        width={26}
        height={26}
        style={{ opacity: isBold ? 1 : 0.75 }}
      />
    </button>
  );
}
