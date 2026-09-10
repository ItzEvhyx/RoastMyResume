/**
 * Shared resume template types + canvas seed shape.
 * Seeds are the source of truth; Firestore stores copies for remote fetch.
 */

import type { TextElement } from '@/app/features/canvas_page/context/TextContext';
import type { IconElement } from '@/app/features/canvas_page/context/IconContext';
import type { DividerElement } from '@/app/features/canvas_page/context/DividerContext';
import type { PenStroke } from '@/app/features/canvas_page/context/PenContext';
import type { GroupElement } from '@/app/features/canvas_page/context/GroupContext';
import type { CanvasState } from '@/app/features/canvas_page/services/canvas.persistence';

export const TEMPLATE_CATEGORIES = [
  'All',
  'ATS Friendly',
  'Business',
  'Tech',
  'Generic',
] as const;

export type TemplateCategoryFilter = (typeof TEMPLATE_CATEGORIES)[number];
export type TemplateCategory = Exclude<TemplateCategoryFilter, 'All'>;

/** Canvas payload without persistence metadata. */
export type TemplateCanvasPayload = Omit<CanvasState, 'version' | 'timestamp'>;

export interface ResumeTemplateMeta {
  id: string;
  name: string;
  tag: string;
  category: TemplateCategory;
  /** Blank canvas — no seed content. */
  blank?: boolean;
  /** Accent color used by previews / sidebar columns. */
  accent?: string;
}

export interface ResumeTemplate extends ResumeTemplateMeta {
  /** Element seed. Absent for blank. */
  seed?: TemplateCanvasPayload;
}

export type TemplateSeedElements = {
  texts: Omit<TextElement, 'id'>[];
  icons: Omit<IconElement, 'id'>[];
  dividers: Omit<DividerElement, 'id'>[];
  pens?: Omit<PenStroke, 'id'>[];
  groups?: Omit<GroupElement, 'id'>[];
};

export const CANVAS_W = 794;
export const CANVAS_H = 1123;
export const SAFE = 48;
