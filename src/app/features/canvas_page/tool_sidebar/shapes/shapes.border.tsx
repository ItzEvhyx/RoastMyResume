'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const glassPanel: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.92)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
  borderRadius: 18,
};

export const SHAPE_BORDER_OPTIONS = [
  { label: 'None', value: 0 },
  { label: 'Thin', value: 2 },
  { label: 'Medium', value: 6 },
  { label: 'Bold', value: 12 },
] as const;

interface ShapeBorderPickerProps {
  borderWidth: number;
  onSelect: (borderWidth: number) => void;
}

/** Icon-triggered border-width menu for a selected shape. */
export function ShapeBorderPicker({ borderWidth, onSelect }: ShapeBorderPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const selectBorderWidth = (value: number) => {
    onSelect(value);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative" style={{ userSelect: 'none' }}>
      <button
        type="button"
        title="Border thickness"
        aria-label="Border thickness"
        aria-expanded={open}
        className="flex h-10 w-12 items-center justify-center rounded-lg transition-colors hover:bg-white/10 active:bg-white/20"
        style={{ background: borderWidth > 0 ? 'rgba(255,255,255,0.10)' : 'transparent' }}
        onMouseDown={(event) => { event.stopPropagation(); event.preventDefault(); }}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => { event.stopPropagation(); setOpen((value) => !value); }}
      >
        <Image
          src="/assets/tools_icons/border_thickness_icon.png"
          alt=""
          width={24}
          height={24}
          className="pointer-events-none select-none opacity-80"
          draggable={false}
        />
      </button>

      {open && (
        <div
          className="absolute"
          style={{ top: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)', zIndex: 200030 }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div style={{ ...glassPanel, width: 176, padding: '8px 0' }}>
            {SHAPE_BORDER_OPTIONS.map((option) => {
              const isActive = borderWidth === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className="flex items-center gap-3 rounded-lg text-left transition-colors"
                  style={{
                    height: 48,
                    paddingInline: 16,
                    margin: '0 6px',
                    width: 'calc(100% - 12px)',
                    background: isActive ? 'rgba(255,255,255,0.14)' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(event) => { event.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
                  onMouseLeave={(event) => { event.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.14)' : 'transparent'; }}
                  onClick={(event) => { event.stopPropagation(); selectBorderWidth(option.value); }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 32,
                      height: option.value === 0 ? 1 : option.value,
                      background: option.value === 0 ? 'rgba(255,255,255,0.25)' : '#fff',
                      borderRadius: 999,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 700 }}>
                    {option.label}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.52)', fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700 }}>
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
