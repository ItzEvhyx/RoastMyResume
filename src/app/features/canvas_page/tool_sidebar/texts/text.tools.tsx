'use client';

import Image from 'next/image';
import { FontSizePicker } from './font.size';
import { ColorPicker } from './color.picker';
import { BoldToggle } from './bold';

interface TextToolbarProps {
  elementX: number;
  elementY: number;
  elementWidth: number;
  onFontSizeChange: (fontSize: number) => void;
  onColorChange: (color: string) => void;
  color: string;
  isBold: boolean;
  onBoldToggle: () => void;
}

const TOOLBAR_HEIGHT = 60;
const TOOLBAR_GAP = 16;

export function TextToolbar({
  elementX,
  elementY,
  elementWidth,
  onFontSizeChange,
  onColorChange,
  color,
  isBold,
  onBoldToggle,
}: TextToolbarProps) {
  const centerX = elementX + elementWidth / 2;
  const topY = elementY - TOOLBAR_HEIGHT - TOOLBAR_GAP;

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: `${centerX}px`,
        top: `${topY}px`,
        transform: 'translateX(-50%)',
        zIndex: 50,
        whiteSpace: 'nowrap',
      }}
    >
      {/* Pill container */}
      <div
        className="flex items-center gap-3 px-6"
        style={{
          height: TOOLBAR_HEIGHT,
          background: 'rgba(30, 32, 38, 0.85)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 28px rgba(0,0,0,0.5)',
          borderRadius: 999,
        }}
      >
        {/* Font size / category picker */}
        <FontSizePicker onSelect={onFontSizeChange} />

        <Divider />

        {/* Color picker */}
        <ColorPicker color={color} onSelect={onColorChange} />

        <Divider />

        {/* Bold */}
        <BoldToggle isBold={isBold} onToggle={onBoldToggle} />

        {/* Italic */}
        <ToolButton title="Italic" aria-label="Italic">
          <Image src="/assets/tools_icons/italize_icon.png" alt="Italic" width={26} height={26} />
        </ToolButton>

        {/* Underline */}
        <ToolButton title="Underline" aria-label="Underline">
          <Image src="/assets/tools_icons/underline_icon.png" alt="Underline" width={26} height={26} />
        </ToolButton>

        <Divider />

        {/* Bullet points */}
        <ToolButton title="Bullet list" aria-label="Bullet list">
          <Image src="/assets/tools_icons/bulletpoint_icon.png" alt="Bullet list" width={26} height={26} />
        </ToolButton>

        {/* Alignment */}
        <ToolButton title="Alignment" aria-label="Alignment">
          <Image src="/assets/tools_icons/alignment_icon.png" alt="Alignment" width={26} height={26} />
        </ToolButton>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 26,
        background: 'rgba(255,255,255,0.2)',
        marginInline: 4,
        flexShrink: 0,
      }}
    />
  );
}

function ToolButton({
  children,
  title,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode;
  title: string;
  'aria-label': string;
}) {
  return (
    <button
      className="flex items-center justify-center rounded-lg transition-colors hover:bg-white/10 active:bg-white/20"
      style={{ width: 48, height: 40, flexShrink: 0 }}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
