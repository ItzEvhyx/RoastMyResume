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

interface ShapeCornerRoundingPickerProps {
  radius: number;
  onChange: (radius: number) => void;
}

/** Icon-triggered, live corner-radius control for the selected shape. */
export function ShapeCornerRoundingPicker({
  radius,
  onChange,
}: ShapeCornerRoundingPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const displayRadius = Math.min(Math.max(0, Math.round(radius / 5) * 5), 100);
  const progress = displayRadius;

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div ref={rootRef} className="relative" style={{ userSelect: 'none' }}>
      <button
        type="button"
        title="Corner rounding"
        aria-label="Corner rounding"
        aria-expanded={open}
        className="flex h-10 w-12 items-center justify-center rounded-lg transition-colors hover:bg-white/10 active:bg-white/20"
        style={{ background: open ? 'rgba(255,255,255,0.10)' : 'transparent' }}
        onMouseDown={(event) => { event.stopPropagation(); event.preventDefault(); }}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => { event.stopPropagation(); setOpen((value) => !value); }}
      >
        <Image
          src="/assets/tools_icons/shape_corner.png"
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
          <div style={{ ...glassPanel, width: 320, padding: '22px 20px' }}>
            <div
              className="flex items-center gap-3"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <input
                type="range"
                min={0}
                max={100}
                value={displayRadius}
                aria-label="Corner radius"
                className="shape-corner-radius-slider"
                style={{
                  flex: 1,
                  minWidth: 0,
                  cursor: 'ew-resize',
                  background: `linear-gradient(to right, #ffffff 0%, #ffffff ${progress}%, rgba(255,255,255,0.22) ${progress}%, rgba(255,255,255,0.22) 100%)`,
                }}
                step={5}
                onChange={(event) => onChange(Number(event.target.value))}
                onPointerDown={(event) => event.stopPropagation()}
              />
              <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.22)', flexShrink: 0 }} />
              <output
                aria-live="polite"
                style={{ minWidth: 50, color: '#fff', fontSize: 15, fontWeight: 700, textAlign: 'right' }}
              >
                {displayRadius}%
              </output>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .shape-corner-radius-slider {
          height: 9px;
          appearance: none;
          -webkit-appearance: none;
          border-radius: 999px;
          outline: none;
        }
        .shape-corner-radius-slider::-webkit-slider-runnable-track {
          height: 9px;
          border-radius: 999px;
          background: transparent;
        }
        .shape-corner-radius-slider::-webkit-slider-thumb {
          width: 24px;
          height: 24px;
          appearance: none;
          -webkit-appearance: none;
          margin-top: -7.5px;
          border: 3px solid rgba(30,32,38,0.92);
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.45);
        }
        .shape-corner-radius-slider::-moz-range-track {
          height: 9px;
          border-radius: 999px;
          background: rgba(255,255,255,0.22);
        }
        .shape-corner-radius-slider::-moz-range-progress {
          height: 9px;
          border-radius: 999px;
          background: #ffffff;
        }
        .shape-corner-radius-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border: 3px solid rgba(30,32,38,0.92);
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.45);
        }
      `}</style>
    </div>
  );
}
