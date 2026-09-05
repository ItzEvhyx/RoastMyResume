'use client';

import { ColorPicker } from '../../globals/color.picker';
import { FlipButton, FlipState } from '../../globals/flip.element';
import { useMediaQuery } from '@/lib/use_media_query';

interface IconToolbarProps {
  elementX: number;
  elementY: number;
  elementSize: number;
  elementWidth?: number;
  color: string;
  onColorChange: (color: string) => void;
  flip: FlipState;
  onFlip: () => void;
  /** When true the color picker is hidden — raster images can't be tinted. */
  isRaster?: boolean;
}

const TOOLBAR_HEIGHT = 60;
const TOOLBAR_GAP = 16;

export function IconToolbar({
  elementX,
  elementY,
  elementSize,
  elementWidth,
  color,
  onColorChange,
  flip,
  onFlip,
  isRaster = false,
}: IconToolbarProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const centerX = elementX + (elementWidth ?? elementSize) / 2;
  const topY = elementY - TOOLBAR_HEIGHT - TOOLBAR_GAP;

  const stopAll = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if ('preventDefault' in e) (e as React.MouseEvent).preventDefault();
  };

  return (
    <div
      className="absolute pointer-events-auto select-none"
      onMouseDown={stopAll}
      onPointerDown={stopAll}
      onClick={stopAll}
      onDoubleClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
      onTouchStart={stopAll}
      style={{
        left: `${centerX}px`,
        top: `${topY}px`,
        transform: 'translateX(-50%)',
        zIndex: 50,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {/* Pill container */}
      <div
        className="flex items-center gap-3 px-6 select-none"
        onMouseDown={stopAll}
        onPointerDown={stopAll}
        onClick={stopAll}
        onDoubleClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onTouchStart={stopAll}
        style={{
          height: TOOLBAR_HEIGHT,
          minWidth: 120,
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
        {/* Color picker — hidden for raster images */}
        {!isRaster && (
          <>
            <ColorPicker color={color} onSelect={onColorChange} />
            <ToolbarDivider />
          </>
        )}

        {/* Flip */}
        <FlipButton flip={flip} onFlip={onFlip} />
      </div>
    </div>
  );
}

function ToolbarDivider() {
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
