'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const glassPanel: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.55)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
  borderRadius: 24,
};

export interface EraserSizeOption {
  value: number; // in pixels
}

export const ERASER_SIZE_OPTIONS: EraserSizeOption[] = [
  { value: 10 },
  { value: 20 },
  { value: 30 },
  { value: 40 },
  { value: 50 },
];

interface PenEraserPickerProps {
  eraserSize: number;
  isActive: boolean;
  onSelect: (size: number) => void;
  onToggle: () => void;
}

export function PenEraserPicker({ eraserSize, isActive, onSelect, onToggle }: PenEraserPickerProps) {
  const [hovering, setHovering] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHovering(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHovering(false);
    }, 100);
  };

  const handleSelect = (value: number) => {
    onSelect(value);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ userSelect: 'none' }}
    >
      {/* Trigger button */}
      <button
        className="flex items-center justify-center w-full py-3 transition-colors hover:bg-white/10 rounded-lg"
        style={{
          background: isActive || hovering ? 'rgba(255,255,255,0.10)' : 'transparent',
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <Image
          src="/assets/tools_icons/eraser_icon.png"
          alt="Eraser"
          width={24}
          height={24}
          draggable={false}
          className="opacity-80"
        />
      </button>

      {/* Eraser size submenu - appears on right on hover */}
      {hovering && (
        <div
          data-eraser-popup
          className="absolute"
          style={{
            top: '50%',
            left: 'calc(100% + 12px)',
            transform: 'translateY(-50%)',
            zIndex: 110,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div style={{ ...glassPanel, padding: '8px 0', minWidth: 140 }}>
            {ERASER_SIZE_OPTIONS.map((option) => {
              const isActive = eraserSize === option.value;
              return (
                <button
                  key={option.value}
                  className="flex items-center gap-3 transition-colors"
                  style={{
                    height: 48,
                    paddingInline: 16,
                    margin: '0 6px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    width: 'calc(100% - 12px)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = isActive
                      ? 'rgba(255,255,255,0.15)'
                      : 'transparent';
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option.value);
                  }}
                >
                  {/* Square preview on left */}
                  <div
                    style={{
                      width: Math.min(option.value, 24),
                      height: Math.min(option.value, 24),
                      borderRadius: 4,
                      backgroundColor: '#ffffff',
                      flexShrink: 0,
                    }}
                  />
                  {/* Size label on right */}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      marginLeft: 'auto',
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    {option.value}px
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
