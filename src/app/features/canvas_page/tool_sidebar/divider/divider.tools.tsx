'use client';

import { ColorPicker } from '../../globals/color.picker';
import { ThicknessPicker } from './divider.thickness';

interface DividerToolbarProps {
    elementX: number;
    elementY: number;
    elementWidth: number;
    color: string;
    onColorChange: (color: string) => void;
    thickness: number;
    onThicknessSelect: (thickness: number) => void;
}

const TOOLBAR_HEIGHT = 60;
const TOOLBAR_GAP = 16;

export function DividerToolbar({
    elementX,
    elementY,
    elementWidth,
    color,
    onColorChange,
    thickness,
    onThicknessSelect,
}: DividerToolbarProps) {
    const centerX = elementX + elementWidth / 2;
    const topY = elementY - TOOLBAR_HEIGHT - TOOLBAR_GAP;

    return (
        <div
            className="absolute pointer-events-auto select-none"
            onMouseDown={(e) => {
                e.stopPropagation();
            }}
            onPointerDown={(e) => {
                e.stopPropagation();
            }}
            onClick={(e) => {
                e.stopPropagation();
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
            }}
            onTouchStart={(e) => {
                e.stopPropagation();
            }}
            style={{
                left: `${centerX}px`,
                top: `${topY}px`,
                transform: 'translateX(-50%)',
                zIndex: 50,
                whiteSpace: 'nowrap',
                userSelect: 'none',
            }}
        >
            {/* Pill container */}
            <div
                className="flex items-center gap-3 px-6 select-none"
                onMouseDown={(e) => {
                    e.stopPropagation();
                }}
                onPointerDown={(e) => {
                    e.stopPropagation();
                }}
                onClick={(e) => {
                    e.stopPropagation();
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                }}
                onTouchStart={(e) => {
                    e.stopPropagation();
                }}
                style={{
                    height: TOOLBAR_HEIGHT,
                    minWidth: 120,
                    background: 'rgba(30, 32, 38, 0.85)',
                    backdropFilter: 'blur(20px) saturate(140%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(140%)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 28px rgba(0,0,0,0.5)',
                    borderRadius: 999,
                }}
            >
                {/* Color picker */}
                <ColorPicker color={color} onSelect={onColorChange} />

                <Divider />

                {/* Line thickness */}
                <ThicknessPicker thickness={thickness} onSelect={onThicknessSelect} />
            </div>
        </div>
    );
}

function Divider() {
    return (
        <div
            style={{
                width: 1,
                height: 26,
                background: 'rgba(255,255,255,0.2)',
                marginInline: 4,
                flexShrink: 0,
            }}
        />
    );
}
