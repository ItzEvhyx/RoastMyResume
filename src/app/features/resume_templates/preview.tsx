'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { IconElement } from '@/app/features/canvas_page/context/IconContext';
import type { TextElement } from '@/app/features/canvas_page/context/TextContext';
import type { DividerElement } from '@/app/features/canvas_page/context/DividerContext';
import { isRasterImageUrl } from '@/app/features/canvas_page/utils/paste.image';
import { materializeSeedForPreview } from './build';
import { getLocalSeed } from './seeds';
import { CANVAS_W, CANVAS_H } from './types';

/**
 * Scaled live preview of a template seed — renders the exact elements the
 * canvas will load, scaled to fully fit the card (no cropping).
 */
export function TemplatePreview({
  templateId,
  blank,
}: {
  templateId: string;
  blank?: boolean;
}) {
  const payload = useMemo(() => {
    if (blank || templateId === 'blank') return null;
    const seed = getLocalSeed(templateId);
    if (!seed) return null;
    return materializeSeedForPreview(seed, templateId);
  }, [templateId, blank]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / CANVAS_W);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!payload) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-2 text-neutral-300/60">
          <div className="h-8 w-8 rounded border-2 border-dashed border-neutral-300/40" />
          <span className="text-[9px] uppercase tracking-widest">Blank</span>
        </div>
      </div>
    );
  }

  const layers = [
    ...payload.iconElements.map((el) => ({ kind: 'icon' as const, el, z: el.zIndex ?? 0 })),
    ...payload.dividerElements.map((el) => ({ kind: 'divider' as const, el, z: el.zIndex ?? 1 })),
    ...payload.textElements.map((el) => ({ kind: 'text' as const, el, z: el.zIndex ?? 2 })),
  ].sort((a, b) => a.z - b.z);

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 overflow-hidden bg-white"
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
          pointerEvents: 'none',
          visibility: scale > 0 ? 'visible' : 'hidden',
        }}
      >
        {layers.map((layer) => {
          if (layer.kind === 'icon') {
            return <PreviewIcon key={layer.el.id} element={layer.el} />;
          }
          if (layer.kind === 'divider') {
            return <PreviewDivider key={layer.el.id} element={layer.el} />;
          }
          return <PreviewText key={layer.el.id} element={layer.el} />;
        })}
      </div>
    </div>
  );
}

function PreviewIcon({ element }: { element: IconElement }) {
  const w = element.width ?? element.size;
  const h = element.height ?? element.size;
  const radius =
    element.cornerRadius === undefined
      ? element.shapeKind === 'circle'
        ? '50%'
        : '0%'
      : `${element.cornerRadius / 2}%`;

  if (element.isShape) {
    return (
      <div
        style={{
          position: 'absolute',
          left: element.x,
          top: element.y,
          width: w,
          height: h,
          background: element.isFrame ? '#e5e7eb' : (element.color ?? '#111'),
          borderRadius: radius,
          boxSizing: 'border-box',
        }}
      />
    );
  }

  if (isRasterImageUrl(element.svgUrl)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={element.svgUrl}
        alt=""
        style={{
          position: 'absolute',
          left: element.x,
          top: element.y,
          width: w,
          height: h,
          objectFit: 'cover',
        }}
      />
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: w,
        height: h,
        backgroundColor: element.color ?? '#111',
        WebkitMaskImage: `url("${element.svgUrl}")`,
        maskImage: `url("${element.svgUrl}")`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  );
}

function PreviewDivider({ element }: { element: DividerElement }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.thickness ?? 1,
        background: element.color ?? '#cbd5e1',
      }}
    />
  );
}

function PreviewText({ element }: { element: TextElement }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        fontSize: element.fontSize,
        fontFamily: element.fontFamily ?? 'Arial, sans-serif',
        fontWeight: element.fontWeight ?? 400,
        fontStyle: element.fontStyle ?? 'normal',
        textDecoration: element.textDecoration ?? 'none',
        color: element.color ?? '#111',
        textAlign:
          element.textAlign && element.textAlign !== 'none'
            ? element.textAlign
            : 'left',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.25,
      }}
    >
      {element.content}
    </div>
  );
}
