'use client';

import { useEffect } from 'react';
import { ColorPicker } from '../../globals/color.picker';
import { PenThicknessPicker } from './pen.thickness';
import { PenEraserPicker } from './pen.eraser';

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
  onColorChange: (color: string) => void;
  onThicknessChange: (thickness: number) => void;
  onEraserSizeChange: (size: number) => void;
}

export function PenTools({
  isActive,
  color,
  thickness,
  eraserSize,
  onColorChange,
  onThicknessChange,
  onEraserSizeChange,
}: PenToolsProps) {
  
  // Apply custom cursor when pen tool is active
  useEffect(() => {
    if (!isActive || !thickness) return;

    // Find the canvas element
    const canvas = document.querySelector('[data-canvas-area]') as HTMLElement;
    if (canvas) {
      canvas.style.cursor = `url('/assets/tools_icons/pen.png') 8 24, crosshair`;
    }
    
    return () => {
      if (canvas) {
        canvas.style.cursor = '';
      }
    };
  }, [isActive, thickness, color]);

  return (
    <div
      className="fixed left-[110px] z-40 flex flex-col rounded-3xl transition-all duration-400 ease-out pen-tools-sidebar"
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      style={{
        ...glassStyle,
        width: '70px',
        padding: '16px 12px',
        bottom: '180px',
        opacity: isActive ? 1 : 0,
        transform: isActive ? 'scale(1) translateX(0)' : 'scale(0.85) translateX(-12px)',
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    >
      {/* Global styles for popup positioning */}
      <style>{`
        /* Color picker popup - appears above the button and to the right */
        .pen-tools-sidebar [data-color-picker-popup] {
          position: absolute !important;
          left: calc(100% + 12px) !important;
          bottom: -10px !important;
          top: auto !important;
          transform: none !important;
          transform-origin: left center !important;
        }
        
        /* Ensure all nested absolute positioned elements follow this pattern */
        .pen-tools-sidebar .relative > .absolute {
          left: auto !important;
          right: auto !important;
        }
      `}</style>
      
      {/* Vertical layout */}
      <div className="flex flex-col items-center gap-3">
        {/* Color picker */}
        <div className="flex items-center justify-center w-full">
          <ColorPicker color={color} onSelect={onColorChange} />
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-white/10" />

        {/* Pen thickness */}
        <PenThicknessPicker thickness={thickness} onSelect={onThicknessChange} />

        {/* Eraser */}
        <PenEraserPicker eraserSize={eraserSize} onSelect={onEraserSizeChange} />
      </div>
    </div>
  );
}
