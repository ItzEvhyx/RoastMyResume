'use client';

/**
 * group.element.tsx
 *
 * DraggableGroup — a canvas element that wraps a committed group.
 *
 * Behaviour
 * ─────────
 *  • Renders a dashed purple bounding-box on the canvas at the group's current
 *    x/y/width/height, with a subtle fill so users can grab it.
 *  • Drag anywhere inside the box to reposition the whole group.
 *  • Four corner handles + four edge handles to resize the box (free aspect).
 *  • A floating "Ungroup" pill toolbar appears above the box while it is
 *    selected, identical in style to the other canvas toolbars.
 *  • Clicking outside deselects (handled in canvas.web.tsx onClick on background).
 *  • Keyboard Delete/Backspace deletes the group element (not its members).
 *
 * Hooks re-used from drag.elements.tsx (imported directly).
 * The useDrag / useResize hooks are NOT exported from that file, so we
 * inline lightweight equivalents here — same logic, zero duplication of state.
 */

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Poppins } from 'next/font/google';
import { isTypingIntoField } from '../utils/keyboard';
import { useCanvas } from '../context/CanvasContext';
import { useGroup, type GroupElement } from '../context/GroupContext';
import { clampGroupToSafeArea, estimateTextHeight } from '../canvas/safe.area';
import { contentToHtml } from '../utils/rich.text';
import { IconColorOverlay } from '../tool_sidebar/icons_set/color.overlay';
import { flipToTransform, type FlipState } from './flip.element';
import { useLayerElementAnimation } from './layer.order';
import { PenStrokeGraphic } from './pen.stroke';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-poppins',
});

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_SIZE = 20;
const MAX_SIZE = 2000;
const HANDLE_SIZE = 16;
const HALF = HANDLE_SIZE / 2;

// ─── Inline drag hook ─────────────────────────────────────────────────────────

function useDrag(zoom: number, onMove: (x: number, y: number) => void, onStart?: () => void, onEnd?: () => void) {
  const [isDragging, setIsDragging] = useState(false);
  const snap = useRef<{ mx: number; my: number; ex: number; ey: number } | null>(null);
  const onMoveRef = useRef(onMove);
  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);
  const zoomRef = useRef(zoom);
  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);
  useEffect(() => { onStartRef.current = onStart; }, [onStart]);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  const onMM = useCallback((e: MouseEvent) => {
    if (!snap.current) return;
    onMoveRef.current(
      snap.current.ex + (e.clientX - snap.current.mx) / zoomRef.current,
      snap.current.ey + (e.clientY - snap.current.my) / zoomRef.current,
    );
  }, []);
  const onMU = useCallback(() => {
    setIsDragging(false); snap.current = null; onEndRef.current?.();
  }, []);
  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener('mousemove', onMM);
    document.addEventListener('mouseup', onMU);
    return () => { document.removeEventListener('mousemove', onMM); document.removeEventListener('mouseup', onMU); };
  }, [isDragging, onMM, onMU]);

  const start = useCallback((e: React.MouseEvent, ex: number, ey: number) => {
    snap.current = { mx: e.clientX, my: e.clientY, ex, ey };
    setIsDragging(true); onStartRef.current?.();
  }, []);

  return { isDragging, start };
}

// ─── Inline resize hook ───────────────────────────────────────────────────────

type RHandle = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w';

interface RSnap { mx: number; my: number; x: number; y: number; w: number; h: number }

