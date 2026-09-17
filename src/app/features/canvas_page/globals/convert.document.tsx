'use client';

/**
 * Document-mode conversion helpers.
 * Maps canvas text (via `docField`) ↔ structured form sections.
 * Entering mode locks freeform editing; exiting keeps all typed content.
 */

import type { TextElement } from '@/app/features/canvas_page/context/TextContext';
import type { DividerElement } from '@/app/features/canvas_page/context/DividerContext';
import { estimateTextHeight } from '@/app/features/canvas_page/canvas/safe.area';
import { text, divider } from '@/app/features/resume_templates/build';
import { SAFE, CANVAS_W } from '@/app/features/resume_templates/types';

export type DocSectionId =
  | 'personal'
  | 'contact'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'additional';

/** Sections that support multi-entry add / delete / reorder. */
export const REPEATABLE_SECTIONS: DocSectionId[] = [
  'contact',
  'experience',
  'education',
  'skills',
];

export const SECTION_LABELS: Record<DocSectionId, string> = {
  personal: 'Personal Details',
  contact: 'Contact',
  summary: 'Professional Summary',
  experience: 'Professional Experience',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
  additional: 'Additional',
};

export const SECTION_HINTS: Record<DocSectionId, string> = {
  personal: 'Your name and target role appear at the top of the resume.',
  contact: 'Add at least one contact method. Extra contacts can be removed.',
  summary: 'Write 2–4 short sentences about your experience and strengths.',
  experience: 'Show relevant roles. Keep at least one; extras can be removed.',
  education: 'Add degrees or programs. Keep at least one entry.',
  skills: 'List tools, languages, and strengths. Keep at least one block.',
  certifications: 'Optional credentials and awards.',
  additional: 'Languages, interests, or other extras.',
};

/** Fixed section display order (sections themselves are not reorderable). */
export const SECTION_ORDER: DocSectionId[] = [
  'personal',
  'contact',
  'summary',
  'experience',
  'education',
  'skills',
  'certifications',
  'additional',
];

export type DocFieldRole =
  | 'name'
  | 'title'
  | 'value'
  | 'heading'
  | 'body'
  | 'company'
  | 'dates'
  | 'location'
  | 'bullets'
  | 'degree'
  | 'school'
  | 'meta';

export interface ParsedDocField {
  id: string;
  docField: string;
  section: DocSectionId;
  entryIndex: number | null;
  role: DocFieldRole | string;
  content: string;
  element: TextElement;
}

export interface DocEntry {
  index: number;
  fields: ParsedDocField[];
  label: string;
}

export interface DocSection {
  id: DocSectionId;
  label: string;
  hint: string;
  heading?: ParsedDocField;
  /** Flat fields (personal, summary body, single skills block, …). */
  fields: ParsedDocField[];
  /** Repeatable entry groups. */
  entries: DocEntry[];
  repeatable: boolean;
}

const DOC_RE =
  /^(personal|contact|summary|experience|education|skills|certifications|additional)(?:\.(\d+))?(?:\.([a-zA-Z]+))?$/;

export function parseDocFieldKey(key: string): {
  section: DocSectionId;
  entryIndex: number | null;
  role: string;
} | null {
  const m = key.match(DOC_RE);
  if (!m) return null;
  const section = m[1] as DocSectionId;
  const entryIndex = m[2] !== undefined ? Number(m[2]) : null;
  let role = m[3] ?? 'value';
  // personal.name / personal.title (no entry index)
  if (entryIndex === null && m[3]) role = m[3];
  if (entryIndex === null && !m[3]) {
    if (section === 'personal') role = 'name';
    else role = 'value';
  }
  return { section, entryIndex, role };
}

export function buildDocField(
  section: DocSectionId,
  role: string,
  entryIndex?: number,
): string {
  if (entryIndex === undefined || entryIndex === null) {
    return `${section}.${role}`;
  }
  return `${section}.${entryIndex}.${role}`;
}

