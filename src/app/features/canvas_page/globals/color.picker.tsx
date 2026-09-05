'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-poppins',
});

const glassPanel: React.CSSProperties = {
  // This picker can sit above the white canvas, so keep the sidebar glass
  // colour but make its surface opaque enough to avoid the canvas showing through.
  background: 'rgba(30, 32, 38, 0.92)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
  borderRadius: 24,
};

const PRESETS = ['#000000', '#ffffff', '#6b7280', '#4b5563', '#1e3a8a', '#065f46', '#14532d', '#7c2d12', '#991b1b', '#7e22ce', '#c2410c', '#ff3b30'];

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return `#${Math.round(f(5) * 255).toString(16).padStart(2, '0')}${Math.round(f(3) * 255).toString(16).padStart(2, '0')}${Math.round(f(1) * 255).toString(16).padStart(2, '0')}`;
}

function hexToHsv(hex: string) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return { h: 0, s: 0, v: 0 };
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h, s, v: max };
}

function isValidHex(hex: string) {
  return /^[0-9a-fA-F]{6}$/.test(hex.replace('#', ''));
}

interface ColorPickerProps {
  color: string;
  onSelect: (color: string) => void;
  /** Open the picker from hover instead of click, used by the pen toolbar. */
  openOnHover?: boolean;
  popupPlacement?: 'bottom' | 'right';
  /** Replaces the standard colour-circle trigger while retaining this picker. */
  triggerIconSrc?: string;
  triggerLabel?: string;
}

export function ColorPicker({
  color,
  onSelect,
  openOnHover = false,
  popupPlacement = 'bottom',
  triggerIconSrc,
  triggerLabel,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hexInput, setHexInput] = useState(color.replace('#', '').toUpperCase());
  const [hsv, setHsv] = useState(() => hexToHsv(color));
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPicker = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setOpen(true);
  };

  const closePicker = () => {
    if (!openOnHover) return;
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
      setShowAdvanced(false);
    }, 100);
  };

  useEffect(() => {
    // Sync the picker when its externally controlled color changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHexInput(color.replace('#', '').toUpperCase());
    setHsv(hexToHsv(color));
  }, [color]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setShowAdvanced(false);
      }
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  useEffect(() => () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  }, []);

  const applyColor = (hex: string) => {
    onSelect(hex);
    setHexInput(hex.replace('#', '').toUpperCase());
    setHsv(hexToHsv(hex));
  };
  const handleHexInput = (value: string) => {
    const clean = value.replace('#', '').toUpperCase().slice(0, 6);
    setHexInput(clean);
    if (isValidHex(clean)) applyColor(`#${clean.toLowerCase()}`);
  };
  const handleHsvChange = (newHsv: typeof hsv) => {
    setHsv(newHsv);
    const hex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setHexInput(hex.replace('#', '').toUpperCase());
    onSelect(hex);
  };
  const previewColor = isValidHex(hexInput) ? `#${hexInput.toLowerCase()}` : color;

  return (
    <div
      ref={rootRef}
      className={`relative ${poppins.variable} ${popupPlacement === 'right' ? 'flex w-full justify-center' : ''}`}
      style={{ userSelect: 'none', flexShrink: 0 }}
      onMouseEnter={openOnHover ? openPicker : undefined}
      onMouseLeave={openOnHover ? closePicker : undefined}
    >
      <button
        className={triggerIconSrc
          ? 'flex h-10 w-12 items-center justify-center rounded-lg transition-colors hover:bg-white/10 active:bg-white/20'
          : 'rounded-full transition-opacity hover:opacity-80 active:opacity-60'}
        style={triggerIconSrc
          ? { flexShrink: 0, cursor: 'pointer', background: open ? 'rgba(255,255,255,0.10)' : 'transparent' }
          : { width: 30, height: 30, background: color, border: '2px solid rgba(255,255,255,0.25)', flexShrink: 0, cursor: 'pointer' }}
        title={triggerLabel ?? 'Color'}
        aria-label={triggerLabel ?? 'Color'}
        onMouseDown={(event) => { event.stopPropagation(); event.preventDefault(); }}
        onPointerDown={(event) => event.stopPropagation()}
        onDoubleClick={(event) => { event.stopPropagation(); event.preventDefault(); }}
        onClick={(event) => {
          event.stopPropagation();
          if (openOnHover) openPicker();
          else setOpen(value => !value);
        }}
      >
        {triggerIconSrc && (
          <Image
            src={triggerIconSrc}
            alt=""
            width={24}
            height={24}
            className="pointer-events-none select-none opacity-80"
            draggable={false}
          />
        )}
      </button>
      {open && (
        <div 
          data-color-picker-popup
          className="absolute" 
          style={{ 
            top: popupPlacement === 'right' ? '50%' : 'calc(100% + 12px)',
            left: popupPlacement === 'right' ? 'calc(100% + 12px)' : '50%',
            transform: popupPlacement === 'right' ? 'translateY(-50%)' : 'translateX(-50%) scale(1.2)',
            transformOrigin: popupPlacement === 'right' ? 'left center' : 'top center',
            zIndex: 110 
          }}
          onMouseEnter={openOnHover ? openPicker : undefined}
          onMouseLeave={openOnHover ? closePicker : undefined}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div style={{ ...glassPanel, padding: 20, width: 340 }}>
            {!showAdvanced ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 18 }}>
                  {PRESETS.map((preset) => (
                    <button key={preset} onClick={(event) => { event.stopPropagation(); applyColor(preset); }} style={{ width: '100%', aspectRatio: '1', borderRadius: 12, background: preset, border: color.toLowerCase() === preset.toLowerCase() ? '2.5px solid #ffffff' : '2px solid rgba(255,255,255,0.12)', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={(event) => { event.currentTarget.style.transform = 'scale(1.14)'; }} onMouseLeave={(event) => { event.currentTarget.style.transform = 'scale(1)'; }} />
                  ))}
                </div>
                <HexInput color={previewColor} value={hexInput} onChange={handleHexInput} />
                <button onClick={(event) => { event.stopPropagation(); setShowAdvanced(true); }} style={{ width: '100%', padding: '10px 0', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#ffffff', fontFamily: 'var(--font-poppins)', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={(event) => { event.currentTarget.style.background = 'rgba(255,255,255,0.13)'; }} onMouseLeave={(event) => { event.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}>
                  Advanced ›
                </button>
              </>
            ) : <AdvancedPicker hsv={hsv} hex={previewColor} hexInput={hexInput} onHsvChange={handleHsvChange} onHexInput={handleHexInput} onBack={() => setShowAdvanced(false)} />}
          </div>
        </div>
      )}
    </div>
  );
}

