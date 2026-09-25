/** Structured resume content extracted from an uploaded PDF, in reading order. */

export type ImportedSectionKind =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'other';

/** Full-width section, or one half of a two-column row. */
export type ImportedColumn = 'full' | 'left' | 'right';

export type ImportedTextStyle = 'plain' | 'bold' | 'italic' | 'bold-italic';

export interface ImportedEntry {
  /** Bold first line: role, project name, school, degree... */
  title?: string;
  /** Text right-aligned on the title row (dates, tech stack, location). */
  titleRight?: string;
  titleRightStyle?: ImportedTextStyle;
  /** Second line under the title (company, school, degree). */
  subtitle?: string;
  subtitleRight?: string;
  subtitleStyle?: ImportedTextStyle;
  /** Prose line(s) under the entry header. */
  description?: string;
  descriptionItalic?: boolean;
  bullets: string[];
  bulletGlyph?: 'dot' | 'dash' | 'none';
  bulletsItalic?: boolean;
}

export interface ImportedLine {
  /** Bold lead-in like "Languages". */
  label?: string;
  text: string;
}

export interface ImportedSection {
  /** Heading exactly as written. */
  heading: string;
  kind: ImportedSectionKind;
  column: ImportedColumn;
  headingItalic?: boolean;
  paragraph?: string;
  lines: ImportedLine[];
  linesItalic?: boolean;
  entries: ImportedEntry[];
}

export interface ImportedHeader {
  name: string;
  headline?: string;
  /** Contact lines exactly as laid out, separators included. */
  contactLines: string[];
  align: 'left' | 'center';
}

export const IMPORT_FONTS = [
  'Calibri, sans-serif',
  'Helvetica, Arial, sans-serif',
  'Georgia, serif',
  'Times New Roman, Times, serif',
  'Arial, sans-serif',
  'Garamond, serif',
  'Cambria, Georgia, serif',
  'Trebuchet MS, sans-serif',
  'Verdana, sans-serif',
  'Book Antiqua, Palatino, serif',
  'Gill Sans, sans-serif',
] as const;

export interface ImportedStyle {
  fontFamily: string;
  headingCase: 'upper' | 'as-written';
  /** Where the section rule sits relative to its heading. */
  headingRule: 'below' | 'above' | 'none';
  /** Hex colors; default near-black. */
  textColor?: string;
  accentColor?: string;
}

export interface ExtractedResume {
  header: ImportedHeader;
  sections: ImportedSection[];
  style: ImportedStyle;
}

export const RESUME_IMPORT_MAX_BYTES = 5 * 1024 * 1024;
