'use client';

import { useEffect } from 'react';
import { ColorPicker } from '../../globals/color.picker';
import { PenThicknessPicker } from './pen.thickness';
import { PenEraserPicker } from './pen.eraser';
import { useMediaQuery } from '@/lib/use_media_query';

const glassStyle: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.55)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
};

interface PenToolsProps {
  isActive: boolean;
  color: string;
  thickness: number;
  eraserSize: number;
  isEraserActive: boolean;
  onColorChange: (color: string) => void;
  onThicknessChange: (thickness: number) => void;
  onEraserSizeChange: (size: number) => void;
  onEraserToggle: () => void;
}

export function PenTools({
  isActive,
  color,
  thickness,
  eraserSize,
  isEraserActive,
  onColorChange,
  onThicknessChange,
  onEraserSizeChange,
  onEraserToggle,
}: PenToolsProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  // Apply custom cursor when pen tool is active
  useEffect(() => {
    if (!isActive || !thickness) return;

    // Find the canvas element
    const canvas = document.querySelector('[data-canvas-area]') as HTMLElement;
    if (canvas) {
      canvas.style.cursor = isEraserActive
        ? 'cell'
        : `url('/assets/tools_icons/pen.png') 8 24, crosshair`;
    }
    
    return () => {
      if (canvas) {
        canvas.style.cursor = '';
      }
    };
  }, [isActive, thickness, color, isEraserActive]);

  return (
    <div
      className="fixed z-50 flex flex-col rounded-3xl transition-all duration-400 ease-out pen-tools-sidebar"
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      style={{
        ...glassStyle,
        left: isMobile ? '50%' : 110,
        width: '70px',
        padding: '16px 12px',
        bottom: isMobile ? 92 : 180,
        opacity: isActive ? 1 : 0,
        transform: isActive
          ? (isMobile ? 'translateX(-50%) scale(1)' : 'scale(1) translateX(0)')
          : (isMobile ? 'translateX(-50%) scale(0.85) translateY(12px)' : 'scale(0.85) translateX(-12px)'),
        transformOrigin: isMobile ? 'bottom center' : 'left center',
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    >
      {/* Vertical layout */}
      <div className="flex w-full flex-col items-center gap-3">
        {/* Color picker */}
        <div className="flex items-center justify-center w-full">
          <ColorPicker
            color={color}
            onSelect={onColorChange}
            openOnHover
            popupPlacement={isMobile ? 'bottom' : 'right'}
          />
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-white/10" />

        {/* Pen thickness */}
        <PenThicknessPicker thickness={thickness} onSelect={onThicknessChange} />

        {/* Eraser */}
        <PenEraserPicker
          eraserSize={eraserSize}
          isActive={isEraserActive}
          onSelect={onEraserSizeChange}
          onToggle={onEraserToggle}
        />
      </div>
    </div>
  );
}