function HexInput({ color, value, onChange }: { color: string; value: string; onChange: (value: string) => void }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
    <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: color, border: '2px solid rgba(255,255,255,0.18)' }} />
    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)', paddingInline: 12, height: 44, gap: 8 }}>
      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>#</span>
      <input type="text" value={value} maxLength={6} onChange={(event) => onChange(event.target.value)} placeholder="000000" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: 15, fontWeight: 500, fontFamily: 'monospace', letterSpacing: 2 }} />
    </div>
  </div>;
}

function AdvancedPicker({ hsv, hex, hexInput, onHsvChange, onHexInput, onBack }: { hsv: { h: number; s: number; v: number }; hex: string; hexInput: string; onHsvChange: (hsv: { h: number; s: number; v: number }) => void; onHexInput: (value: string) => void; onBack: () => void }) {
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const draggingSv = useRef(false);
  const draggingHue = useRef(false);
  const hueHex = hsvToHex(hsv.h, 1, 1);
  const getSvFromEvent = useCallback((event: PointerEvent | React.PointerEvent) => {
    const rect = svRef.current?.getBoundingClientRect();
    if (!rect) return;
    onHsvChange({ ...hsv, s: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), v: Math.min(1, Math.max(0, 1 - (event.clientY - rect.top) / rect.height)) });
  }, [hsv, onHsvChange]);
  const getHueFromEvent = useCallback((event: PointerEvent | React.PointerEvent) => {
    const rect = hueRef.current?.getBoundingClientRect();
    if (!rect) return;
    onHsvChange({ ...hsv, h: Math.min(360, Math.max(0, ((event.clientX - rect.left) / rect.width) * 360)) });
  }, [hsv, onHsvChange]);
  useEffect(() => {
    const move = (event: PointerEvent) => { if (draggingSv.current) getSvFromEvent(event); if (draggingHue.current) getHueFromEvent(event); };
    const up = () => { draggingSv.current = false; draggingHue.current = false; };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [getSvFromEvent, getHueFromEvent]);
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <button onClick={(event) => { event.stopPropagation(); onBack(); }} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#ffffff', fontFamily: 'var(--font-poppins)', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: 0 }}>‹ Back</button>
    <div ref={svRef} style={{ width: '100%', height: 190, borderRadius: 12, position: 'relative', cursor: 'crosshair', background: hueHex, overflow: 'hidden' }} onPointerDown={(event) => { draggingSv.current = true; getSvFromEvent(event); }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #ffffff, transparent)' }} /><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000000, transparent)' }} />
      <div style={{ position: 'absolute', left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, transform: 'translate(-50%, -50%)', width: 16, height: 16, borderRadius: '50%', border: '2.5px solid #ffffff', background: hex, pointerEvents: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.6)' }} />
    </div>
    <div ref={hueRef} style={{ width: '100%', height: 18, borderRadius: 9, position: 'relative', cursor: 'pointer', background: 'linear-gradient(to right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)' }} onPointerDown={(event) => { draggingHue.current = true; getHueFromEvent(event); }}><div style={{ position: 'absolute', left: `${(hsv.h / 360) * 100}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 22, height: 22, borderRadius: '50%', border: '2.5px solid #ffffff', background: hueHex, pointerEvents: 'none', boxShadow: '0 1px 5px rgba(0,0,0,0.5)' }} /></div>
    <HexInput color={hex} value={hexInput} onChange={onHexInput} />
  </div>;
}
