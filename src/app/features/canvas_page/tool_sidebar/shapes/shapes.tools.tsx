'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import { useText } from '../../context/TextContext';
import { useIcon } from '../../context/IconContext';
import { ColorPicker } from '../../globals/color.picker';
import { useMediaQuery } from '@/lib/use_media_query';
import { ShapeBorderPicker } from './shapes.border';
import { ShapeCornerRoundingPicker } from './shapes.corner.rounding';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

const FUTURA_STYLE = `
  @font-face {
    font-family: 'FuturaDisplay';
    src: url('/assets/fonts/futura_display/Futura Display.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
`;

const glassStyle: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.55)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
};

type ShapeKind = 'square' | 'circle';

interface ShapeToolbarProps {
  elementX: number;
  elementY: number;
  elementWidth: number;
  color: string;
  onColorChange: (color: string) => void;
  borderWidth: number;
  onBorderWidthChange: (borderWidth: number) => void;
  borderColor: string;
  onBorderColorChange: (color: string) => void;
  cornerRadius: number;
  onCornerRadiusChange: (cornerRadius: number) => void;
}

const FLOATING_TOOLBAR_HEIGHT = 60;
const FLOATING_TOOLBAR_GAP = 16;

/** Controls displayed above a selected shape. */
export function ShapeToolbar({
  elementX,
  elementY,
  elementWidth,
  color,
  onColorChange,
  borderWidth,
  onBorderWidthChange,
  borderColor,
  onBorderColorChange,
  cornerRadius,
  onCornerRadiusChange,
}: ShapeToolbarProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const centerX = elementX + elementWidth / 2;
  const topY = elementY - FLOATING_TOOLBAR_HEIGHT - FLOATING_TOOLBAR_GAP;
  const stopAll = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    if ('preventDefault' in event) event.preventDefault();
  };

  return (
    <div
      className="absolute pointer-events-auto select-none"
      style={{
        left: centerX,
        top: topY,
        transform: 'translateX(-50%)',
        zIndex: 50,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
      onMouseDown={stopAll}
      onPointerDown={stopAll}
      onClick={stopAll}
      onDoubleClick={stopAll}
      onTouchStart={stopAll}
    >
      <div
        className="flex items-center gap-3 px-6"
        style={{
          height: FLOATING_TOOLBAR_HEIGHT,
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
        <ColorPicker color={color} onSelect={onColorChange} />
        <ShapeToolbarDivider />
        <ShapeBorderPicker borderWidth={borderWidth} onSelect={onBorderWidthChange} />
        {borderWidth > 0 && (
          <ColorPicker
            color={borderColor}
            onSelect={onBorderColorChange}
            triggerIconSrc="/assets/tools_icons/shape_borders.png"
            triggerLabel="Border color"
          />
        )}
        <ShapeCornerRoundingPicker
          radius={cornerRadius}
          onChange={onCornerRadiusChange}
        />
      </div>
    </div>
  );
}

function ShapeToolbarDivider() {
  return <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.2)', marginInline: 4, flexShrink: 0 }} />;
}

const SHAPES: { id: ShapeKind; label: string; svgUrl: string }[] = [
  { id: 'square', label: 'Square', svgUrl: '/assets/tools_icons/square_shape.svg' },
  { id: 'circle', label: 'Circle', svgUrl: '/assets/tools_icons/circle_shape.svg' },
];

function ShapePreview({ shape }: { shape: ShapeKind }) {
  if (shape === 'circle') {
    return <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: '50%', background: '#fff' }} />;
  }

  return <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 4, background: '#fff' }} />;
}

function ShapeTile({
  shape,
  isSelected,
  onSelect,
}: {
  shape: { id: ShapeKind; label: string; svgUrl: string };
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      title={shape.label}
      onClick={onSelect}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl transition-all duration-150 hover:bg-white/15 active:scale-95"
      style={{
        minHeight: 124,
        background: isSelected ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.04)',
        border: isSelected ? '1px solid rgba(255,255,255,0.24)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <ShapePreview shape={shape.id} />
      <span
        className="text-sm text-white/75"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
      >
        {shape.label}
      </span>
    </button>
  );
}

/** The desktop shape picker opened from the Shapes item in the left toolbar. */
export default function ShapesTools() {
  const { toolbarExpanded, activeTool } = useText();
  const { addFullIconElement } = useIcon();
  const [selectedShape, setSelectedShape] = useState<ShapeKind | null>(null);
  const shouldShow = toolbarExpanded && activeTool === 'shapes';

  const selectShape = (shape: { id: ShapeKind; svgUrl: string }) => {
    const size = 110;
    setSelectedShape(shape.id);
    addFullIconElement({
      x: Math.round((794 - size) / 2),
      y: Math.round((1123 - size) / 2),
      size,
      width: size,
      height: size,
      isShape: true,
      shapeKind: shape.id,
      // A circle defaults to fully rounded so it remains an oval when resized.
      // The slider writes an explicit percentage only after the user adjusts it.
      cornerRadius: shape.id === 'circle' ? undefined : 0,
      svgUrl: shape.svgUrl,
      color: '#000000',
    });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FUTURA_STYLE }} />

      <aside
        aria-label="Shapes"
        className={`fixed left-[110px] z-40 flex flex-col overflow-hidden rounded-3xl ${poppins.variable}`}
        style={{
          top: 'calc(50% - (100vh - 200px) / 2 + 40px)',
          width: 290,
          height: 'calc(100vh - 200px)',
          maxHeight: 600,
          ...glassStyle,
          opacity: shouldShow ? 1 : 0,
          transform: shouldShow ? 'scale(1) translateX(0)' : 'scale(0.85) translateX(-12px)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          pointerEvents: shouldShow ? 'auto' : 'none',
        }}
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 pb-4 pt-4">
          <h2
            style={{
              color: '#fff',
              fontFamily: 'FuturaDisplay, sans-serif',
              fontSize: 24,
              letterSpacing: '0.01em',
              lineHeight: 1,
            }}
          >
            Shapes
          </h2>
          <Image
            src="/assets/tools_icons/shapes_icon.svg"
            alt="Shapes"
            width={24}
            height={24}
            className="pointer-events-none select-none opacity-70"
            draggable={false}
          />
        </header>

        <div className="mx-3 h-px bg-white/30" />

        <section className="flex-1 px-4 pb-4 pt-5">
          <div className="grid grid-cols-2 gap-3">
            {SHAPES.map((shape) => (
              <ShapeTile
                key={shape.id}
                shape={shape}
                isSelected={selectedShape === shape.id}
                onSelect={() => selectShape(shape)}
              />
            ))}
          </div>
        </section>
      </aside>
    </>
  );
}
