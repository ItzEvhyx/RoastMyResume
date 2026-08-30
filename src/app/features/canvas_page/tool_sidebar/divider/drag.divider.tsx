'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvas } from '@/app/features/canvas_page/context/CanvasContext';
import { DividerToolbar } from './divider.tools';

interface DividerElement {
    id: string;
    x: number;
    y: number;
    width: number;
    thickness?: number;
    color?: string;
}

interface DraggableDividerProps {
    element: DividerElement;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (updates: Partial<DividerElement>) => void;
    onDelete: () => void;
    /** Mobile only — called when the user long-presses the element */
    onLongPress?: () => void;
}

type ResizeHandle = 'w' | 'e';

interface ResizeSnapshot {
    mouseX: number;
    mouseY: number;
    x: number;
    width: number;
}

const MIN_WIDTH = 40;
const MAX_WIDTH = 1400;
const HANDLE_SIZE = 16;
const HIT_PADDING = 8; // extra invisible hit area around the thin line, for easier grabbing

export function DraggableDivider({
    element,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    onLongPress,
}: DraggableDividerProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
    const [showCopyPill, setShowCopyPill] = useState(false);

    const dragSnapshot = useRef<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null);
    const resizeSnapshot = useRef<ResizeSnapshot | null>(null);
    // Long-press timer
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { zoom } = useCanvas();

    const thickness = element.thickness ?? 2;
    const color = element.color ?? '#000000';

    // ---------------------------------------------------------------------------
    // Keyboard delete
    // ---------------------------------------------------------------------------
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isSelected && (e.key === 'Backspace' || e.key === 'Delete')) {
                e.preventDefault();
                onDelete();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSelected, onDelete]);

    // ---------------------------------------------------------------------------
    // Mouse drag
    // ---------------------------------------------------------------------------
    const handleDragMouseMove = useCallback((e: MouseEvent) => {
        if (!dragSnapshot.current) return;
        const { mouseX, mouseY, elX, elY } = dragSnapshot.current;
        const dx = (e.clientX - mouseX) / zoom;
        const dy = (e.clientY - mouseY) / zoom;
        onUpdate({ x: elX + dx, y: elY + dy });
    }, [zoom, onUpdate]);

    const handleDragMouseUp = useCallback(() => {
        setIsDragging(false);
        dragSnapshot.current = null;
    }, []);

    useEffect(() => {
        if (!isDragging) return;
        document.addEventListener('mousemove', handleDragMouseMove);
        document.addEventListener('mouseup', handleDragMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleDragMouseMove);
            document.removeEventListener('mouseup', handleDragMouseUp);
        };
    }, [isDragging, handleDragMouseMove, handleDragMouseUp]);

    // ---------------------------------------------------------------------------
    // Touch drag — mirrors mouse drag using snapshot approach
    // ---------------------------------------------------------------------------
    const handleTouchMove = useCallback((e: TouchEvent) => {
        // Only single-finger drag; ignore if a resize is active
        if (e.touches.length !== 1 || !dragSnapshot.current) return;
        e.stopPropagation(); // don't bubble up to canvas pan handler
        const touch = e.touches[0];
        const { mouseX, mouseY, elX, elY } = dragSnapshot.current;
        const dx = (touch.clientX - mouseX) / zoom;
        const dy = (touch.clientY - mouseY) / zoom;
        onUpdate({ x: elX + dx, y: elY + dy });
    }, [zoom, onUpdate]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
        dragSnapshot.current = null;
    }, []);

    useEffect(() => {
        if (!isDragging) return;
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchcancel', handleTouchEnd);
        return () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [isDragging, handleTouchMove, handleTouchEnd]);

    // ---------------------------------------------------------------------------
    // Mouse resize (width only — dragging the left/right circle handles)
    // ---------------------------------------------------------------------------
    const applyResize = (handle: ResizeHandle, snap: ResizeSnapshot, rawDx: number) => {
        if (handle === 'e') {
            const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, snap.width + rawDx));
            onUpdate({ width: newWidth });
        } else {
            const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, snap.width - rawDx));
            const clampedDx = snap.width - newWidth;
            onUpdate({ x: snap.x + clampedDx, width: newWidth });
        }
    };

    const handleResizeMouseMove = useCallback((e: MouseEvent) => {
        if (!resizeHandle || !resizeSnapshot.current) return;
        const snap = resizeSnapshot.current;
        const rawDx = (e.clientX - snap.mouseX) / zoom;
        applyResize(resizeHandle, snap, rawDx);
    }, [resizeHandle, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleResizeMouseUp = useCallback(() => {
        setResizeHandle(null);
        resizeSnapshot.current = null;
    }, []);

    useEffect(() => {
        if (!resizeHandle) return;
        document.addEventListener('mousemove', handleResizeMouseMove);
        document.addEventListener('mouseup', handleResizeMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleResizeMouseMove);
            document.removeEventListener('mouseup', handleResizeMouseUp);
        };
    }, [resizeHandle, handleResizeMouseMove, handleResizeMouseUp]);

    // ---------------------------------------------------------------------------
    // Touch resize — same snapshot logic, driven by touch position
    // ---------------------------------------------------------------------------
    const handleResizeTouchMove = useCallback((e: TouchEvent) => {
        if (!resizeHandle || !resizeSnapshot.current || e.touches.length < 1) return;
        e.stopPropagation();
        const touch = e.touches[0];
        const snap = resizeSnapshot.current;
        const rawDx = (touch.clientX - snap.mouseX) / zoom;
        applyResize(resizeHandle, snap, rawDx);
    }, [resizeHandle, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleResizeTouchEnd = useCallback(() => {
        setResizeHandle(null);
        resizeSnapshot.current = null;
    }, []);

    useEffect(() => {
        if (!resizeHandle) return;
        document.addEventListener('touchmove', handleResizeTouchMove, { passive: false });
        document.addEventListener('touchend', handleResizeTouchEnd);
        document.addEventListener('touchcancel', handleResizeTouchEnd);
        return () => {
            document.removeEventListener('touchmove', handleResizeTouchMove);
            document.removeEventListener('touchend', handleResizeTouchEnd);
            document.removeEventListener('touchcancel', handleResizeTouchEnd);
        };
    }, [resizeHandle, handleResizeTouchMove, handleResizeTouchEnd]);

    // ---------------------------------------------------------------------------
    // Mouse event handlers
    // ---------------------------------------------------------------------------
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
    };

    const startDrag = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        dragSnapshot.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            elX: element.x,
            elY: element.y,
        };
        setIsDragging(true);
        onSelect();
    };

    const startResize = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
        e.stopPropagation();
        e.preventDefault();
        resizeSnapshot.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            x: element.x,
            width: element.width,
        };
        setResizeHandle(handle);
        onSelect();
    }, [element.x, element.width, onSelect]);

    // ---------------------------------------------------------------------------
    // Touch event handlers
    // ---------------------------------------------------------------------------
    const startTouchDrag = (e: React.TouchEvent) => {
        if (e.touches.length !== 1) return;
        e.stopPropagation();

        // Select immediately so it feels snappy
        onSelect();
        setShowCopyPill(false);

        const touch = e.touches[0];
        const startX = touch.clientX;
        const startY = touch.clientY;

        dragSnapshot.current = {
            mouseX: touch.clientX,
            mouseY: touch.clientY,
            elX: element.x,
            elY: element.y,
        };

        // Long-press: if finger hasn't moved much after 600ms, show copy pill
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        longPressTimer.current = setTimeout(() => {
            // Only fire if finger is still stationary
            setIsDragging(false);
            dragSnapshot.current = null;
            setShowCopyPill(true);
            if (onLongPress) onLongPress();
        }, 600);

        // Cancel long-press if finger moves more than 8px
        const cancelOnMove = (me: TouchEvent) => {
            if (me.touches.length < 1) return;
            const t = me.touches[0];
            const dist = Math.hypot(t.clientX - startX, t.clientY - startY);
            if (dist > 8) {
                if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
                document.removeEventListener('touchmove', cancelOnMove);
            }
        };
        const cancelOnEnd = () => {
            if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
            document.removeEventListener('touchmove', cancelOnMove);
            document.removeEventListener('touchend', cancelOnEnd);
        };
        document.addEventListener('touchmove', cancelOnMove, { passive: true });
        document.addEventListener('touchend', cancelOnEnd, { once: true });

        setIsDragging(true);
    };

    const startResizeTouch = useCallback((e: React.TouchEvent, handle: ResizeHandle) => {
        if (e.touches.length < 1) return;
        e.stopPropagation();
        e.preventDefault();
        const touch = e.touches[0];
        resizeSnapshot.current = {
            mouseX: touch.clientX,
            mouseY: touch.clientY,
            x: element.x,
            width: element.width,
        };
        setResizeHandle(handle);
        onSelect();
    }, [element.x, element.width, onSelect]);

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------
    return (
        <div
            className="absolute"
            style={{
                left: `${element.x}px`,
                top: `${element.y - HIT_PADDING}px`,
                width: `${element.width}px`,
                height: `${HIT_PADDING * 2 + thickness}px`,
                cursor: isDragging ? 'grabbing' : 'move',
                pointerEvents: 'auto',
                touchAction: 'none', // prevent browser interfering with touch drag
            }}
            onMouseDown={startDrag}
            onClick={handleClick}
            onTouchStart={startTouchDrag}
        >
            {/* The actual visible line, vertically centered in the padded hit area */}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${HIT_PADDING}px`,
                    height: `${thickness}px`,
                    backgroundColor: color,
                }}
            />

            {/* Selection UI */}
            {isSelected && !isDragging && (
                <>
                    {/* Floating toolbar above the divider */}
                    <DividerToolbar
                        elementX={0}
                        elementY={0}
                        elementWidth={element.width}
                        color={color}
                        onColorChange={(newColor) => onUpdate({ color: newColor })}
                        thickness={thickness}
                        onThicknessSelect={(newThickness) => onUpdate({ thickness: newThickness })}
                    />

                    {/* Selection border around the line's bounding box */}
                    <div
                        className="pointer-events-none absolute"
                        style={{
                            left: -2,
                            top: HIT_PADDING - 2,
                            width: `calc(100% + 4px)`,
                            height: `${thickness + 4}px`,
                            border: '1px dashed rgba(0,0,0,0.4)',
                        }}
                    />

                    {/* Left circle handle */}
                    <div
                        className="absolute bg-white border-2 border-black rounded-full cursor-ew-resize"
                        style={{
                            width: HANDLE_SIZE,
                            height: HANDLE_SIZE,
                            left: -HANDLE_SIZE / 2,
                            top: HIT_PADDING + thickness / 2 - HANDLE_SIZE / 2,
                        }}
                        onMouseDown={(e) => startResize(e, 'w')}
                        onTouchStart={(e) => startResizeTouch(e, 'w')}
                    />

                    {/* Right circle handle */}
                    <div
                        className="absolute bg-white border-2 border-black rounded-full cursor-ew-resize"
                        style={{
                            width: HANDLE_SIZE,
                            height: HANDLE_SIZE,
                            right: -HANDLE_SIZE / 2,
                            top: HIT_PADDING + thickness / 2 - HANDLE_SIZE / 2,
                        }}
                        onMouseDown={(e) => startResize(e, 'e')}
                        onTouchStart={(e) => startResizeTouch(e, 'e')}
                    />
                </>
            )}

            {/* Copy / Delete pill row — shown after long-press on mobile */}
            {showCopyPill && isSelected && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translate(-50%, 10px)',
                        zIndex: 999,
                        display: 'flex',
                        gap: '8px',
                    }}
                    onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                    onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
                >
                    {/* Copy */}
                    <button
                        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                        onTouchEnd={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setShowCopyPill(false);
                            if (onLongPress) onLongPress();
                        }}
                        style={{
                            background: 'rgba(20, 22, 30, 0.92)',
                            backdropFilter: 'blur(14px)',
                            WebkitBackdropFilter: 'blur(14px)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            borderRadius: '20px',
                            padding: '8px 22px',
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: 600,
                            letterSpacing: '0.01em',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                        }}
                    >
                        <span style={{ fontSize: '17px' }}>⎘</span> Copy
                    </button>

                    {/* Delete */}
                    <button
                        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                        onTouchEnd={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setShowCopyPill(false);
                            onDelete();
                        }}
                        style={{
                            background: 'rgba(20, 22, 30, 0.92)',
                            backdropFilter: 'blur(14px)',
                            WebkitBackdropFilter: 'blur(14px)',
                            border: '1px solid rgba(239,68,68,0.45)',
                            borderRadius: '20px',
                            padding: '8px 22px',
                            color: '#ef4444',
                            fontSize: '15px',
                            fontWeight: 600,
                            letterSpacing: '0.01em',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                        }}
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}

export type { DividerElement };
