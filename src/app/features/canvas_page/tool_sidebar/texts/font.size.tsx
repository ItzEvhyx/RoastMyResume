'use client';

import { useState, useRef, useEffect } from 'react';

// ─── Shared glass style ───────────────────────────────────────────────────────

const glassPanel: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.85)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5)',
  borderRadius: 14,
};

// ─── Data — exported so drag.text.tsx can use for stepped resize ──────────────

export type TextCategoryScale = 'header' | 'subheader' | 'body' | 'meta';

export interface SizeCategory {
  label: string;
  scale: TextCategoryScale;
  sizes: number[]; // largest → smallest
}

export const CATEGORIES: SizeCategory[] = [
  { label: 'Header',    scale: 'header',    sizes: [32, 28, 24]     },
  { label: 'Subheader', scale: 'subheader', sizes: [20, 16]         },
  { label: 'Body',      scale: 'body',      sizes: [13, 12, 11, 10] },
  { label: 'Meta',      scale: 'meta',      sizes: [11, 9]          },
];

const LABEL_STYLE: Record<TextCategoryScale, React.CSSProperties> = {
  header:    { fontSize: 22, fontWeight: 700 },
  subheader: { fontSize: 18, fontWeight: 600 },
  body:      { fontSize: 15, fontWeight: 500 },
  meta:      { fontSize: 13, fontWeight: 400 },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface FontSizePickerProps {
  /** Called when user picks a size; also reports the category it belongs to */
  onSelect: (fontSize: number, category: TextCategoryScale) => void;
  /** Currently active category — drives the trigger label */
  activeCategory?: TextCategoryScale | null;
}

export function FontSizePicker({ onSelect, activeCategory }: FontSizePickerProps) {
  const [open, setOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHoveredCategory(null);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  const handleSizeClick = (size: number, scale: TextCategoryScale) => {
    onSelect(size, scale);
    setOpen(false);
    setHoveredCategory(null);
  };

  const activeSizes = CATEGORIES.find(c => c.label === hoveredCategory) ?? null;

  // Label shown on the trigger button
  const triggerLabel = activeCategory
    ? (CATEGORIES.find(c => c.scale === activeCategory)?.label ?? 'Header')
    : 'Header';

  return (
    <div ref={rootRef} className="relative" style={{ userSelect: 'none' }}>

      {/* Trigger button */}
      <button
        className="flex items-center justify-center rounded-full px-6 text-white font-semibold text-base transition-colors hover:bg-white/10 active:bg-white/20"
        style={{
          height: 38,
          border: '1.5px solid rgba(255,255,255,0.3)',
          minWidth: 140,
          whiteSpace: 'nowrap',
        }}
        aria-label="Font size"
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onPointerDown={(e) => { e.stopPropagation(); }}
        onDoubleClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(o => !o);
          if (open) setHoveredCategory(null);
        }}
      >
        {triggerLabel}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute"
          style={{ top: 'calc(100% + 10px)', left: 0, zIndex: 100 }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Category list */}
          <div style={{ ...glassPanel, padding: '8px 0', minWidth: 172, position: 'relative' }}>
            {CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className="flex items-center transition-colors"
                style={{
                  height: 60,
                  paddingInline: 24,
                  margin: '0 6px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: hoveredCategory === cat.label
                    ? 'rgba(255,255,255,0.10)'
                    : activeCategory === cat.scale
                      ? 'rgba(255,255,255,0.06)'
                      : 'transparent',
                  color: '#ffffff',
                  ...LABEL_STYLE[cat.scale],
                }}
                onMouseEnter={() => setHoveredCategory(cat.label)}
                onClick={(e) => { e.stopPropagation(); setHoveredCategory(cat.label); }}
              >
                {cat.label}
              </div>
            ))}

            {/* Size panel */}
            {activeSizes && (
              <div
                style={{
                  ...glassPanel,
                  position: 'absolute',
                  top: (() => {
                    const idx = CATEGORIES.findIndex(c => c.label === hoveredCategory);
                    return idx * 60 + 8;
                  })(),
                  left: 'calc(100% + 8px)',
                  padding: '8px 0',
                  minWidth: 110,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                }}
              >
                {activeSizes.sizes.map((size) => (
                  <button
                    key={size}
                    className="flex items-center justify-center transition-colors"
                    style={{
                      height: Math.max(56, size + 24),
                      margin: '0 6px',
                      borderRadius: 8,
                      fontSize: size,
                      fontWeight: 700,
                      color: '#ffffff',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      width: 'calc(100% - 12px)',
                      lineHeight: 1,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); handleSizeClick(size, activeSizes.scale); }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