function entryLabel(section: DocSectionId, fields: ParsedDocField[], index: number): string {
  const byRole = (r: string) => fields.find((f) => f.role === r)?.content?.trim();
  if (section === 'contact') {
    return byRole('value') || `Contact ${index + 1}`;
  }
  if (section === 'experience') {
    const title = byRole('title') || 'Job Title';
    const company = byRole('company');
    return company ? `${title} at ${company}` : title;
  }
  if (section === 'education') {
    const degree = byRole('degree') || 'Degree';
    const school = byRole('school');
    return school ? `${degree} at ${school}` : degree;
  }
  if (section === 'skills') {
    const body = byRole('body') || byRole('value') || '';
    const first = body.split('\n')[0]?.trim();
    return first ? first.slice(0, 48) : `Skills ${index + 1}`;
  }
  return `${SECTION_LABELS[section]} ${index + 1}`;
}

/** Group canvas texts that have docField into form sections. */
export function buildDocumentSections(texts: TextElement[]): DocSection[] {
  const parsed: ParsedDocField[] = [];
  for (const el of texts) {
    if (!el.docField) continue;
    const info = parseDocFieldKey(el.docField);
    if (!info) continue;
    parsed.push({
      id: el.id,
      docField: el.docField,
      section: info.section,
      entryIndex: info.entryIndex,
      role: info.role,
      content: el.content,
      element: el,
    });
  }

  const present = new Set(parsed.map((p) => p.section));
  const sections: DocSection[] = [];

  for (const id of SECTION_ORDER) {
    if (!present.has(id) && id !== 'personal' && id !== 'contact' && id !== 'summary' && id !== 'experience' && id !== 'education' && id !== 'skills') {
      // Skip optional sections that have no fields on this canvas.
      continue;
    }
    const items = parsed.filter((p) => p.section === id);
    if (items.length === 0 && !['personal', 'contact', 'summary', 'experience', 'education', 'skills'].includes(id)) {
      continue;
    }

    const heading = items.find((p) => p.role === 'heading');
    const nonHeading = items.filter((p) => p.role !== 'heading');
    const repeatable = REPEATABLE_SECTIONS.includes(id);

    const entryMap = new Map<number, ParsedDocField[]>();
    const flat: ParsedDocField[] = [];

    for (const f of nonHeading) {
      if (f.entryIndex !== null) {
        const list = entryMap.get(f.entryIndex) ?? [];
        list.push(f);
        entryMap.set(f.entryIndex, list);
      } else {
        flat.push(f);
      }
    }

    const entries: DocEntry[] = [...entryMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([index, fields]) => ({
        index,
        fields: fields.sort((a, b) => a.element.y - b.element.y || a.element.x - b.element.x),
        label: entryLabel(id, fields, index),
      }));

    // Personal / summary always show even if somehow empty after blank materialize.
    if (items.length === 0) continue;

    sections.push({
      id,
      label: SECTION_LABELS[id],
      hint: SECTION_HINTS[id],
      heading,
      fields: flat.sort((a, b) => a.element.y - b.element.y || a.element.x - b.element.x),
      entries,
      repeatable,
    });
  }

  return sections;
}

export function canvasHasDocFields(texts: TextElement[]): boolean {
  return texts.some((t) => Boolean(t.docField));
}

export function canvasLooksEmpty(texts: TextElement[]): boolean {
  return texts.length === 0;
}

/** Estimate text block height for layout shifts (wrap-aware). */
export function estimateBlockHeight(el: TextElement): number {
  return Math.ceil(estimateTextHeight(el));
}

function entryBounds(fields: ParsedDocField[]): { minY: number; maxY: number; height: number } {
  if (fields.length === 0) return { minY: 0, maxY: 0, height: 40 };
  let minY = Infinity;
  let maxY = -Infinity;
  for (const f of fields) {
    minY = Math.min(minY, f.element.y);
    maxY = Math.max(maxY, f.element.y + estimateBlockHeight(f.element));
  }
  return { minY, maxY, height: maxY - minY };
}

const ENTRY_GAP = 18;

type TextPatch = { id: string; updates: Partial<TextElement> };

/**
 * Swap vertical positions of two entries in a repeatable section.
 * Returns patches to apply via updateElement.
 */
