'use client';

import Image from 'next/image';
import { FontSizePicker } from './font.size';
import { ColorPicker } from '../../globals/color.picker';
import { BoldToggle } from './bold';
import { ItalicToggle } from './italize';
import { UnderlineToggle } from './underline';
import { BulletListToggle, ListType } from './bulletpoint';
import { AlignmentToggle, TextAlign } from './alignment';
import { LockButton } from '../../globals/lock.elements';
import { useMediaQuery } from '@/lib/use_media_query';

interface TextToolbarProps {
  elementX: number;
  elementY: number;
  elementWidth: number;
  onFontSizeChange: (fontSize: number) => void;
  onColorChange: (color: string) => void;
  color: string;
  isBold: boolean;
  onBoldToggle: () => void;
  isItalic: boolean;
  onItalicToggle: () => void;
  isUnderline: boolean;
  onUnderlineToggle: () => void;
  listType: ListType;
  onListToggle: () => void;
  textAlign: TextAlign;
  onAlignToggle: () => void;
  isLocked?: boolean;
  onLockToggle: () => void;
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
  isItalic,
  onItalicToggle,
  isUnderline,
  onUnderlineToggle,
  listType,
  onListToggle,
  textAlign,
  onAlignToggle,
  isLocked = false,
  onLockToggle,
}: TextToolbarProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const centerX = elementX + elementWidth / 2;
  const topY = elementY - TOOLBAR_HEIGHT - TOOLBAR_GAP;

  return (
    <div
      data-no-export="true"
      className="absolute pointer-events-auto select-none"
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      style={{
        left: `${centerX}px`,
        top: `${topY}px`,
        transform: 'translateX(-50%)',
        zIndex: 200020,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {/* Pill container */}
      <div
        className="flex items-center gap-3 px-6 select-none"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        style={{
          height: TOOLBAR_HEIGHT,
          background: 'rgba(30, 32, 38, 0.92)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
          borderRadius: 999,
          transform: isMobile ? 'scale(1.35)' : undefined,
          transformOrigin: 'center bottom',
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
        <ItalicToggle isItalic={isItalic} onToggle={onItalicToggle} />

        {/* Underline */}
        <UnderlineToggle isUnderline={isUnderline} onToggle={onUnderlineToggle} />

        <Divider />

        {/* Bullet / Number list */}
        <BulletListToggle listType={listType} onToggle={onListToggle} />

        {/* Alignment */}
        <AlignmentToggle textAlign={textAlign} onToggle={onAlignToggle} />

        <Divider />

        {/* Lock */}
        <LockButton isLocked={isLocked} onToggle={onLockToggle} />
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