function useResize(
  zoom: number,
  onResize: (handle: RHandle, snap: RSnap, dx: number, dy: number) => void,
  onStart?: () => void,
  onEnd?: () => void,
) {
  const [active, setActive] = useState<RHandle | null>(null);
  const snap = useRef<RSnap | null>(null);
  const cbRef = useRef(onResize);
  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);
  const zoomRef = useRef(zoom);
  useEffect(() => { cbRef.current = onResize; }, [onResize]);
  useEffect(() => { onStartRef.current = onStart; }, [onStart]);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  const onMM = useCallback((e: MouseEvent) => {
    if (!active || !snap.current) return;
    cbRef.current(
      active, snap.current,
      (e.clientX - snap.current.mx) / zoomRef.current,
      (e.clientY - snap.current.my) / zoomRef.current,
    );
  }, [active]);
  const onMU = useCallback(() => {
    setActive(null); snap.current = null; onEndRef.current?.();
  }, []);
  useEffect(() => {
    if (!active) return;
    document.addEventListener('mousemove', onMM);
    document.addEventListener('mouseup', onMU);
    return () => { document.removeEventListener('mousemove', onMM); document.removeEventListener('mouseup', onMU); };
  }, [active, onMM, onMU]);

  const start = useCallback((e: React.MouseEvent, handle: RHandle, s: Omit<RSnap, 'mx' | 'my'>) => {
    e.stopPropagation(); e.preventDefault();
    snap.current = { mx: e.clientX, my: e.clientY, ...s };
    setActive(handle); onStartRef.current?.();
  }, []);

  return { start };
}

// ─── Handle node ──────────────────────────────────────────────────────────────

function Handle({ style, cursor, onMouseDown, dataNoExport = false }: {
  style: React.CSSProperties;
  cursor: string;
  onMouseDown: (e: React.MouseEvent) => void;
  dataNoExport?: boolean;
}) {
  return (
    <div
      data-no-export={dataNoExport ? 'true' : undefined}
      className="absolute rounded-sm border-2 border-black bg-white"
      style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, cursor, zIndex: 3, ...style }}
      onMouseDown={onMouseDown}
    />
  );
}

// ─── DraggableGroup ───────────────────────────────────────────────────────────

interface DraggableGroupProps {
  group: GroupElement;
  isSelected: boolean;
  onSelect: () => void;
  onUngroup: () => void;
  onDelete: () => void;
  onSafeAreaClamp?: (bounds: Pick<GroupElement, 'x' | 'y' | 'width' | 'height'>) => void;
  onSafeAreaClear?: () => void;
  onTransformEnd?: () => void;
}