export function reorderEntryPatches(
  texts: TextElement[],
  section: DocSectionId,
  fromIndex: number,
  toIndex: number,
): TextPatch[] {
  if (fromIndex === toIndex) return [];
  const sections = buildDocumentSections(texts);
  const sec = sections.find((s) => s.id === section);
  if (!sec) return [];
  const a = sec.entries.find((e) => e.index === fromIndex);
  const b = sec.entries.find((e) => e.index === toIndex);
  if (!a || !b) return [];

  const aBounds = entryBounds(a.fields);
  const bBounds = entryBounds(b.fields);
  const patches: TextPatch[] = [];

  // Move A to B's minY and B to A's minY, preserving relative offsets inside each entry.
  for (const f of a.fields) {
    const rel = f.element.y - aBounds.minY;
    patches.push({
      id: f.id,
      updates: {
        y: bBounds.minY + rel,
        docField: buildDocField(section, f.role, toIndex),
      },
    });
  }
  for (const f of b.fields) {
    const rel = f.element.y - bBounds.minY;
    patches.push({
      id: f.id,
      updates: {
        y: aBounds.minY + rel,
        docField: buildDocField(section, f.role, fromIndex),
      },
    });
  }
  return patches;
}

/**
 * Shift every text (and optionally divider) with y >= fromY by deltaY.
 * Skips elements belonging to an optional skipIds set.
 */
export function shiftBelowPatches(
  texts: TextElement[],
  fromY: number,
  deltaY: number,
  skipIds?: Set<string>,
): TextPatch[] {
  if (deltaY === 0) return [];
  const patches: TextPatch[] = [];
  for (const el of texts) {
    if (skipIds?.has(el.id)) continue;
    if (el.y >= fromY) {
      patches.push({ id: el.id, updates: { y: el.y + deltaY } });
    }
  }
  return patches;
}

export function shiftDividerPatches(
  dividers: DividerElement[],
  fromY: number,
  deltaY: number,
): { id: string; updates: Partial<DividerElement> }[] {
  if (deltaY === 0) return [];
  return dividers
    .filter((d) => d.y >= fromY)
    .map((d) => ({ id: d.id, updates: { y: d.y + deltaY } }));
}

/** Roles cloned when adding a new entry for each section. */
const ENTRY_TEMPLATES: Record<
  string,
  { role: string; content: string; fontSize: number; fontWeight?: number; category?: TextElement['textCategory']; width?: number; color?: string }[]
> = {
  contact: [
    { role: 'value', content: 'email@example.com', fontSize: 11, category: 'meta', width: 280, color: '#5b6472' },
  ],
  experience: [
    { role: 'title', content: 'Job Title', fontSize: 12.5, fontWeight: 700, category: 'body', width: 480 },
    { role: 'dates', content: 'Month Year – Month Year', fontSize: 11, category: 'meta', width: 200, color: '#5b6472' },
    { role: 'company', content: 'Company Name, City, Country', fontSize: 11.5, category: 'body', width: 480, color: '#5b6472' },
    { role: 'bullets', content: '• Achievement with a measurable result.\n• Second contribution with clear ownership.', fontSize: 11.5, category: 'body', width: CANVAS_W - SAFE * 2 },
  ],
  education: [
    { role: 'degree', content: 'Degree, Major', fontSize: 12, fontWeight: 700, category: 'body', width: 480 },
    { role: 'dates', content: 'Graduation Year', fontSize: 11, category: 'meta', width: 200, color: '#5b6472' },
    { role: 'school', content: 'University Name, City, Country', fontSize: 11.5, category: 'body', width: 480, color: '#5b6472' },
  ],
  skills: [
    { role: 'body', content: 'Skill group: list your skills here', fontSize: 11.5, category: 'body', width: CANVAS_W - SAFE * 2 },
  ],
};

export interface AddEntryPlan {
  /** New text elements to insert (without ids — caller assigns). */
  newTexts: Omit<TextElement, 'id'>[];
  textPatches: TextPatch[];
  dividerPatches: { id: string; updates: Partial<DividerElement> }[];
}

