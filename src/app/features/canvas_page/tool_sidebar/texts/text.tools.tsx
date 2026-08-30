'use client';

import Image from 'next/image';

interface TextToolbarProps {
  elementX: number;
  elementY: number;
  elementWidth: number;
}

const TOOLBAR_HEIGHT = 60;
const TOOLBAR_GAP = 16;

export function TextToolbar({ elementX, elementY, elementWidth }: TextToolbarProps) {
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
          background: '#1e1e1e',
          borderRadius: 999,
          boxShadow: '0 6px 28px rgba(0,0,0,0.45)',
        }}
      >
        {/* Header label button */}
        <button
          className="flex items-center justify-center rounded-full px-6 text-white font-semibold text-base transition-colors hover:bg-white/10 active:bg-white/20"
          style={{ height: 38, border: '1.5px solid rgba(255,255,255,0.3)', minWidth: 140 }}
          title="Header"
          aria-label="Toggle header"
        >
          Header
        </button>

        <Divider />

        {/* Color swatch */}
        <button
          className="flex items-center justify-center rounded-full transition-opacity hover:opacity-80 active:opacity-60"
          style={{ width: 30, height: 30, background: '#e53e3e', flexShrink: 0 }}
          title="Text color"
          aria-label="Text color"
        />

        <Divider />

        {/* Bold */}
        <ToolButton title="Bold" aria-label="Bold">
          <Image
            src="/assets/tools_icons/bold_icon.png"
            alt="Bold"
            width={26}
            height={26}
          />
        </ToolButton>

        {/* Italic */}
        <ToolButton title="Italic" aria-label="Italic">
          <Image
            src="/assets/tools_icons/italize_icon.png"
            alt="Italic"
            width={26}
            height={26}
          />
        </ToolButton>

        {/* Underline */}
        <ToolButton title="Underline" aria-label="Underline">
          <Image
            src="/assets/tools_icons/underline_icon.png"
            alt="Underline"
            width={26}
            height={26}
          />
        </ToolButton>

        <Divider />

        {/* Bullet points */}
        <ToolButton title="Bullet list" aria-label="Bullet list">
          <Image
            src="/assets/tools_icons/bulletpoint_icon.png"
            alt="Bullet list"
            width={26}
            height={26}
          />
        </ToolButton>

        {/* Alignment */}
        <ToolButton title="Alignment" aria-label="Alignment">
          <Image
            src="/assets/tools_icons/alignment_icon.png"
            alt="Alignment"
            width={26}
            height={26}
          />
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
