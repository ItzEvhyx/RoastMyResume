'use client';

import { useState, useRef, useEffect } from 'react';

// ─── Shared glass style (matches FontSizePicker's dropdown panel) ─────────────

const glassPanel: React.CSSProperties = {
    background: 'rgba(30, 32, 38, 0.85)',
    backdropFilter: 'blur(20px) saturate(140%)',
    WebkitBackdropFilter: 'blur(20px) saturate(140%)',
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5)',
    borderRadius: 14,
};

// ─── Data ──────────────────────────────────────────────────────────────────────

export interface ThicknessOption {
    label: string;
    value: number;
}

export const THICKNESS_OPTIONS: ThicknessOption[] = [
    { label: 'Thin', value: 2 },
    { label: 'Medium', value: 4 },
    { label: 'Thick', value: 8 },
];

// ─── Component ─────────────────────────────────────────────────────────────────

interface ThicknessPickerProps {
    /** Currently active thickness in px */
    thickness: number;
    /** Called with the new thickness in px when the user picks an option */
    onSelect: (thickness: number) => void;
}

export function ThicknessPicker({ thickness, onSelect }: ThicknessPickerProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: PointerEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('pointerdown', handler);
        return () => document.removeEventListener('pointerdown', handler);
    }, [open]);

    const handleSelect = (value: number) => {
        onSelect(value);
        setOpen(false);
    };

    const activeOption = THICKNESS_OPTIONS.find(o => o.value === thickness);
    const triggerLabel = activeOption ? `${activeOption.label} · ${activeOption.value}px` : `${thickness}px`;

    return (
        <div ref={rootRef} className="relative" style={{ userSelect: 'none' }}>

            {/* Trigger button */}
            <button
                className="flex items-center justify-center rounded-full px-5 text-white font-semibold text-sm transition-colors hover:bg-white/10 active:bg-white/20"
                style={{
                    height: 38,
                    border: '1.5px solid rgba(255,255,255,0.3)',
                    minWidth: 130,
                    whiteSpace: 'nowrap',
                }}
                aria-label="Line thickness"
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                onPointerDown={(e) => { e.stopPropagation(); }}
                onDoubleClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(o => !o);
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
                    <div style={{ ...glassPanel, padding: '8px 0', minWidth: 150 }}>
                        {THICKNESS_OPTIONS.map((option) => {
                            const isActive = thickness === option.value;
                            return (
                                <button
                                    key={option.value}
                                    className="flex items-center gap-3 transition-colors"
                                    style={{
                                        height: 52,
                                        paddingInline: 20,
                                        margin: '0 6px',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                                        color: '#ffffff',
                                        border: 'none',
                                        width: 'calc(100% - 12px)',
                                    }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = isActive ? 'rgba(255,255,255,0.10)' : 'transparent';
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); handleSelect(option.value); }}
                                >
                                    {/* Line preview at actual thickness */}
                                    <span
                                        style={{
                                            width: 28,
                                            height: option.value,
                                            backgroundColor: '#ffffff',
                                            borderRadius: 999,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <span style={{ fontSize: 14, fontWeight: 500 }}>{option.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}>
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