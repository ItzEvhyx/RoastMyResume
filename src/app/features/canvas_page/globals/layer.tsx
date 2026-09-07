'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import { useMediaQuery } from '@/lib/use_media_query';
import { useText } from '../context/TextContext';
import { useDivider } from '../context/DividerContext';
import { useIcon, type IconElement } from '../context/IconContext';
import { usePen } from '../context/PenContext';
import { useGroup } from '../context/GroupContext';

const FUTURA_STYLE = `
  @font-face {
    font-family: 'FuturaDisplay';
    src: url('/assets/fonts/futura_display/Futura Display.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
`;

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const glassStyle: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.55)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
};

type LayerKind = 'text' | 'divider' | 'icon' | 'stroke' | 'group';

interface LayerItem {
  id: string;
  kind: LayerKind;
  label: string;
  detail: string;
  zIndex: number;
  icon?: IconElement;
}

const DEFAULT_TEXT = 'Add text';

function isUntouchedText(content: string) {
  return content.trim() === DEFAULT_TEXT;
}

function abbreviateText(content: string) {
  const singleLineText = content.replace(/\s+/g, ' ').trim();
  return singleLineText.length > 7 ? `${singleLineText.slice(0, 7)}....` : singleLineText;
}

function isRasterImage(icon: IconElement) {
  return /^data:image\//i.test(icon.svgUrl) || /\.(?:png|jpe?g|webp)(?:[?#]|$)/i.test(icon.svgUrl);
}

