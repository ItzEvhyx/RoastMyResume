'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const glassPanel: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.85)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5)',
  borderRadius: 14,
};

export interface PenThicknessOption {
  value: number; // in pixels
}

export const PEN_THICKNESS_OPTIONS: PenThicknessOption[] = [
  { value: 2 },
  { value: 4 },
  { value: 6 },
  { value: 8 },
  { value: 12 },
];

interface PenThicknessPickerProps {
  thickness: number;
  onSelect: (thickness: number) => void;
}

export function PenThicknessPicker({ thickness, onSelect }: PenThicknessPickerProps) {
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
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ userSelect: 'none' }}
    >
      {/* Trigger button */}
      <button
        className="flex items-center justify-center w-full py-3 transition-colors hover:bg-white/10 rounded-lg"
        style={{
          background: thickness ? 'rgba(255,255,255,0.06)' : 'transparent',
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src="/assets/tools_icons/divider_thickness_icon.png"
          alt="Pen thickness"
          width={24}
          height={24}
          draggable={false}
          className="opacity-80"
        />
      </button>

      {/* Thickness submenu - appears on right on hover */}
      {hovering && (
        <div
          className="absolute"
          style={{
            bottom: 0, // Align with bottom of button
            left: 'calc(100% + 8px)',
            zIndex: 110,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div style={{ ...glassPanel, padding: '8px 0', minWidth: 140 }}>
            {PEN_THICKNESS_OPTIONS.map((option) => {
              const isActive = thickness === option.value;
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
                  {/* Circle preview on left */}
                  <div
                    style={{
                      width: option.value * 2,
                      height: option.value * 2,
                      borderRadius: '50%',
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
