'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';
import {
  SECTION_LABELS,
  type DocEntry,
  type DocSection,
  type DocSectionId,
  type ParsedDocField,
} from '@/app/features/canvas_page/globals/convert.document';
import { useDocumentMode } from './use.document.mode';

const futuraDisplay = localFont({
  src: '../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const glassStyle: React.CSSProperties = {
  background: 'rgba(18, 20, 26, 0.94)',
  backdropFilter: 'blur(22px) saturate(140%)',
  WebkitBackdropFilter: 'blur(22px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 16px 48px rgba(0,0,0,0.5)',
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Full name',
  title: 'Job title',
  value: 'Contact',
  body: 'Content',
  company: 'Employer',
  dates: 'Start & end date',
  location: 'City, State',
  bullets: 'Description',
  degree: 'Degree / program',
  school: 'School',
  meta: 'Details',
  heading: 'Section title',
};

function fieldLabel(role: string): string {
  return FIELD_LABELS[role] ?? role.replace(/^\w/, (c) => c.toUpperCase());
}

function GripIcon() {
  return (
    <span className="inline-grid grid-cols-2 gap-[3.5px]" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="h-[3.5px] w-[3.5px] rounded-[1px] bg-white/40" />
      ))}
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function TrashButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'At least one entry is required' : 'Remove'}
      className="shrink-0 rounded-lg p-2 text-red-400 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function DocInput({
  field,
  multiline,
  onFocus,
  onChange,
  className = '',
}: {
  field: ParsedDocField;
  multiline?: boolean;
  onFocus: (id: string) => void;
  onChange: (id: string, value: string) => void;
  className?: string;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const common =
    'w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5 text-[15px] font-normal text-white/95 outline-none transition placeholder:text-white/30 focus:border-white/25 focus:bg-white/[0.1]';

  const fitTextarea = useCallback(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    if (multiline) fitTextarea();
  }, [multiline, field.content, fitTextarea]);

  return (
    <label className={`flex flex-col gap-2 ${className}`} style={{ fontFamily: 'var(--font-poppins)' }}>
      <span className="text-[13px] font-medium text-white/55">
        {fieldLabel(field.role)}
      </span>
      {multiline ? (
        <textarea
          ref={areaRef}
          value={field.content}
          rows={3}
          onFocus={() => onFocus(field.id)}
          onChange={(e) => {
            onChange(field.id, e.target.value);
            // Grow immediately on keystroke (before paint of next effect).
            requestAnimationFrame(fitTextarea);
          }}
          className={`${common} min-h-[100px] resize-none overflow-hidden leading-relaxed [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`}
          style={{ fontFamily: 'var(--font-poppins)', overflow: 'hidden' }}
        />
      ) : (
        <input
          type="text"
          value={field.content}
          onFocus={() => onFocus(field.id)}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={common}
          style={{ fontFamily: 'var(--font-poppins)' }}
        />
      )}
    </label>
  );
}

function isMultiline(role: string): boolean {
  return role === 'body' || role === 'bullets' || role === 'meta';
}

/** Flat reorderable row (contact-style): grip + input + optional trash. */
function FlatEntryRow({
  sectionId,
  entry,
  canDelete,
  onFocus,
  onChange,
  onRemove,
  onMove,
}: {
  sectionId: DocSectionId;
  entry: DocEntry;
  canDelete: boolean;
  onFocus: (id: string) => void;
  onChange: (id: string, value: string) => void;
  onRemove: () => void;
  onMove: (from: number, to: number) => void;
}) {
  const field = entry.fields[0];
  if (!field) return null;
  const idx = entry.index;

  return (
    <div
      className="flex items-center gap-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData('text/doc-entry');
        const [sec, fromStr] = raw.split(':');
        if (sec !== sectionId) return;
        const from = Number(fromStr);
        if (!Number.isFinite(from) || from === idx) return;
        onMove(from, idx);
      }}
    >
      <button
        type="button"
        className="cursor-grab shrink-0 px-0.5 py-2 active:cursor-grabbing"
        title="Drag to reorder"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/doc-entry', `${sectionId}:${idx}`);
          e.dataTransfer.effectAllowed = 'move';
        }}
        aria-label="Drag to reorder"
      >
        <GripIcon />
      </button>
      <div className="min-w-0 flex-1">
        <DocInput field={field} onFocus={onFocus} onChange={onChange} />
      </div>
      {canDelete && <TrashButton onClick={onRemove} />}
    </div>
  );
}