/**
 * Plan inserting a new entry below the last entry of a section.
 * Shifts later content (and section rules) down to make room.
 */
export function planAddEntry(
  texts: TextElement[],
  dividers: DividerElement[],
  section: DocSectionId,
): AddEntryPlan | null {
  const template = ENTRY_TEMPLATES[section];
  if (!template) return null;

  const sections = buildDocumentSections(texts);
  const sec = sections.find((s) => s.id === section);
  const last = sec?.entries[sec.entries.length - 1];
  const nextIndex = last ? last.index + 1 : 0;

  // Anchor: clone x from last entry fields when possible.
  let baseX = SAFE;
  let insertY: number;
  /** Shift threshold — bottom of the block we insert after (not insertY). */
  let shiftFromY: number;
  let refFields = last?.fields ?? [];

  if (last) {
    const bounds = entryBounds(last.fields);
    // Shift everything below the last entry's bottom so trailing dividers move too.
    // (Shifting from insertY skipped the contact→summary rule and caused overlaps.)
    shiftFromY = bounds.maxY;
    insertY = bounds.maxY + ENTRY_GAP;
    baseX = Math.min(...last.fields.map((f) => f.element.x));
  } else {
    // Place under section heading or personal block.
    const heading = texts.find((t) => t.docField === `${section}.heading`);
    if (heading) {
      shiftFromY = heading.y + estimateBlockHeight(heading);
      insertY = shiftFromY + 12;
    } else {
      shiftFromY = 280;
      insertY = 280;
    }
  }

  // Relative layout from last entry when available.
  const refMinY = refFields.length ? Math.min(...refFields.map((f) => f.element.y)) : insertY;
  const roleOffsets = new Map<string, { x: number; y: number; width: number; fontSize: number; fontWeight?: number; color?: string; textAlign?: TextElement['textAlign']; textCategory?: TextElement['textCategory'] }>();
  for (const f of refFields) {
    roleOffsets.set(f.role, {
      x: f.element.x,
      y: f.element.y - refMinY,
      width: f.element.width,
      fontSize: f.element.fontSize,
      fontWeight: f.element.fontWeight,
      color: f.element.color,
      textAlign: f.element.textAlign,
      textCategory: f.element.textCategory,
    });
  }

  const newTexts: Omit<TextElement, 'id'>[] = [];
  let cursorY = 0;
  for (const row of template) {
    const ref = roleOffsets.get(row.role);
    const x = ref?.x ?? (row.role === 'dates' ? CANVAS_W - SAFE - 200 : baseX);
    const yOff = ref?.y ?? cursorY;
    const width = ref?.width ?? row.width ?? CANVAS_W - SAFE * 2;
    newTexts.push({
      content: row.content,
      x,
      y: insertY + yOff,
      width,
      fontSize: ref?.fontSize ?? row.fontSize,
      fontWeight: ref?.fontWeight ?? row.fontWeight ?? 400,
      color: ref?.color ?? row.color ?? '#111111',
      textAlign: ref?.textAlign ?? (row.role === 'dates' ? 'right' : 'left'),
      textCategory: ref?.textCategory ?? row.category ?? 'body',
      listType: 'none',
      fontFamily: 'Arial, sans-serif',
      docField: buildDocField(section, row.role, nextIndex),
    });
    if (!ref) cursorY += row.fontSize * 1.5 + 6;
  }

  const newHeight =
    Math.max(...newTexts.map((t) => (t.y - insertY) + estimateBlockHeight(t as TextElement))) + ENTRY_GAP;

  const textPatches = shiftBelowPatches(texts, shiftFromY, newHeight);
  const dividerPatches = shiftDividerPatches(dividers, shiftFromY, newHeight);

  return { newTexts, textPatches, dividerPatches };
}

/**
 * Plan vertical reflow when a field's content grows or shrinks.
 * Pushes (or pulls) every text/divider below the edited block's old bottom.
 */
