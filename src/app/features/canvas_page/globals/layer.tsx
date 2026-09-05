'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import { useMediaQuery } from '@/lib/use_media_query';
import { useText } from '../context/TextContext';
import { useDivider } from '../context/DividerContext';
import { useIcon } from '../context/IconContext';
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

type LayerKind = 'text' | 'divider' | 'icon' | 'group';

interface LayerItem {
  id: string;
  kind: LayerKind;
  label: string;
  detail: string;
  zIndex: number;
}

function LayerGlyph({ kind }: { kind: LayerKind }) {
  if (kind === 'text') return <span aria-hidden style={{ fontSize: 20, fontWeight: 700 }}>T</span>;
  if (kind === 'divider') return <span aria-hidden style={{ display: 'block', width: 20, height: 2, background: 'currentColor', borderRadius: 99 }} />;
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
  return (
    <svg aria-hidden width="21" height="21" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/** Layer browser opened from the Layers control in the canvas sidebar. */
export default function LayersPanel() {
  const { toolbarExpanded, activeTool, textElements, selectedId, setSelectedId, updateElement } = useText();
  const { dividerElements, selectedDividerId, setSelectedDividerId, updateDivider } = useDivider();
  const { iconElements, selectedIconId, setSelectedIconId, updateIcon } = useIcon();
  const { groupElements, selectedGroupId, setSelectedGroupId, updateGroup } = useGroup();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const shouldShow = toolbarExpanded && activeTool === 'layers';
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // This order mirrors paint order on the canvas. Reverse it so the front-most
  // item appears first, as users expect from a layers browser.
  const layers: LayerItem[] = [
    ...textElements.map(item => ({
      id: item.id,
      kind: 'text' as const,
      label: item.content.trim().split('\n')[0] || 'Text',
      detail: 'Text',
      zIndex: item.zIndex ?? 1,
    })),
    ...dividerElements.map(item => ({
      id: item.id,
      kind: 'divider' as const,
      label: 'Divider',
      detail: 'Line',
      zIndex: item.zIndex ?? 1,
    })),
    ...iconElements.map(item => ({
      id: item.id,
      kind: 'icon' as const,
      label: item.isFrame ? 'Image frame' : item.isShape ? `${item.shapeKind === 'circle' ? 'Circle' : 'Square'} shape` : 'Icon',
      detail: item.isShape ? 'Shape' : 'Icon',
      zIndex: item.zIndex ?? 1,
    })),
    ...groupElements.map(item => ({
      id: item.id,
      kind: 'group' as const,
      label: 'Group',
      detail: `${item.members.texts.length + item.members.dividers.length + item.members.icons.length} items`,
      zIndex: item.zIndex ?? 1,
    })),
  ].sort((a, b) => b.zIndex - a.zIndex);

  const isSelected = (layer: LayerItem) => (
    (layer.kind === 'text' && selectedId === layer.id) ||
    (layer.kind === 'divider' && selectedDividerId === layer.id) ||
    (layer.kind === 'icon' && selectedIconId === layer.id) ||
    (layer.kind === 'group' && selectedGroupId === layer.id)
  );

  const selectLayer = (layer: LayerItem) => {
    setSelectedId(layer.kind === 'text' ? layer.id : null);
    setSelectedDividerId(layer.kind === 'divider' ? layer.id : null);
    setSelectedIconId(layer.kind === 'icon' ? layer.id : null);
    setSelectedGroupId(layer.kind === 'group' ? layer.id : null);
  };

  const applyOrder = (orderedLayers: LayerItem[]) => {
    const topZIndex = orderedLayers.length;
    orderedLayers.forEach((layer, index) => {
      const zIndex = topZIndex - index;
      if (layer.kind === 'text') updateElement(layer.id, { zIndex });
      if (layer.kind === 'divider') updateDivider(layer.id, { zIndex });
      if (layer.kind === 'icon') updateIcon(layer.id, { zIndex });
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
            width={52}
            height={52}
            className="pointer-events-none select-none opacity-80"
            draggable={false}
          />
        </header>

        <div className="mx-3 h-px bg-white/30" />

        <section className="no-scrollbar flex-1 overflow-y-auto px-4 py-5">
          {layers.length === 0 ? (
            <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
              <Image src="/assets/tools_icons/layer_icon.svg" alt="" width={44} height={44} className="opacity-45" />
              <p className="mt-3 text-sm text-white/70" style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}>No layers yet</p>
              <p className="mt-1 px-5 text-xs text-white/40" style={{ fontFamily: 'var(--font-poppins)' }}>Add text, icons, or shapes to manage them here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {layers.map(layer => {
                const selected = isSelected(layer);
                return (
                  <button
                    key={layer.id}
                    type="button"
                    draggable
                    onClick={() => selectLayer(layer)}
                    onDragStart={() => { setDraggingId(layer.id); setDragOverId(null); }}
                    onDragOver={event => { event.preventDefault(); setDragOverId(layer.id); }}
                    onDrop={event => { event.preventDefault(); moveLayer(layer.id); setDraggingId(null); setDragOverId(null); }}
                    onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                    className="flex min-h-[76px] w-full items-center gap-4 rounded-2xl px-4 text-left transition-all duration-150 hover:bg-white/15 active:scale-[0.98]"
                    style={{
                      background: selected ? 'rgba(255,255,255,0.17)' : 'rgba(255,255,255,0.09)',
                      border: dragOverId === layer.id ? '1px solid rgba(255,255,255,0.65)' : selected ? '1px solid rgba(255,255,255,0.30)' : '1px solid rgba(255,255,255,0.08)',
                      cursor: draggingId === layer.id ? 'grabbing' : 'grab',
                      opacity: draggingId === layer.id ? 0.55 : 1,
                    }}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ color: '#fff', background: 'rgba(0,0,0,0.18)' }}
                    >
                      <LayerGlyph kind={layer.kind} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white" style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}>
                        {layer.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-white/45" style={{ fontFamily: 'var(--font-poppins)' }}>
                        {layer.detail}
                      </span>
                    </span>
                    <span className="text-lg leading-none text-white/35" aria-label="Drag to reorder">⠿</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </aside>
    </>
  );
}
