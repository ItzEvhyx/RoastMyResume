'use client';

import type { TextElement } from '@/app/features/canvas_page/context/TextContext';
import type { DividerElement } from '@/app/features/canvas_page/context/DividerContext';
import type { DocSectionId } from '@/app/features/canvas_page/globals/convert.document';
import { estimateTextHeight } from '@/app/features/canvas_page/canvas/safe.area';
import { text, divider, materializeSeed } from '@/app/features/resume_templates/build';
import {
  CANVAS_H,
  CANVAS_W,
  SAFE,
  type TemplateCanvasPayload,
} from '@/app/features/resume_templates/types';
import type {
  ExtractedResume,
  ImportedEntry,
  ImportedSection,
  ImportedSectionKind,
  ImportedTextStyle,
} from './types';

type Text = Omit<TextElement, 'id'>;
type Divider = Omit<DividerElement, 'id'>;

const W = CANVAS_W - SAFE * 2;
const COLUMN_GAP = 28;
const BULLET_INDENT = 16;
/** Largest scale that fits wins, so short resumes fill the page like the original. */
const MAX_SCALE = 1.3;
const MIN_SCALE = 0.72;
const RULE = '#9aa3b0';

const DOC_SECTION: Record<ImportedSectionKind, DocSectionId> = {
  summary: 'summary',
  experience: 'experience',
  projects: 'additional',
  education: 'education',
  skills: 'skills',
  certifications: 'certifications',
  other: 'additional',
};

const GLYPH = { dot: '• ', dash: '- ', none: '' } as const;

let measureCtx: CanvasRenderingContext2D | null | undefined;

function measureWidth(
  content: string,
  fontSize: number,
  fontFamily: string,
  fontWeight: number,
  italic: boolean,
): number {
  if (measureCtx === undefined && typeof document !== 'undefined') {
    measureCtx = document.createElement('canvas').getContext('2d');
  }
  if (!measureCtx) return content.length * fontSize * 0.55;
  measureCtx.font = `${italic ? 'italic ' : ''}${fontWeight} ${fontSize}px ${fontFamily}`;
  return measureCtx.measureText(content).width;
}

function styleProps(style: ImportedTextStyle | undefined): Pick<Text, 'fontWeight' | 'fontStyle'> {
  return {
    fontWeight: style === 'bold' || style === 'bold-italic' ? 700 : 400,
    fontStyle: style === 'italic' || style === 'bold-italic' ? 'italic' : 'normal',
  };
}

interface LayoutResult {
  texts: Text[];
  dividers: Divider[];
  bottom: number;
}