export function planContentHeightChange(
  texts: TextElement[],
  dividers: DividerElement[],
  textId: string,
  nextContent: string,
): { textPatches: TextPatch[]; dividerPatches: { id: string; updates: Partial<DividerElement> }[] } | null {
  const el = texts.find((t) => t.id === textId);
  if (!el) return null;

  const oldH = estimateBlockHeight(el);
  const newH = estimateBlockHeight({ ...el, content: nextContent });
  const deltaY = newH - oldH;
  if (Math.abs(deltaY) < 1) {
    return { textPatches: [], dividerPatches: [] };
  }

  const fromY = el.y + oldH;
  return {
    textPatches: shiftBelowPatches(texts, fromY, deltaY, new Set([el.id])),
    dividerPatches: shiftDividerPatches(dividers, fromY, deltaY),
  };
}

export interface RemoveEntryPlan {
  deleteIds: string[];
  textPatches: TextPatch[];
  dividerPatches: { id: string; updates: Partial<DividerElement> }[];
}

/**
 * Remove an optional entry (not the last remaining one).
 * Reindexes later entries and shifts canvas content up.
 */
export function planRemoveEntry(
  texts: TextElement[],
  dividers: DividerElement[],
  section: DocSectionId,
  entryIndex: number,
): RemoveEntryPlan | null {
  const sections = buildDocumentSections(texts);
  const sec = sections.find((s) => s.id === section);
  if (!sec || sec.entries.length <= 1) return null;
  const target = sec.entries.find((e) => e.index === entryIndex);
  if (!target) return null;

  const bounds = entryBounds(target.fields);
  const gap = ENTRY_GAP;
  const lift = bounds.height + gap;
  const deleteIds = target.fields.map((f) => f.id);
  const deleteSet = new Set(deleteIds);

  // Reindex entries after the removed one.
  const textPatches: TextPatch[] = [];
  for (const entry of sec.entries) {
    if (entry.index <= entryIndex) continue;
    for (const f of entry.fields) {
      textPatches.push({
        id: f.id,
        updates: {
          y: f.element.y - lift,
          docField: buildDocField(section, f.role, entry.index - 1),
        },
      });
    }
  }

  // Shift content below this section's entries that isn't part of the section entries already patched.
  const patchedIds = new Set(textPatches.map((p) => p.id));
  for (const el of texts) {
    if (deleteSet.has(el.id) || patchedIds.has(el.id)) continue;
    if (el.y >= bounds.maxY) {
      textPatches.push({ id: el.id, updates: { y: el.y - lift } });
    }
  }

  const dividerPatches = shiftDividerPatches(dividers, bounds.maxY, -lift);

  return { deleteIds, textPatches, dividerPatches };
}

