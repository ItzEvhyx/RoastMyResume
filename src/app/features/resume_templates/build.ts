import type {
  TextElement,
} from '@/app/features/canvas_page/context/TextContext';
import type { IconElement } from '@/app/features/canvas_page/context/IconContext';
import type { DividerElement } from '@/app/features/canvas_page/context/DividerContext';
import type {
  TemplateCanvasPayload,
  TemplateSeedElements,
} from './types';
import { CANVAS_W, CANVAS_H } from './types';

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Build a hydrated canvas payload with fresh element IDs (user copy). */
export function materializeSeed(
  seed: TemplateSeedElements,
): TemplateCanvasPayload {
  return {
    textElements: seed.texts.map((el) => ({ ...el, id: uid('text') })),
    iconElements: seed.icons.map((el) => ({ ...el, id: uid('icon') })),
    dividerElements: seed.dividers.map((el) => ({ ...el, id: uid('divider') })),
    penStrokes: (seed.pens ?? []).map((el) => ({ ...el, id: uid('stroke') })),
    groupElements: (seed.groups ?? []).map((el) => ({ ...el, id: uid('group') })),
  };
}

export function emptyCanvasPayload(): TemplateCanvasPayload {
  return {
    textElements: [],
    iconElements: [],
    dividerElements: [],
    penStrokes: [],
    groupElements: [],
  };
}

/** Stable IDs for preview rendering only (not written to user canvas). */
export function materializeSeedForPreview(
  seed: TemplateSeedElements,
  templateId: string,
): TemplateCanvasPayload {
  let n = 0;
  const id = (prefix: string) => `${templateId}-${prefix}-${n++}`;
  return {
    textElements: seed.texts.map((el) => ({ ...el, id: id('t') })),
    iconElements: seed.icons.map((el) => ({ ...el, id: id('i') })),
    dividerElements: seed.dividers.map((el) => ({ ...el, id: id('d') })),
    penStrokes: (seed.pens ?? []).map((el) => ({ ...el, id: id('p') })),
    groupElements: (seed.groups ?? []).map((el) => ({ ...el, id: id('g') })),
  };
}

export function text(
  partial: Omit<TextElement, 'id' | 'fontFamily'> & { fontFamily?: string },
): Omit<TextElement, 'id'> {
  return {
    fontFamily: 'Arial, sans-serif',
    color: '#111111',
    fontWeight: 400,
    listType: 'none',
    textAlign: 'left',
    ...partial,
  };
}

export function shape(
  partial: Omit<IconElement, 'id' | 'svgUrl' | 'size' | 'isShape'> & {
    svgUrl?: string;
    size?: number;
  },
): Omit<IconElement, 'id'> {
  const kind = partial.shapeKind ?? 'square';
  const width = partial.width ?? partial.size ?? 100;
  const height = partial.height ?? partial.size ?? width;
  return {
    ...partial,
    size: partial.size ?? width,
    width,
    height,
    isShape: true,
    shapeKind: kind,
    cornerRadius:
      kind === 'circle' ? undefined : (partial.cornerRadius ?? 0),
    svgUrl:
      partial.svgUrl ??
      (kind === 'circle'
        ? '/assets/tools_icons/circle_shape.svg'
        : '/assets/tools_icons/square_shape.svg'),
    color: partial.color ?? '#1e293b',
  };
}

export function frame(
  partial: Omit<IconElement, 'id' | 'svgUrl' | 'isShape' | 'isFrame'> & {
    size?: number;
  },
): Omit<IconElement, 'id'> {
  const size = partial.size ?? partial.width ?? 96;
  return {
    ...partial,
    size,
    width: partial.width ?? size,
    height: partial.height ?? size,
    isShape: true,
    isFrame: true,
    shapeKind: partial.shapeKind ?? 'circle',
    cornerRadius: partial.shapeKind === 'square' ? 8 : undefined,
    svgUrl: '/assets/tools_icons/circle_shape.svg',
    color: partial.color ?? '#e5e7eb',
    borderWidth: partial.borderWidth ?? 0,
  };
}

export function icon(
  partial: Omit<IconElement, 'id' | 'isShape' | 'svgUrl'> & {
    svgUrl?: string;
    iconify?: string;
  },
): Omit<IconElement, 'id'> {
  const iconify = partial.iconify ?? 'mdi:circle-outline';
  const [prefix, name] = iconify.split(':');
  const { iconify: _drop, ...rest } = partial;
  return {
    color: '#111111',
    ...rest,
    size: partial.size ?? 22,
    svgUrl:
      partial.svgUrl ||
      `https://api.iconify.design/${prefix}/${name}.svg`,
  };
}

export function divider(
  partial: Omit<DividerElement, 'id'>,
): Omit<DividerElement, 'id'> {
  return {
    thickness: 1,
    color: '#cbd5e1',
    ...partial,
  };
}

export { CANVAS_W, CANVAS_H };