export function DraggableGroup({
  group,
  isSelected,
  onSelect,
  onUngroup,
  onDelete,
  onSafeAreaClamp,
  onSafeAreaClear,
  onTransformEnd,
}: DraggableGroupProps) {
  const { zoom } = useCanvas();
  const { updateGroup, startUpdateBatch, endUpdateBatch } = useGroup();

  // rAF-batched update
  const pendingRef = useRef<Partial<Pick<GroupElement, 'x' | 'y' | 'width' | 'height'>> | null>(null);
  const frameRef = useRef<number | null>(null);

  const flush = useCallback(() => {
    if (frameRef.current !== null) { cancelAnimationFrame(frameRef.current); frameRef.current = null; }
    const p = pendingRef.current; pendingRef.current = null;
    if (p) updateGroup(group.id, p);
  }, [group.id, updateGroup]);

  const queue = useCallback((u: Partial<Pick<GroupElement, 'x' | 'y' | 'width' | 'height'>>) => {
    const result = clampGroupToSafeArea(group, u);
    if (result.wasClamped) {
      onSafeAreaClamp?.({
        x: result.updates.x!,
        y: result.updates.y!,
        width: result.updates.width!,
        height: result.updates.height!,
      });
    } else {
      onSafeAreaClear?.();
    }
    pendingRef.current = { ...pendingRef.current, ...result.updates };
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const p = pendingRef.current; pendingRef.current = null;
      if (p) updateGroup(group.id, p);
    });
  }, [group, onSafeAreaClamp, onSafeAreaClear, updateGroup]);

  useEffect(() => () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); }, []);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const { isDragging, start: startDrag } = useDrag(
    zoom,
    (x, y) => queue({ x, y }),
    startUpdateBatch,
    () => { flush(); endUpdateBatch(); onTransformEnd?.(); },
  );

  // Expand wrapper when member text wraps taller than the stored group height
  // (legacy groups were sized with newline-only height estimates).
  const previewRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = previewRef.current;
    if (!root || isDragging) return;

    let maxBottom = 0;
    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i] as HTMLElement;
      maxBottom = Math.max(maxBottom, child.offsetTop + child.offsetHeight);
    }

    const scaleX = group.width / group.originWidth || 1;
    const scaleY = group.height / group.originHeight || 1;
    for (const text of group.members.texts) {
      const localTop = (text.y - group.originY) * scaleY;
      const localH = estimateTextHeight({
        content: text.content,
        fontSize: text.fontSize * Math.min(scaleX, scaleY),
        width: text.width * scaleX,
        fontFamily: text.fontFamily,
        fontWeight: text.fontWeight,
      });
      maxBottom = Math.max(maxBottom, localTop + localH);
    }

    if (maxBottom <= group.height + 2) return;

    const nextHeight = Math.ceil(maxBottom);
    const nextOriginHeight = nextHeight / scaleY;
    if (
      Math.abs(nextHeight - group.height) < 1 &&
      Math.abs(nextOriginHeight - group.originHeight) < 1
    ) {
      return;
    }

    updateGroup(group.id, {
      height: nextHeight,
      // Preserve current scale so members don't jump when the box grows
      originHeight: nextOriginHeight,
    });
  }, [
    group.id,
    group.height,
    group.originHeight,
    group.originWidth,
    group.originY,
    group.width,
    group.members,
    isDragging,
    updateGroup,
  ]);

  // ── Resize ────────────────────────────────────────────────────────────────
  const { start: startResize } = useResize(
    zoom,
    (handle, snap, dx, dy) => {
      if (group.isLocked) return;
      let { x, y, w, h } = snap;
      if (handle === 'nw' || handle === 'w' || handle === 'sw') {
        const nw = Math.max(MIN_SIZE, Math.min(MAX_SIZE, w - dx)); x = snap.x + (w - nw); w = nw;
      }
      if (handle === 'ne' || handle === 'e' || handle === 'se') {
        w = Math.max(MIN_SIZE, Math.min(MAX_SIZE, w + dx));
      }
      if (handle === 'nw' || handle === 'n' || handle === 'ne') {
        const nh = Math.max(MIN_SIZE, Math.min(MAX_SIZE, h - dy)); y = snap.y + (h - nh); h = nh;
      }
      if (handle === 'sw' || handle === 's' || handle === 'se') {
        h = Math.max(MIN_SIZE, Math.min(MAX_SIZE, h + dy));
      }
      queue({ x, y, width: w, height: h });
    },
    startUpdateBatch,
    () => { flush(); endUpdateBatch(); onTransformEnd?.(); },
  );

  // ── Keyboard delete ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSelected) return;
    const handler = (e: KeyboardEvent) => {
      if (isTypingIntoField(e)) return;
      if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); onDelete(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSelected, onDelete]);

  const { animStyle, animKey } = useLayerElementAnimation(group.id);
  const snapBase = { x: group.x, y: group.y, w: group.width, h: group.height };

  return (
    <div
      key={`${group.id}-${animKey ?? 'idle'}`}
      data-canvas-element
      className={`absolute select-none ${poppins.variable}`}
      style={{
        left: group.x,
        top: group.y,
        width: group.width,
        height: group.height,
        zIndex: isSelected ? 200010 + (group.zIndex ?? 1) : (group.zIndex ?? 1),
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        touchAction: 'none',
        userSelect: 'none',
        boxSizing: 'border-box',
        ...animStyle,
      }}
      onMouseDown={e => {
        if (group.isLocked) return;
        e.stopPropagation();
        onSelect();
        startDrag(e, group.x, group.y);
      }}
      onClick={e => { e.stopPropagation(); onSelect(); }}
    >
      {/* The originals are removed from their element contexts when grouped.
          Keep a visual copy here so the group behaves like a real compound
          object instead of collapsing to an empty rectangle. */}
      <GroupPreview group={group} previewRef={previewRef} />

      {/* Transparent selection boundary; it must not obscure the group preview. */}
      <div
        data-no-export="true"
        aria-label="Group"
        style={{
          position: 'absolute',
          inset: 0,
          border: isSelected ? '2px solid rgba(99,102,241,0.9)' : '2px dashed rgba(99,102,241,0.55)',
          borderRadius: 4,
          background: 'transparent',
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }}
      />

      {isSelected && (
        <>
          {/* Ungroup toolbar pill */}
          <UngroupToolbar
            zoom={zoom}
            onUngroup={onUngroup}
            onDelete={onDelete}
            isLocked={group.isLocked}
            onLockToggle={() => updateGroup(group.id, { isLocked: !group.isLocked })}
          />

          {/* Corner handles - only show when not locked */}
          {!group.isLocked && (
            <>
              <Handle cursor="nwse-resize" style={{ left: -HALF, top: -HALF }}
                onMouseDown={e => startResize(e, 'nw', snapBase)} 
                dataNoExport={true} />
              <Handle cursor="nesw-resize" style={{ right: -HALF, top: -HALF }}
                onMouseDown={e => startResize(e, 'ne', snapBase)} 
                dataNoExport={true} />
              <Handle cursor="nwse-resize" style={{ right: -HALF, bottom: -HALF }}
                onMouseDown={e => startResize(e, 'se', snapBase)} 
                dataNoExport={true} />
              <Handle cursor="nesw-resize" style={{ left: -HALF, bottom: -HALF }}
                onMouseDown={e => startResize(e, 'sw', snapBase)} 
                dataNoExport={true} />

              {/* Edge handles */}
              <Handle cursor="ns-resize" style={{ left: '50%', top: -HALF, transform: 'translateX(-50%)' }}
                onMouseDown={e => startResize(e, 'n', snapBase)} 
                dataNoExport={true} />
              <Handle cursor="ns-resize" style={{ left: '50%', bottom: -HALF, transform: 'translateX(-50%)' }}
                onMouseDown={e => startResize(e, 's', snapBase)} 
                dataNoExport={true} />
              <Handle cursor="ew-resize" style={{ left: -HALF, top: '50%', transform: 'translateY(-50%)' }}
                onMouseDown={e => startResize(e, 'w', snapBase)} 
                dataNoExport={true} />
              <Handle cursor="ew-resize" style={{ right: -HALF, top: '50%', transform: 'translateY(-50%)' }}
                onMouseDown={e => startResize(e, 'e', snapBase)} 
                dataNoExport={true} />
            </>
          )}
        </>
      )}
    </div>
  );
}