/** Blank-canvas ATS document seed (Charles Bloomberg–style single column). */
export function blankAtsDocumentSeed(): {
  texts: Omit<TextElement, 'id'>[];
  dividers: Omit<DividerElement, 'id'>[];
} {
  const W = CANVAS_W - SAFE * 2;
  const INK = '#111111';
  const SUB = '#333333';
  const MUTE = '#5b6472';
  const RULE = '#9aa3b0';

  return {
    texts: [
      text({ content: 'Your Name', x: SAFE, y: 48, width: W, fontSize: 30, fontWeight: 700, color: INK, textCategory: 'header', textAlign: 'center', docField: 'personal.name' }),
      text({ content: 'Target Job Title', x: SAFE, y: 90, width: W, fontSize: 13, fontWeight: 600, color: SUB, textCategory: 'subheader', textAlign: 'center', docField: 'personal.title' }),
      // 20px steps so wrap-aware contact height (~19px) does not overlap.
      text({ content: 'City, Country', x: SAFE, y: 118, width: W, fontSize: 11, color: MUTE, textCategory: 'meta', textAlign: 'center', docField: 'contact.0.value' }),
      text({ content: 'email@example.com', x: SAFE, y: 138, width: W, fontSize: 11, color: MUTE, textCategory: 'meta', textAlign: 'center', docField: 'contact.1.value' }),
      text({ content: '(555) 000-0000', x: SAFE, y: 158, width: W, fontSize: 11, color: MUTE, textCategory: 'meta', textAlign: 'center', docField: 'contact.2.value' }),
      text({ content: 'linkedin.com/in/you', x: SAFE, y: 178, width: W, fontSize: 11, color: MUTE, textCategory: 'meta', textAlign: 'center', docField: 'contact.3.value' }),

      text({ content: 'PROFESSIONAL SUMMARY', x: SAFE, y: 220, width: W, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'subheader', docField: 'summary.heading' }),
      text({ content: 'Two to three sentences summarizing your experience, core strengths, and the role you are targeting. Keep the language plain and specific so applicant tracking systems parse it cleanly.', x: SAFE, y: 244, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'summary.body' }),

      text({ content: 'PROFESSIONAL EXPERIENCE', x: SAFE, y: 312, width: W, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'subheader', docField: 'experience.heading' }),
      text({ content: 'Job Title', x: SAFE, y: 338, width: 480, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'body', docField: 'experience.0.title' }),
      text({ content: 'Month Year – Present', x: CANVAS_W - SAFE - 200, y: 338, width: 200, fontSize: 11, color: MUTE, textAlign: 'right', textCategory: 'meta', docField: 'experience.0.dates' }),
      text({ content: 'Company Name, City, Country', x: SAFE, y: 357, width: 480, fontSize: 11.5, color: MUTE, textCategory: 'body', docField: 'experience.0.company' }),
      text({ content: '• Led or delivered a key result — describe the impact with a number.\n• Owned a process or product area and the outcome it produced.\n• Collaborated across teams to ship something that mattered.', x: SAFE, y: 377, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'experience.0.bullets' }),

      text({ content: 'EDUCATION', x: SAFE, y: 460, width: W, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'subheader', docField: 'education.heading' }),
      text({ content: 'Degree, Major', x: SAFE, y: 486, width: 480, fontSize: 12, fontWeight: 700, color: INK, textCategory: 'body', docField: 'education.0.degree' }),
      text({ content: 'Graduation Year', x: CANVAS_W - SAFE - 200, y: 486, width: 200, fontSize: 11, color: MUTE, textAlign: 'right', textCategory: 'meta', docField: 'education.0.dates' }),
      text({ content: 'University Name, City, Country', x: SAFE, y: 505, width: 480, fontSize: 11.5, color: MUTE, textCategory: 'body', docField: 'education.0.school' }),

      text({ content: 'SKILLS', x: SAFE, y: 550, width: W, fontSize: 12.5, fontWeight: 700, color: INK, textCategory: 'subheader', docField: 'skills.heading' }),
      text({ content: 'Languages: list your strongest languages\nTools: list tools, frameworks, and platforms\nStrengths: leadership, communication, problem solving', x: SAFE, y: 576, width: W, fontSize: 11.5, color: SUB, textCategory: 'body', docField: 'skills.0.body' }),
    ],
    dividers: [
      divider({ x: SAFE, y: 208, width: W, thickness: 1, color: RULE }),
      divider({ x: SAFE, y: 304, width: W, thickness: 1, color: RULE }),
      divider({ x: SAFE, y: 452, width: W, thickness: 1, color: RULE }),
      divider({ x: SAFE, y: 542, width: W, thickness: 1, color: RULE }),
    ],
  };
}

/**
 * Heuristic: assign docField keys to unlabeled template texts by
 * detecting section headings + reading order. Used for older canvases
 * and as a safety net if a seed is missing keys.
 */