function layout(resume: ExtractedResume, s: number): LayoutResult {
  const texts: Text[] = [];
  const dividers: Divider[] = [];
  const { style } = resume;
  const font = style.fontFamily;
  const ink = style.textColor ?? '#111111';
  const accent = style.accentColor ?? ink;
  const fs = (n: number) => Math.round(n * s * 10) / 10;
  const gap = (n: number) => Math.round(n * s);

  const entryCounters = new Map<DocSectionId, number>();
  const usedHeadings = new Set<DocSectionId>();
  const nextIndex = (sec: DocSectionId) => {
    const i = entryCounters.get(sec) ?? 0;
    entryCounters.set(sec, i + 1);
    return i;
  };

  const make = (partial: Omit<Text, 'fontFamily'>): Text =>
    text({ fontFamily: font, color: ink, ...partial });

  const heightOf = (el: Text) => Math.ceil(estimateTextHeight(el));

  /** Push a text and return its bottom edge. */
  const put = (el: Text) => {
    texts.push(el);
    return el.y + heightOf(el);
  };

  /** Left text + optional right-aligned text sharing one row. */
  const row = (
    x: number,
    width: number,
    y: number,
    left: { content: string; docField?: string; style?: ImportedTextStyle; size: number } | null,
    right: { content: string; docField?: string; style?: ImportedTextStyle; size: number } | null,
  ): number => {
    let bottom = y;
    let rightW = 0;
    if (right) {
      const props = styleProps(right.style);
      const measured = measureWidth(
        right.content,
        right.size,
        font,
        props.fontWeight ?? 400,
        props.fontStyle === 'italic',
      );
      rightW = Math.min(width * 0.6, Math.ceil(measured) + 6);
      bottom = Math.max(
        bottom,
        put(
          make({
            content: right.content,
            x: x + width - rightW,
            y,
            width: rightW,
            fontSize: right.size,
            ...props,
            textAlign: 'right',
            textCategory: 'meta',
            docField: right.docField,
          }),
        ),
      );
    }
    if (left) {
      bottom = Math.max(
        bottom,
        put(
          make({
            content: left.content,
            x,
            y,
            width: right ? width - rightW - 10 : width,
            fontSize: left.size,
            ...styleProps(left.style),
            textCategory: 'body',
            docField: left.docField,
          }),
        ),
      );
    }
    return bottom;
  };

  const layoutEntry = (
    entry: ImportedEntry,
    kind: ImportedSectionKind,
    sec: DocSectionId,
    x: number,
    width: number,
    startY: number,
  ): number => {
    const i = nextIndex(sec);
    const edu = kind === 'education';
    const roles = {
      title: edu ? 'degree' : 'title',
      titleRight: kind === 'projects' ? 'tech' : 'dates',
      subtitle: edu ? 'school' : 'company',
      subtitleRight: 'location',
    };
    const key = (role: string) => `${sec}.${i}.${role}`;
    let y = startY;

    if (entry.title || entry.titleRight) {
      y =
        row(
          x,
          width,
          y,
          entry.title
            ? { content: entry.title, docField: key(roles.title), style: 'bold', size: fs(11.5) }
            : null,
          entry.titleRight
            ? {
                content: entry.titleRight,
                docField: key(roles.titleRight),
                style: entry.titleRightStyle,
                size: fs(11),
              }
            : null,
        ) + gap(1);
    }
    if (entry.subtitle || entry.subtitleRight) {
      y =
        row(
          x,
          width,
          y,
          entry.subtitle
            ? {
                content: entry.subtitle,
                docField: key(roles.subtitle),
                style: entry.subtitleStyle,
                size: fs(11),
              }
            : null,
          entry.subtitleRight
            ? {
                content: entry.subtitleRight,
                docField: key(roles.subtitleRight),
                style: 'plain',
                size: fs(11),
              }
            : null,
        ) + gap(1);
    }
    if (entry.description) {
      y =
        put(
          make({
            content: entry.description,
            x,
            y,
            width,
            fontSize: fs(11),
            fontStyle: entry.descriptionItalic ? 'italic' : 'normal',
            textCategory: 'body',
            docField: key('meta'),
          }),
        ) + gap(2);
    }
    if (entry.bullets.length) {
      const glyph = GLYPH[entry.bulletGlyph ?? 'dot'];
      const indent = glyph ? BULLET_INDENT : 0;
      y =
        put(
          make({
            content: entry.bullets.map((b) => `${glyph}${b}`).join('\n'),
            x: x + indent,
            y,
            width: width - indent,
            fontSize: fs(11),
            fontStyle: entry.bulletsItalic ? 'italic' : 'normal',
            textCategory: 'body',
            docField: key('bullets'),
          }),
        ) + gap(2);
    }
    return y;
  };

  const layoutSection = (section: ImportedSection, x: number, width: number, startY: number): number => {
    const sec = DOC_SECTION[section.kind];
    let y = startY;

    if (style.headingRule === 'above') {
      dividers.push(divider({ x, y, width, thickness: 1, color: RULE }));
      y += gap(8);
    }
    const headingKey = usedHeadings.has(sec) ? undefined : `${sec}.heading`;
    usedHeadings.add(sec);
    y = put(
      make({
        content: style.headingCase === 'upper' ? section.heading.toUpperCase() : section.heading,
        x,
        y,
        width,
        fontSize: fs(12.5),
        fontWeight: 700,
        fontStyle: section.headingItalic ? 'italic' : 'normal',
        color: accent,
        textCategory: 'subheader',
        docField: headingKey,
      }),
    );
    if (style.headingRule === 'below') {
      y += gap(3);
      dividers.push(divider({ x, y, width, thickness: 1, color: RULE }));
      y += gap(9);
    } else {
      y += gap(6);
    }

    if (section.paragraph) {
      y =
        put(
          make({
            content: section.paragraph,
            x,
            y,
            width,
            fontSize: fs(11),
            textCategory: 'body',
            docField: sec === 'summary' ? 'summary.body' : `${sec}.${nextIndex(sec)}.body`,
          }),
        ) + gap(6);
    }

    for (const line of section.lines) {
      const content = line.label ? `${line.label}: ${line.text}` : line.text;
      y =
        put(
          make({
            content,
            x,
            y,
            width,
            fontSize: fs(11),
            fontStyle: section.linesItalic ? 'italic' : 'normal',
            textCategory: 'body',
            docField: `${sec}.${nextIndex(sec)}.body`,
          }),
        ) + gap(2);
    }

    section.entries.forEach((entry, idx) => {
      if (idx > 0) y += gap(8);
      y = layoutEntry(entry, section.kind, sec, x, width, y);
    });

    return y;
  };

  // Header
  const { header } = resume;
  const align = header.align === 'left' ? 'left' : 'center';
  let y = SAFE;
  y =
    put(
      make({
        content: header.name || 'Your Name',
        x: SAFE,
        y,
        width: W,
        fontSize: fs(22),
        fontWeight: 700,
        color: accent,
        textCategory: 'header',
        textAlign: align,
        docField: 'personal.name',
      }),
    ) + gap(2);
  if (header.headline) {
    y =
      put(
        make({
          content: header.headline,
          x: SAFE,
          y,
          width: W,
          fontSize: fs(13),
          fontWeight: 700,
          textCategory: 'subheader',
          textAlign: align,
          docField: 'personal.title',
        }),
      ) + gap(2);
  }
  header.contactLines.forEach((line, i) => {
    y =
      put(
        make({
          content: line,
          x: SAFE,
          y,
          width: W,
          fontSize: fs(11),
          textCategory: 'meta',
          textAlign: align,
          docField: `contact.${i}.value`,
        }),
      ) + gap(1);
  });

  // Sections, pairing adjacent left/right columns into one row.
  const sections = resume.sections;
  for (let i = 0; i < sections.length; i++) {
    y += gap(16);
    const cur = sections[i];
    const next = sections[i + 1];
    if (cur.column === 'left' && next?.column === 'right') {
      const colW = (W - COLUMN_GAP) / 2;
      const leftBottom = layoutSection(cur, SAFE, colW, y);
      const rightBottom = layoutSection(next, SAFE + colW + COLUMN_GAP, colW, y);
      y = Math.max(leftBottom, rightBottom);
      i++;
    } else {
      y = layoutSection(cur, SAFE, W, y);
    }
  }

  return { texts, dividers, bottom: y };
}

export interface ImportedCanvas {
  payload: TemplateCanvasPayload;
  /** Content still runs past the page after shrinking to the minimum scale. */
  overflow: boolean;
}

/**
 * Rebuild extracted resume content on the canvas in its original order and
 * columns. Content is scaled to the largest size that still fits one page.
 */
export function buildImportedCanvas(resume: ExtractedResume): ImportedCanvas {
  const limit = CANVAS_H - SAFE;
  let scale = MAX_SCALE;
  let result = layout(resume, scale);
  while (result.bottom > limit && scale > MIN_SCALE) {
    scale = Math.max(MIN_SCALE, scale - 0.04);
    result = layout(resume, scale);
  }

  return {
    payload: materializeSeed({
      texts: result.texts,
      icons: [],
      dividers: result.dividers,
    }),
    overflow: result.bottom > limit,
  };
}