function GroupPreview({
  group,
  previewRef,
}: {
  group: GroupElement;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const scaleX = group.width / group.originWidth;
  const scaleY = group.height / group.originHeight;

  return (
    <div
      ref={previewRef}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      {group.members.texts.map(text => (
        <div
          key={text.id}
          style={{
            position: 'absolute',
            left: (text.x - group.originX) * scaleX,
            top: (text.y - group.originY) * scaleY,
            width: text.width * scaleX,
            fontSize: text.fontSize * Math.min(scaleX, scaleY),
            fontFamily: text.fontFamily || 'var(--font-poppins)',
            color: text.color ?? '#000000',
            fontWeight: text.fontWeight ?? 400,
            fontStyle: text.fontStyle || 'normal',
            textDecoration: text.textDecoration || 'none',
            textAlign: text.textAlign && text.textAlign !== 'none' ? text.textAlign : 'left',
            lineHeight: 1.2,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: contentToHtml(text.content || 'Add text') }}
        />
      ))}

      {group.members.dividers.map(divider => (
        <div
          key={divider.id}
          style={{
            position: 'absolute',
            left: (divider.x - group.originX) * scaleX,
            top: (divider.y - group.originY) * scaleY,
            width: divider.width * scaleX,
            height: Math.max(1, (divider.thickness ?? 2) * scaleY),
            backgroundColor: divider.color ?? '#000000',
          }}
        />
      ))}

      {group.members.icons.map(icon => {
        const width = (icon.width ?? icon.size) * scaleX;
        const height = (icon.height ?? icon.size) * scaleY;
        const style: React.CSSProperties = {
          position: 'absolute',
          left: (icon.x - group.originX) * scaleX,
          top: (icon.y - group.originY) * scaleY,
          width,
          height,
        };

        if (icon.isShape) {
          const borderRadius = icon.cornerRadius === undefined
            ? (icon.shapeKind === 'circle' ? '50%' : '0%')
            : `${icon.cornerRadius / 2}%`;
          return (
            <div key={icon.id} style={style}>
              {icon.isFrame ? (
                <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#f5f5f6', border: icon.frameImage ? `${icon.borderWidth ?? 0}px solid ${icon.borderColor ?? '#ffffff'}` : '2px dashed #626370', boxSizing: 'border-box', borderRadius }}>
                  {icon.frameImage && (
                    // eslint-disable-next-line @next/next/no-img-element -- grouped frames can use local data URLs.
                    <img src={icon.frameImage} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
                  )}
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%', backgroundColor: icon.color ?? '#000000', border: `${icon.borderWidth ?? 0}px solid ${icon.borderColor ?? '#ffffff'}`, boxSizing: 'border-box', borderRadius, transform: flipToTransform((icon.flip ?? 0) as FlipState), transformOrigin: 'center' }} />
              )}
            </div>
          );
        }

        if (icon.svgUrl.startsWith('data:image/')) {
          // eslint-disable-next-line @next/next/no-img-element -- grouped images can use local data URLs.
          return <img key={icon.id} src={icon.svgUrl} alt="" draggable={false} style={{ ...style, display: 'block', objectFit: 'cover', transform: flipToTransform((icon.flip ?? 0) as FlipState), transformOrigin: 'center' }} />;
        }

        return (
          <div key={icon.id} style={style}>
            <IconColorOverlay
              svgUrl={icon.svgUrl}
              color={icon.color ?? '#000000'}
              size={icon.size * Math.min(scaleX, scaleY)}
              width={width}
              height={height}
              flipTransform={flipToTransform((icon.flip ?? 0) as FlipState)}
            />
          </div>
        );
      })}

      {group.members.strokes.map(stroke => (
        <div
          key={stroke.id}
          style={{
            position: 'absolute',
            left: (stroke.x - group.originX) * scaleX,
            top: (stroke.y - group.originY) * scaleY,
            width: stroke.width * scaleX,
            height: stroke.height * scaleY,
          }}
        >
          <PenStrokeGraphic stroke={stroke} />
        </div>
      ))}
    </div>
  );
}

// ─── Ungroup toolbar ──────────────────────────────────────────────────────────

function UngroupToolbar({
  zoom,
  onUngroup,
  onDelete,
  isLocked = false,
  onLockToggle,
}: {
  zoom: number;
  onUngroup: () => void;
  onDelete: () => void;
  isLocked?: boolean;
  onLockToggle: () => void;
}) {
  const TOOLBAR_H = 48;
  const GAP = 12;

  const stopAll = (e: React.SyntheticEvent) => { e.stopPropagation(); };

  return (
    <div
      data-no-export="true"
      className="pointer-events-auto absolute"
      style={{
        left: '50%',
        top: -(TOOLBAR_H + GAP),
        transform: 'translateX(-50%)',
        zIndex: 200020,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
      onMouseDown={stopAll}
      onPointerDown={stopAll}
      onClick={stopAll}
    >
      <div
        className={`flex items-center gap-1 ${poppins.variable}`}
        style={{
          height: TOOLBAR_H,
          background: 'rgba(30, 32, 38, 0.94)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
          borderRadius: 999,
          padding: '0 10px',
          transform: `scale(${1 / zoom})`,
          transformOrigin: 'center bottom',
        }}
      >
        {/* Ungroup button */}
        <PillButton
          onClick={onUngroup}
          color="#ffffff"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          }
          label="Ungroup"
        />

        <ToolDivider />

        {/* Delete button */}
        <PillButton
          onClick={onDelete}
          color="rgba(255,120,120,1)"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          label="Delete"
        />

        <ToolDivider />

        {/* Lock button */}
        <PillButton
          onClick={onLockToggle}
          color="#ffffff"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
          label={isLocked ? 'Unlock' : 'Lock'}
        />
      </div>
    </div>
  );
}

function ToolDivider() {
  return <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)', marginInline: 4, flexShrink: 0 }} />;
}

function PillButton({ onClick, color, icon, label }: {
  onClick: () => void;
  color: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full px-3 transition-all duration-150 active:scale-95"
      style={{
        height: 34,
        background: 'transparent',
        border: 'none',
        color,
        fontFamily: 'var(--font-poppins)',
        fontWeight: 700,
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