export function assignDocFieldsHeuristic(texts: TextElement[]): TextPatch[] {
  if (texts.some((t) => t.docField)) return [];

  const sorted = [...texts].sort((a, b) => a.y - b.y || a.x - b.x);
  const patches: TextPatch[] = [];
  let section: DocSectionId | 'personal' = 'personal';
  let entry = 0;
  let seenInSection = 0;
  let personalAssigned = 0;

  const headingMap: Record<string, DocSectionId> = {
    SUMMARY: 'summary',
    'PROFESSIONAL SUMMARY': 'summary',
    PROFILE: 'summary',
    ABOUT: 'summary',
    'ABOUT ME': 'summary',
    EXPERIENCE: 'experience',
    'PROFESSIONAL EXPERIENCE': 'experience',
    'EMPLOYMENT HISTORY': 'experience',
    'WORK EXPERIENCE': 'experience',
    EDUCATION: 'education',
    SKILLS: 'skills',
    'TECHNICAL SKILLS': 'skills',
    'CORE COMPETENCIES': 'skills',
    'AREAS OF EXPERTISE': 'skills',
    'EXPERT-LEVEL SKILLS': 'skills',
    CERTIFICATIONS: 'certifications',
    'CERTIFICATIONS & AWARDS': 'certifications',
    ADDITIONAL: 'additional',
    'ADDITIONAL EXPERIENCE': 'additional',
    PROJECTS: 'additional',
    CONTACT: 'contact',
    DETAILS: 'contact',
  };

  for (const el of sorted) {
    const raw = (el.content || '').trim();
    const upper = raw.toUpperCase();
    const asHeading = headingMap[upper];
    if (asHeading && (el.textCategory === 'subheader' || el.fontWeight === 700) && raw.length < 48) {
      section = asHeading;
      entry = 0;
      seenInSection = 0;
      patches.push({ id: el.id, updates: { docField: `${asHeading}.heading` } });
      continue;
    }

    if (section === 'personal' || (personalAssigned < 3 && el.y < 160)) {
      if (personalAssigned === 0) {
        patches.push({ id: el.id, updates: { docField: 'personal.name' } });
        personalAssigned++;
        continue;
      }
      if (personalAssigned === 1 && (el.textCategory === 'subheader' || el.fontSize >= 13)) {
        patches.push({ id: el.id, updates: { docField: 'personal.title' } });
        personalAssigned++;
        continue;
      }
      patches.push({ id: el.id, updates: { docField: `contact.${entry}.value` } });
      entry++;
      personalAssigned++;
      continue;
    }

    if (section === 'summary') {
      patches.push({ id: el.id, updates: { docField: 'summary.body' } });
      continue;
    }

    if (section === 'contact') {
      patches.push({ id: el.id, updates: { docField: `contact.${entry}.value` } });
      entry++;
      continue;
    }

    if (section === 'experience') {
      const roles = ['title', 'dates', 'company', 'bullets'] as const;
      // Heuristic by position: right-aligned / meta → dates; multi-line → bullets
      let role: string;
      if (el.textAlign === 'right' || (el.textCategory === 'meta' && el.x > CANVAS_W / 2)) {
        role = 'dates';
      } else if ((el.content || '').includes('•') || (el.content || '').includes('\n')) {
        role = 'bullets';
        // starting bullets implies end of this entry's header lines
      } else if (seenInSection === 0) {
        role = 'title';
      } else if (seenInSection === 1) {
        role = 'company';
      } else {
        role = roles[Math.min(seenInSection, roles.length - 1)];
      }
      patches.push({ id: el.id, updates: { docField: `experience.${entry}.${role}` } });
      seenInSection++;
      if (role === 'bullets') {
        entry++;
        seenInSection = 0;
      }
      continue;
    }

    if (section === 'education') {
      let role: string;
      if (el.textAlign === 'right' || el.textCategory === 'meta' && el.x > CANVAS_W / 2) {
        role = 'dates';
      } else if (seenInSection === 0) {
        role = 'degree';
      } else if (seenInSection === 1) {
        role = 'school';
      } else {
        role = 'meta';
        entry++;
        seenInSection = -1;
      }
      patches.push({ id: el.id, updates: { docField: `education.${entry}.${role}` } });
      seenInSection++;
      if (role === 'school' || role === 'meta') {
        // keep same entry until next degree-like block; bump on meta
        if (role === 'meta') {
          /* entry already bumped */
        }
      }
      continue;
    }

    if (section === 'skills') {
      patches.push({ id: el.id, updates: { docField: `skills.${entry}.body` } });
      entry++;
      continue;
    }

    if (section === 'certifications') {
      patches.push({ id: el.id, updates: { docField: `certifications.${entry}.body` } });
      entry++;
      continue;
    }

    if (section === 'additional') {
      patches.push({ id: el.id, updates: { docField: `additional.${entry}.body` } });
      entry++;
      continue;
    }
  }

  return patches;
}
