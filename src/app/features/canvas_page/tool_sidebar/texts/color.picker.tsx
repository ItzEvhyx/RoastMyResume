'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Shared glass style ───────────────────────────────────────────────────────
const glassPanel: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.92)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.55)',
  borderRadius: 18,
};

// ─── Presets ──────────────────────────────────────────────────────────────────
const PRESETS = [
  '#000000', '#ffffff', '#6b7280', '#4b5563',
  '#1e3a8a', '#065f46', '#14532d', '#7c2d12',
  '#991b1b', '#7e22ce', '#c2410c', '#ff3b30',
];

// ─── Color math helpers ───────────────────────────────────────────────────────

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const r = Math.round(f(5) * 255);
  const g = Math.round(f(3) * 255);
  const b = Math.round(f(1) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return { h: 0, s: 0, v: 0 };
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h, s, v };
}

function isValidHex(hex: string) {
  return /^[0-9a-fA-F]{6}$/.test(hex.replace('#', ''));
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ColorPickerProps {
  color: string;
  onSelect: (color: string) => void;
}

export function ColorPicker({ color, onSelect }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hexInput, setHexInput] = useState(color.replace('#', '').toUpperCase());
  const [hsv, setHsv] = useState(() => hexToHsv(color));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexInput(color.replace('#', '').toUpperCase());
    setHsv(hexToHsv(color));
  }, [color]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowAdvanced(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  const applyColor = (hex: string) => {
    onSelect(hex);
    setHexInput(hex.replace('#', '').toUpperCase());
    setHsv(hexToHsv(hex));
  };

  const handleHexInput = (val: string) => {
    const clean = val.replace('#', '').toUpperCase().slice(0, 6);
    setHexInput(clean);
    if (isValidHex(clean)) {
      const hex = `#${clean.toLowerCase()}`;
      onSelect(hex);
      setHsv(hexToHsv(hex));
    }
  };

  const handleHsvChange = (newHsv: typeof hsv) => {
    setHsv(newHsv);
    const hex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setHexInput(hex.replace('#', '').toUpperCase());
    onSelect(hex);
  };

  const previewColor = isValidHex(hexInput) ? `#${hexInput.toLowerCase()}` : color;

  return (
    <div ref={rootRef} className="relative" style={{ userSelect: 'none', flexShrink: 0 }}>

      {/* Trigger swatch */}
      <button
        className="rounded-full transition-opacity hover:opacity-80 active:opacity-60"
        style={{
          width: 30, height: 30,
          background: color,
          border: '2px solid rgba(255,255,255,0.25)',
          flexShrink: 0,
          cursor: 'pointer',
        }}
        title="Text color"
        aria-label="Text color"
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onPointerDown={(e) => { e.stopPropagation(); }}
        onDoubleClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
      />

      {/* Dropdown */}
      {open && (
        <div
          className="absolute"
          style={{ top: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)', zIndex: 110 }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Fixed width — prevents overflow */}
          <div style={{ ...glassPanel, padding: 20, width: 340 }}>

            {!showAdvanced ? (
              <>
                {/* 6-column preset grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: 10,
                  marginBottom: 18,
                }}>
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={(e) => { e.stopPropagation(); applyColor(p); }}
                      style={{
                        width: '100%', aspectRatio: '1',
                        borderRadius: 12,
                        background: p,
                        border: color.toLowerCase() === p.toLowerCase()
                          ? '2.5px solid #ffffff'
                          : '2px solid rgba(255,255,255,0.12)',
                        cursor: 'pointer',
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.14)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                  ))}
                </div>

                {/* Hex input row — constrained to panel width */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    background: previewColor,
                    border: '2px solid rgba(255,255,255,0.18)',
                  }} />
                  <div style={{
                    flex: 1,
                    minWidth: 0,           // allow flex child to shrink below content size
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.07)',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.14)',
                    paddingInline: 12,
                    height: 44,
                    gap: 8,
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>#</span>
                    <input
                      type="text"
                      value={hexInput}
                      maxLength={6}
                      onChange={e => handleHexInput(e.target.value)}
                      placeholder="000000"
                      style={{
                        flex: 1,
                        minWidth: 0,       // critical: allows input to shrink
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#ffffff',
                        fontSize: 15,
                        fontWeight: 500,
                        fontFamily: 'monospace',
                        letterSpacing: 2,
                      }}
                    />
                  </div>
                </div>

                {/* Advanced toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAdvanced(true); }}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    color: 'rgba(255,255,255,0.75)',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                >
                  Advanced ›
                </button>
              </>
            ) : (
              <AdvancedPicker
                hsv={hsv}
                hex={previewColor}
                hexInput={hexInput}
                onHsvChange={handleHsvChange}
                onHexInput={handleHexInput}
                onBack={() => setShowAdvanced(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Advanced picker ──────────────────────────────────────────────────────────

function AdvancedPicker({
  hsv, hex, hexInput,
  onHsvChange, onHexInput, onBack,
}: {
  hsv: { h: number; s: number; v: number };
  hex: string;
  hexInput: string;
  onHsvChange: (h: { h: number; s: number; v: number }) => void;
  onHexInput: (val: string) => void;
  onBack: () => void;
}) {
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const draggingSv = useRef(false);
  const draggingHue = useRef(false);

  const hueHex = hsvToHex(hsv.h, 1, 1);

  const getSvFromEvent = useCallback((e: PointerEvent | React.PointerEvent) => {
    const el = svRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const v = Math.min(1, Math.max(0, 1 - (e.clientY - rect.top) / rect.height));
    onHsvChange({ ...hsv, s, v });
  }, [hsv, onHsvChange]);

  const getHueFromEvent = useCallback((e: PointerEvent | React.PointerEvent) => {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const h = Math.min(360, Math.max(0, ((e.clientX - rect.left) / rect.width) * 360));
    onHsvChange({ ...hsv, h });
  }, [hsv, onHsvChange]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (draggingSv.current) getSvFromEvent(e);
      if (draggingHue.current) getHueFromEvent(e);
    };
    const onUp = () => { draggingSv.current = false; draggingHue.current = false; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [getSvFromEvent, getHueFromEvent]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Back button — white */}
      <button
        onClick={(e) => { e.stopPropagation(); onBack(); }}
        style={{
          alignSelf: 'flex-start',
          background: 'none',
          border: 'none',
          color: '#ffffff',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          padding: 0,
          opacity: 0.85,
        }}
      >
        ‹ Back
      </button>

      {/* Saturation / Value gradient */}
      <div
        ref={svRef}
        style={{
          width: '100%',
          height: 190,
          borderRadius: 12,
          position: 'relative',
          cursor: 'crosshair',
          background: hueHex,
          overflow: 'hidden',
        }}
        onPointerDown={(e) => { draggingSv.current = true; getSvFromEvent(e); }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #ffffff, transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000000, transparent)' }} />
        {/* Crosshair cursor */}
        <div style={{
          position: 'absolute',
          left: `${hsv.s * 100}%`,
          top: `${(1 - hsv.v) * 100}%`,
          transform: 'translate(-50%, -50%)',
          width: 16, height: 16,
          borderRadius: '50%',
          border: '2.5px solid #ffffff',
          background: hex,
          pointerEvents: 'none',
          boxShadow: '0 1px 6px rgba(0,0,0,0.6)',
        }} />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        style={{
          width: '100%',
          height: 18,
          borderRadius: 9,
          position: 'relative',
          cursor: 'pointer',
          background: 'linear-gradient(to right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)',
        }}
        onPointerDown={(e) => { draggingHue.current = true; getHueFromEvent(e); }}
      >
        <div style={{
          position: 'absolute',
          left: `${(hsv.h / 360) * 100}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 22, height: 22,
          borderRadius: '50%',
          border: '2.5px solid #ffffff',
          background: hueHex,
          pointerEvents: 'none',
          boxShadow: '0 1px 5px rgba(0,0,0,0.5)',
        }} />
      </div>

      {/* Hex input row — minWidth:0 prevents overflow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: hex,
          border: '2px solid rgba(255,255,255,0.18)',
        }} />
        <div style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.14)',
          paddingInline: 12,
          height: 42,
          gap: 8,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>#</span>
          <input
            type="text"
            value={hexInput}
            maxLength={6}
            onChange={e => onHexInput(e.target.value)}
            placeholder="000000"
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 500,
              fontFamily: 'monospace',
              letterSpacing: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
}