function iconLabel(svgUrl: string) {
  try {
    const filename = new URL(svgUrl).pathname.split('/').pop()?.replace(/\.svg$/i, '');
    if (!filename) return 'Icon';

    const knownNames: Record<string, string> = {
      linkedin: 'LinkedIn',
      github: 'GitHub',
      youtube: 'YouTube',
      whatsapp: 'WhatsApp',
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      nodejs: 'Node.js',
    };
    return filename
      .split('-')
      .map(word => knownNames[word.toLowerCase()] ?? `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
      .join(' ');
  } catch {
    return 'Icon';
  }
}

function LayerGlyph({ layer }: { layer: LayerItem }) {
  const { kind, icon } = layer;
  if (kind === 'text') return <span aria-hidden style={{ fontSize: 20, fontWeight: 700 }}>T</span>;
  if (kind === 'divider') return <span aria-hidden style={{ display: 'block', width: 20, height: 2, background: 'currentColor', borderRadius: 99 }} />;
  if (kind === 'stroke') return <span aria-hidden style={{ fontSize: 23, lineHeight: 1, transform: 'rotate(-28deg)' }}>〰</span>;
  if (kind === 'group') {
    return (
      <svg aria-hidden width="21" height="21" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (icon?.isShape) {
    const borderRadius = icon.cornerRadius === undefined
      ? (icon.shapeKind === 'circle' ? '50%' : '0%')
      : `${icon.cornerRadius / 2}%`;

    if (icon.isFrame && icon.frameImage) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon.frameImage} alt="" aria-hidden draggable={false} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius }} />
      );
    }

    return <span aria-hidden style={{ width: 25, height: 25, boxSizing: 'border-box', borderRadius, background: icon.isFrame ? '#f5f5f6' : (icon.color ?? '#000000'), border: `${icon.borderWidth ?? (icon.isFrame ? 1 : 0)}px ${icon.isFrame ? 'dashed' : 'solid'} ${icon.borderColor ?? '#626370'}` }} />;
  }

  if (icon && isRasterImage(icon)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={icon.svgUrl} alt="" aria-hidden draggable={false} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4 }} />
    );
  }

  if (icon) {
    return <span aria-hidden style={{ width: 25, height: 25, backgroundColor: icon.color ?? '#000000', WebkitMaskImage: `url(${icon.svgUrl})`, maskImage: `url(${icon.svgUrl})`, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskPosition: 'center', maskPosition: 'center', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat' }} />;
  }

  return (
    <svg aria-hidden width="21" height="21" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

import { useLayerOrder } from './layer.order';

/** Layer browser opened from the Layers control in the canvas sidebar. */
export default function LayersPanel() {
  const { toolbarExpanded, activeTool, textElements, selectedId, setSelectedId, updateElement } = useText();
  const { dividerElements, selectedDividerId, setSelectedDividerId, updateDivider } = useDivider();
  const { iconElements, selectedIconId, setSelectedIconId, updateIcon } = useIcon();
  const { strokes, selectedStrokeId, setSelectedStrokeId, updateStroke } = usePen();
  const { groupElements, selectedGroupId, setSelectedGroupId, updateGroup } = useGroup();
  const { setHoldingLayerId, triggerLayerAnimation, activeAnimation } = useLayerOrder();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const shouldShow = toolbarExpanded && activeTool === 'layers';
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // This order mirrors paint order on the canvas. Reverse it so the front-most
  // item appears first, as users expect from a layers browser.
  const layers: LayerItem[] = [
    ...textElements.map((item, index) => {
      const untouched = isUntouchedText(item.content);
      const untouchedTextCount = textElements
        .slice(0, index + 1)
        .filter(element => isUntouchedText(element.content)).length;
      return {
        id: item.id,
        kind: 'text' as const,
        label: untouched ? `add text ${untouchedTextCount}` : abbreviateText(item.content) || 'Text',
        detail: 'Text',
        zIndex: item.zIndex ?? 1,
      };
    }),
    ...dividerElements.map((item, index) => {
      return {
        id: item.id,
        kind: 'divider' as const,
        label: `divider ${index + 1}`,
        detail: 'Line',
        zIndex: item.zIndex ?? 1,
      };
    }),
    ...iconElements.map((item, index) => {
      const image = isRasterImage(item) || Boolean(item.isFrame && item.frameImage);
      const imageCount = iconElements
        .slice(0, index + 1)
        .filter(icon => isRasterImage(icon) || Boolean(icon.isFrame && icon.frameImage)).length;
      return {
        id: item.id,
        kind: 'icon' as const,
        label: image ? `image ${imageCount}` : item.isFrame ? 'Image frame' : item.isShape ? `${item.shapeKind === 'circle' ? 'Circle' : 'Square'} shape` : iconLabel(item.svgUrl),
        detail: image ? 'Image' : item.isShape ? 'Shape' : 'Icon',
        zIndex: item.zIndex ?? 1,
        icon: item,
      };
    }),
    ...strokes.map((item, index) => ({
      id: item.id,
      kind: 'stroke' as const,
      label: `drawing ${index + 1}`,
      detail: 'Pen',
      zIndex: item.zIndex ?? 1,
    })),
    ...groupElements.map(item => ({
      id: item.id,
      kind: 'group' as const,
      label: 'Group',
      detail: `${item.members.texts.length + item.members.dividers.length + item.members.icons.length + item.members.strokes.length} items`,
      zIndex: item.zIndex ?? 1,
    })),
  ].sort((a, b) => b.zIndex - a.zIndex);

  const isSelected = (layer: LayerItem) => (
    (layer.kind === 'text' && selectedId === layer.id) ||
    (layer.kind === 'divider' && selectedDividerId === layer.id) ||
    (layer.kind === 'icon' && selectedIconId === layer.id) ||
    (layer.kind === 'stroke' && selectedStrokeId === layer.id) ||
    (layer.kind === 'group' && selectedGroupId === layer.id)
  );

  const selectLayer = (layer: LayerItem) => {
    setSelectedId(layer.kind === 'text' ? layer.id : null);
    setSelectedDividerId(layer.kind === 'divider' ? layer.id : null);
    setSelectedIconId(layer.kind === 'icon' ? layer.id : null);
    setSelectedStrokeId(layer.kind === 'stroke' ? layer.id : null);
    setSelectedGroupId(layer.kind === 'group' ? layer.id : null);
  };

  const applyOrder = (orderedLayers: LayerItem[]) => {
    const topZIndex = orderedLayers.length;
    orderedLayers.forEach((layer, index) => {
      const zIndex = topZIndex - index;
      if (layer.kind === 'text') updateElement(layer.id, { zIndex });
      if (layer.kind === 'divider') updateDivider(layer.id, { zIndex });
      if (layer.kind === 'icon') updateIcon(layer.id, { zIndex });
      if (layer.kind === 'stroke') updateStroke(layer.id, { zIndex });
      if (layer.kind === 'group') updateGroup(layer.id, { zIndex });
    });
  };

  const moveLayer = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const fromIndex = layers.findIndex(layer => layer.id === draggingId);
    const targetIndex = layers.findIndex(layer => layer.id === targetId);
    if (fromIndex < 0 || targetIndex < 0) return;

    const reordered = [...layers];
    const [moving] = reordered.splice(fromIndex, 1);
    reordered.splice(targetIndex, 0, moving);

    // Moving up in the list (towards index 0) = placed ON TOP (inflate animation)
    // Moving down in the list (towards bottom) = placed BEHIND (deflate animation)
    const animType = targetIndex < fromIndex ? 'inflate' : 'deflate';
    triggerLayerAnimation(moving.id, animType);

    applyOrder(reordered);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FUTURA_STYLE }} />

      <aside
        data-mobile-tool-panel
        aria-label="Layers"
        className={`fixed z-50 flex flex-col overflow-hidden rounded-3xl ${poppins.variable}`}
        style={{
          left: isMobile ? 16 : 110,
          right: isMobile ? 16 : undefined,
          top: isMobile ? undefined : 'calc(50% - (100vh - 200px) / 2 + 40px)',
          bottom: isMobile ? 92 : undefined,
          width: isMobile ? 'auto' : 360,
          height: isMobile ? 'min(460px, calc(100dvh - 180px))' : 'calc(100vh - 200px)',
          maxHeight: isMobile ? 'calc(100dvh - 180px)' : 600,
          ...glassStyle,
          opacity: shouldShow ? 1 : 0,
          transform: shouldShow
            ? 'scale(1) translate(0, 0)'
            : (isMobile ? 'scale(0.92) translateY(16px)' : 'scale(0.85) translateX(-12px)'),
          transformOrigin: isMobile ? 'bottom center' : 'left center',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          pointerEvents: shouldShow ? 'auto' : 'none',
        }}
        onMouseDown={event => event.stopPropagation()}
        onPointerDown={event => event.stopPropagation()}
        onClick={event => event.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 pb-4 pt-4">
          <h2
            style={{
              color: '#fff',
              fontFamily: 'FuturaDisplay, sans-serif',
              fontSize: 24,
              letterSpacing: '0.01em',
              lineHeight: 1,
            }}
          >
            Layers
          </h2>
          <Image
            src="/assets/tools_icons/layer_icon.svg"
            alt="Layers"
            width={36}
            height={36}
            className="pointer-events-none select-none opacity-80"
            draggable={false}
          />
        </header>

        <div className="mx-3 h-px bg-white/30" />

        <section className="no-scrollbar flex-1 overflow-y-auto px-4 py-5">
          {layers.length === 0 ? (
            <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
              <Image src="/assets/tools_icons/layer_icon.svg" alt="" width={64} height={64} className="opacity-45" />
              <p className="mt-3 text-sm text-white/70" style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}>No layers yet</p>
              <p className="mt-1 px-5 text-xs text-white/40" style={{ fontFamily: 'var(--font-poppins)' }}>Add text, icons, or shapes to manage them here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {layers.map((layer, index) => {
                const selected = isSelected(layer);
                const isDraggingThis = draggingId === layer.id;
                const isTargetOver = dragOverId === layer.id && !isDraggingThis;
                const isAnimatingThis = activeAnimation?.id === layer.id;
                const animTypeThis = isAnimatingThis ? activeAnimation?.type : null;

                return (
                  <div
                    key={layer.id}
                    role="button"
                    tabIndex={0}
                    draggable
                    onClick={() => selectLayer(layer)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectLayer(layer);
                      }
                    }}
                    onDragStart={() => {
                      setDraggingId(layer.id);
                      setHoldingLayerId(layer.id);
                      setDragOverId(null);
                    }}
                    onDragOver={event => {
                      event.preventDefault();
                      setDragOverId(layer.id);
                    }}
                    onDrop={event => {
                      event.preventDefault();
                      moveLayer(layer.id);
                      setDraggingId(null);
                      setHoldingLayerId(null);
                      setDragOverId(null);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setHoldingLayerId(null);
                      setDragOverId(null);
                    }}
                    className="flex min-h-[76px] w-full items-center gap-4 rounded-2xl px-4 text-left select-none transition-all duration-150 hover:bg-white/15 active:scale-[0.98]"
                    style={{
                      background: isTargetOver
                        ? 'rgba(59, 130, 246, 0.25)'
                        : selected
                          ? 'rgba(255,255,255,0.17)'
                          : 'rgba(255,255,255,0.09)',
                      border: isTargetOver
                        ? '1px solid rgba(96, 165, 250, 0.85)'
                        : selected
                          ? '1px solid rgba(255,255,255,0.30)'
                          : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: isTargetOver
                        ? '0 0 14px rgba(59, 130, 246, 0.45)'
                        : isDraggingThis
                          ? 'inset 0 2px 8px rgba(0,0,0,0.5)'
                          : undefined,
                      cursor: isDraggingThis ? 'grabbing' : 'grab',
                      opacity: isDraggingThis ? 0.55 : 1,
                      transform: isDraggingThis ? 'scale(0.92)' : undefined,
                      transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease, border 0.15s ease, opacity 0.15s ease',
                      animation: isAnimatingThis && animTypeThis === 'inflate'
                        ? 'panelLayerInflate 0.52s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        : isAnimatingThis && animTypeThis === 'deflate'
                          ? 'panelLayerDeflate 0.52s cubic-bezier(0.25, 1, 0.5, 1)'
                          : undefined,
                    }}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center"
                      style={{ color: '#fff' }}
                    >
                      <LayerGlyph layer={layer} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white" style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}>
                        {layer.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-white/45" style={{ fontFamily: 'var(--font-poppins)' }}>
                        {layer.detail}
                      </span>
                    </span>

                    {/* Quick Move Up / Down controls when selected */}
                    {selected && (
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          title="Move up (place on top)"
                          disabled={index === 0}
                          onClick={() => {
                            const fromIndex = index;
                            const targetIndex = index - 1;
                            if (targetIndex >= 0) {
                              const reordered = [...layers];
                              const [moving] = reordered.splice(fromIndex, 1);
                              reordered.splice(targetIndex, 0, moving);
                              triggerLayerAnimation(moving.id, 'inflate');
                              applyOrder(reordered);
                            }
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 disabled:opacity-20 disabled:pointer-events-none transition-all"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 15l-6-6-6 6" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          title="Move down (place behind)"
                          disabled={index === layers.length - 1}
                          onClick={() => {
                            const fromIndex = index;
                            const targetIndex = index + 1;
                            if (targetIndex < layers.length) {
                              const reordered = [...layers];
                              const [moving] = reordered.splice(fromIndex, 1);
                              reordered.splice(targetIndex, 0, moving);
                              triggerLayerAnimation(moving.id, 'deflate');
                              applyOrder(reordered);
                            }
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 disabled:opacity-20 disabled:pointer-events-none transition-all"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <span className="text-lg leading-none text-white/35" aria-label="Drag to reorder">⠿</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </aside>
    </>
  );
}