/** Multi-field entry (experience / education) — grip + label + trash + chevron, no box. */
function EntryBlock({
  sectionId,
  entry,
  canDelete,
  onFocus,
  onChange,
  onRemove,
  onMove,
}: {
  sectionId: DocSectionId;
  entry: DocEntry;
  canDelete: boolean;
  onFocus: (id: string) => void;
  onChange: (id: string, value: string) => void;
  onRemove: () => void;
  onMove: (from: number, to: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const idx = entry.index;

  return (
    <div
      className="py-1"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData('text/doc-entry');
        const [sec, fromStr] = raw.split(':');
        if (sec !== sectionId) return;
        const from = Number(fromStr);
        if (!Number.isFinite(from) || from === idx) return;
        onMove(from, idx);
      }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="cursor-grab shrink-0 px-0.5 active:cursor-grabbing"
          title="Drag to reorder"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/doc-entry', `${sectionId}:${idx}`);
            e.dataTransfer.effectAllowed = 'move';
          }}
          aria-label="Drag to reorder"
        >
          <GripIcon />
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <div
            className="truncate text-[15px] font-semibold text-white"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            {entry.label}
          </div>
          <div
            className="mt-0.5 text-[13px] text-white/40"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            {entry.fields.find((f) => f.role === 'dates')?.content || `Entry ${idx + 1}`}
          </div>
        </button>
        {canDelete && <TrashButton onClick={onRemove} />}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          <ChevronIcon open={open} />
        </button>
      </div>
      {open && (
        <div className="mt-3 flex flex-col gap-4 pl-7">
          {entry.fields.map((f) => (
            <DocInput
              key={f.id}
              field={f}
              multiline={isMultiline(f.role)}
              onFocus={onFocus}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionBlock({
  section,
  onFocus,
  onChange,
  onAdd,
  onRemove,
  onReorder,
}: {
  section: DocSection;
  onFocus: (id: string) => void;
  onChange: (id: string, value: string) => void;
  onAdd: (id: DocSectionId) => void;
  onRemove: (id: DocSectionId, entryIndex: number) => void;
  onReorder: (id: DocSectionId, from: number, to: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const editableFlat = section.fields.filter((f) => f.role !== 'heading');
  const useFlatRows =
    section.id === 'contact' &&
    section.entries.every((e) => e.fields.length === 1);

  const addLabel = useMemo(() => {
    switch (section.id) {
      case 'contact':
        return '+ Add contact';
      case 'experience':
        return '+ Add employment';
      case 'education':
        return '+ Add one more education';
      case 'skills':
        return '+ Add skills block';
      default:
        return `+ Add ${SECTION_LABELS[section.id].toLowerCase()}`;
    }
  }, [section.id]);

  return (
    <section className="border-b border-white/10 py-5 last:border-b-0">
      <header className="mb-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3
            className="text-[18px] font-bold tracking-tight text-white"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            {section.label}
          </h3>
          <p
            className="mt-1 text-[13px] leading-snug text-white/45"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            {section.hint}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-0.5 shrink-0 rounded-lg p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white"
          aria-label={open ? 'Collapse section' : 'Expand section'}
        >
          <ChevronIcon open={open} />
        </button>
      </header>

      {open && (
        <div className="flex flex-col gap-4">
          {editableFlat.map((f) => (
            <DocInput
              key={f.id}
              field={f}
              multiline={isMultiline(f.role)}
              onFocus={onFocus}
              onChange={onChange}
            />
          ))}

          {section.entries.map((entry) =>
            useFlatRows ? (
              <FlatEntryRow
                key={`${section.id}-${entry.index}`}
                sectionId={section.id}
                entry={entry}
                canDelete={section.repeatable && section.entries.length > 1}
                onFocus={onFocus}
                onChange={onChange}
                onRemove={() => onRemove(section.id, entry.index)}
                onMove={(from, to) => onReorder(section.id, from, to)}
              />
            ) : (
              <EntryBlock
                key={`${section.id}-${entry.index}`}
                sectionId={section.id}
                entry={entry}
                canDelete={section.repeatable && section.entries.length > 1}
                onFocus={onFocus}
                onChange={onChange}
                onRemove={() => onRemove(section.id, entry.index)}
                onMove={(from, to) => onReorder(section.id, from, to)}
              />
            ),
          )}

          {section.repeatable && (
            <button
              type="button"
              onClick={() => onAdd(section.id)}
              className="mt-1 self-start text-[15px] font-semibold text-sky-400 transition hover:text-sky-300"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {addLabel}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Left-side document inputs panel (desktop / document mode only).
 * Hidden (not overlapping) when canvas mode is active.
 */
export default function DocumentInputs() {
  const {
    isDocumentMode,
    sections,
    focusField,
    writeField,
    addEntry,
    removeEntry,
    reorderEntry,
  } = useDocumentMode();

  return (
    <aside
      className={`${futuraDisplay.variable} ${poppins.variable} fixed bottom-6 left-6 top-20 z-[60] w-[460px] flex-col overflow-hidden rounded-2xl transition-all duration-300 ease-out ${
        isDocumentMode
          ? 'pointer-events-auto flex translate-x-0 opacity-100'
          : 'pointer-events-none hidden'
      }`}
      style={glassStyle}
      data-document-panel
      aria-hidden={!isDocumentMode}
    >
      <div className="border-b border-white/10 px-6 py-5">
        <h2
          className="text-[28px] leading-none tracking-tight text-white"
          style={{ fontFamily: 'var(--font-futura-display), sans-serif', fontWeight: 800 }}
        >
          Resume details
        </h2>
        <p
          className="mt-2 text-[13px] leading-snug text-white/45"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          Edit fields here — the canvas updates live. Drag entries to reorder.
        </p>
      </div>

      {/* Scrollable without a visible scrollbar */}
      <div
        className="flex-1 overflow-y-auto px-6 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ fontFamily: 'var(--font-poppins)' }}
      >
        {sections.length === 0 ? (
          <p className="py-6 text-[15px] text-white/50">
            No mapped fields yet. Convert again after adding template content.
          </p>
        ) : (
          sections.map((section) => (
            <SectionBlock
              key={section.id}
              section={section}
              onFocus={focusField}
              onChange={writeField}
              onAdd={addEntry}
              onRemove={removeEntry}
              onReorder={reorderEntry}
            />
          ))
        )}
      </div>
    </aside>
  );
}
