'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import { useText } from '../../context/TextContext';
import { useIcon } from '../../context/IconContext';

// ─────────────────────────────────────────────────────────────────────────────
// Fonts
// ─────────────────────────────────────────────────────────────────────────────
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
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — build Iconify SVG URLs
// Using Phosphor Icons (ph) for solid filled look,
// with mdi fallbacks for brand icons that only exist there.
// ─────────────────────────────────────────────────────────────────────────────
// All icons use mdi (Material Design Icons) — every icon is solid/filled by
// default and all names below have been verified to exist in the set.
// ─────────────────────────────────────────────────────────────────────────────
const mdi = (name: string) => `https://api.iconify.design/mdi/${name}.svg`;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface IconItem {
  iconId: string;
  name: string;
  cloudinaryUrl: string;
  svgUrl?: string;
}

function i(iconId: string, svgUrl: string): IconItem {
  return { iconId, name: iconId.split(':')[1], cloudinaryUrl: '', svgUrl };
}

// ─────────────────────────────────────────────────────────────────────────────
// Featured — 6 solid icons (2 rows × 3)
// ─────────────────────────────────────────────────────────────────────────────
const FEATURED_ICONS: IconItem[] = [
  i('mdi:email',              mdi('email')),
  i('mdi:phone',              mdi('phone')),
  i('mdi:map-marker',         mdi('map-marker')),
  i('mdi:linkedin',           mdi('linkedin')),
  i('mdi:web',                mdi('web')),
  i('mdi:briefcase',          mdi('briefcase')),
];

// ─────────────────────────────────────────────────────────────────────────────
// Categories — all icons use verified mdi names (solid/filled by default)
// ─────────────────────────────────────────────────────────────────────────────
interface CategoryDef {
  id: string;
  label: string;
  iconSvgUrl: string;
  icons: IconItem[];
}

const ICON_CATEGORIES: CategoryDef[] = [
  {
    id: 'contact',
    label: 'Contact',
    iconSvgUrl: mdi('email'),
    icons: [
      i('mdi:email',                    mdi('email')),
      i('mdi:phone',                    mdi('phone')),
      i('mdi:map-marker',               mdi('map-marker')),
      i('mdi:cellphone',                mdi('cellphone')),
      i('mdi:card-account-details',     mdi('card-account-details')),
      i('mdi:home',                     mdi('home')),
      i('mdi:chat',                     mdi('chat')),
      i('mdi:message',                  mdi('message')),
      i('mdi:calendar',                 mdi('calendar')),
      i('mdi:clock',                    mdi('clock')),
      i('mdi:whatsapp',                 mdi('whatsapp')),
      i('mdi:skype',                    mdi('skype')),
    ],
  },
  {
    id: 'social',
    label: 'Social & links',
    iconSvgUrl: mdi('web'),
    icons: [
      i('mdi:linkedin',                 mdi('linkedin')),
      i('mdi:github',                   mdi('github')),
      i('mdi:web',                      mdi('web')),
      i('mdi:twitter',                  mdi('twitter')),
      i('mdi:instagram',                mdi('instagram')),
      i('mdi:youtube',                  mdi('youtube')),
      i('mdi:dribbble',                 mdi('dribbble')),
      i('mdi:behance',                  mdi('behance')),
      i('mdi:link-variant',             mdi('link-variant')),
    ],
  },
  {
    id: 'experience',
    label: 'Experience',
    iconSvgUrl: mdi('briefcase'),
    icons: [
      i('mdi:briefcase',                mdi('briefcase')),
      i('mdi:office-building',          mdi('office-building')),
      i('mdi:account-tie',              mdi('account-tie')),
      i('mdi:calendar-range',           mdi('calendar-range')),
      i('mdi:chart-line',               mdi('chart-line')),
      i('mdi:handshake',                mdi('handshake')),
      i('mdi:rocket-launch',            mdi('rocket-launch')),
      i('mdi:human-male-board',         mdi('human-male-board')),
      i('mdi:presentation',             mdi('presentation')),
      i('mdi:tag',                      mdi('tag')),
      i('mdi:currency-usd',             mdi('currency-usd')),
      i('mdi:trending-up',              mdi('trending-up')),
      i('mdi:clipboard-text',           mdi('clipboard-text')),
      i('mdi:timer',                    mdi('timer')),
    ],
  },
  {
    id: 'education',
    label: 'Education',
    iconSvgUrl: mdi('school'),
    icons: [
      i('mdi:school',                   mdi('school')),
      i('mdi:book-open-variant',        mdi('book-open-variant')),
      i('mdi:certificate',              mdi('certificate')),
      i('mdi:human-male-board',         mdi('human-male-board')),
      i('mdi:pencil',                   mdi('pencil')),
      i('mdi:flask',                    mdi('flask')),
      i('mdi:telescope',                mdi('telescope')),
      i('mdi:brain',                    mdi('brain')),
      i('mdi:translate',                mdi('translate')),
      i('mdi:calculator',               mdi('calculator')),
    ],
  },
  {
    id: 'skills',
    label: 'Skills',
    iconSvgUrl: mdi('code-tags'),
    icons: [
      i('mdi:code-tags',                mdi('code-tags')),
      i('mdi:language-javascript',      mdi('language-javascript')),
      i('mdi:language-typescript',      mdi('language-typescript')),
      i('mdi:language-python',          mdi('language-python')),
      i('mdi:react',                    mdi('react')),
      i('mdi:nodejs',                   mdi('nodejs')),
      i('mdi:database',                 mdi('database')),
      i('mdi:docker',                   mdi('docker')),
      i('mdi:git',                      mdi('git')),
      i('mdi:aws',                      mdi('aws')),
      i('mdi:cloud',                    mdi('cloud')),
      i('mdi:linux',                    mdi('linux')),
      i('mdi:lightbulb',                mdi('lightbulb')),
      i('mdi:palette',                  mdi('palette')),
      i('mdi:magnify',                  mdi('magnify')),
      i('mdi:vector-pen',               mdi('vector-pen')),
    ],
  },
  {
    id: 'certifications',
    label: 'Certifications & awards',
    iconSvgUrl: mdi('medal'),
    icons: [
      i('mdi:medal',                    mdi('medal')),
      i('mdi:trophy',                   mdi('trophy')),
      i('mdi:certificate',              mdi('certificate')),
      i('mdi:star',                     mdi('star')),
      i('mdi:check-circle',             mdi('check-circle')),
      i('mdi:ribbon',                   mdi('ribbon')),
      i('mdi:crown',                    mdi('crown')),
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    iconSvgUrl: mdi('folder'),
    icons: [
      i('mdi:folder',                   mdi('folder')),
      i('mdi:file-document',            mdi('file-document')),
      i('mdi:code-braces',              mdi('code-braces')),
      i('mdi:monitor',                  mdi('monitor')),
      i('mdi:web',                      mdi('web')),
      i('mdi:github',                   mdi('github')),
      i('mdi:launch',                   mdi('launch')),
      i('mdi:puzzle',                   mdi('puzzle')),
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Glass style
// ─────────────────────────────────────────────────────────────────────────────
const glassStyle: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.55)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
};

// ─────────────────────────────────────────────────────────────────────────────
// Recently used
// ─────────────────────────────────────────────────────────────────────────────
const RECENT_KEY = 'rmr_recent_icons';
const MAX_RECENT = 20;

function getRecentIcons(): IconItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); }
  catch { return []; }
}

function pushRecentIcon(icon: IconItem) {
  const next = [icon, ...getRecentIcons().filter(x => x.iconId !== icon.iconId)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
const TILE_SIZE = 80;
const ICON_SIZE = 36;

function IconTile({ icon, onSelect }: { icon: IconItem; onSelect: (i: IconItem) => void }) {
  const src = icon.svgUrl ?? icon.cloudinaryUrl;
  return (
    <button
      title={icon.name}
      onClick={() => onSelect(icon)}
      className="flex items-center justify-center rounded-xl transition-all duration-150 hover:bg-white/15 active:scale-90"
      style={{ width: TILE_SIZE, height: TILE_SIZE, flexShrink: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={icon.name}
        width={ICON_SIZE}
        height={ICON_SIZE}
        style={{ filter: 'invert(1)', objectFit: 'contain', display: 'block' }}
        loading="lazy"
      />
    </button>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-1 py-1">
      <span
        className="text-xs text-white/70"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700, whiteSpace: 'nowrap' }}
      >
        {label}
      </span>
      <div className="h-px flex-1 bg-white/15" />
    </div>
  );
}

function IconGrid({ icons, onSelect }: { icons: IconItem[]; onSelect: (i: IconItem) => void }) {
  if (icons.length === 0) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', padding: '0 4px' }}>
      {icons.map(icon => (
        <IconTile key={icon.iconId} icon={icon} onSelect={onSelect} />
      ))}
    </div>
  );
}

function CategoryRow({ category, onClick }: { category: CategoryDef; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-all duration-150 hover:bg-white/10 active:scale-[0.98]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={category.iconSvgUrl}
        alt={category.label}
        width={20}
        height={20}
        style={{ filter: 'invert(0.65)', objectFit: 'contain', flexShrink: 0 }}
        loading="lazy"
      />
      <span
        className="flex-1 text-left text-sm text-white/80"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
      >
        {category.label}
      </span>
      <span
        className="text-xs text-white/35 tabular-nums"
        style={{ fontFamily: 'var(--font-poppins)' }}
      >
        {category.icons.length}
      </span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white/35 shrink-0">
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide panel — animates content in from the right, out to the right
// ─────────────────────────────────────────────────────────────────────────────
function SlidePanel({
  children,
  active,
  onSearchClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onSearchClick: () => void;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-y-auto"
      style={{
        transform: active ? 'translateX(0)' : 'translateX(100%)',
        opacity: active ? 1 : 0,
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        padding: '0 12px',
        gap: '8px',
      }}
    >
      <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
      {children}

      {/* "Didn't find what you want?" nudge */}
      <div className="flex flex-col items-center gap-3 py-8 mt-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mdi('magnify')}
          alt="search"
          width={52}
          height={52}
          style={{ filter: 'invert(0.4)', objectFit: 'contain' }}
        />
        <p
          className="text-center text-xs text-white/40 leading-relaxed px-4"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
        >
          Didn't find what you want?
          <br />
          <button
            onClick={onSearchClick}
            className="text-white/60 underline underline-offset-2 hover:text-white transition-colors"
            style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
          >
            Try searching for it
          </button>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function IconPicker() {
  const { toolbarExpanded, activeTool } = useText();
  const { addIconElement } = useIcon();

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<IconItem[]>([]);
  const [recentIcons, setRecentIcons] = useState<IconItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const shouldShow = toolbarExpanded && activeTool === 'iconset';
  const isSearchMode = searchQuery.trim().length > 0;
  const activeCategory = openCategory
    ? ICON_CATEGORIES.find(c => c.id === openCategory) ?? null
    : null;

  // ── Load recently used when panel opens ───────────────────────────────────
  useEffect(() => {
    if (shouldShow) setRecentIcons(getRecentIcons());
  }, [shouldShow]);

  // ── Debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!searchQuery.trim()) { setSearchResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const res = await fetch(
          `/api/icons/search?q=${encodeURIComponent(searchQuery.trim())}&limit=50`,
          { signal: abortRef.current.signal },
        );
        const data = await res.json() as { icons?: IconItem[] };
        setSearchResults(data.icons ?? []);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') setSearchResults([]);
      } finally { setIsSearching(false); }
    }, 350);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  const handleSelect = useCallback((icon: IconItem) => {
    pushRecentIcon(icon);
    setRecentIcons(getRecentIcons());
    const CANVAS_WIDTH = 794;
    const CANVAS_HEIGHT = 1123;
    const DEFAULT_SIZE = 48;
    addIconElement(
      Math.round(CANVAS_WIDTH / 2 - DEFAULT_SIZE / 2),
      Math.round(CANVAS_HEIGHT / 2 - DEFAULT_SIZE / 2),
      icon.svgUrl ?? icon.cloudinaryUrl,
      DEFAULT_SIZE,
    );
  }, [addIconElement]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' || e.key === 'Delete') e.stopPropagation();
  };

  const focusSearch = () => {
    setOpenCategory(null);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FUTURA_STYLE }} />

      <div
        className={`fixed left-[110px] z-40 flex flex-col rounded-3xl ${poppins.variable}`}
        style={{
          top: 'calc(50% - (100vh - 200px) / 2 + 40px)',
          width: '290px',
          height: 'calc(100vh - 200px)',
          maxHeight: '600px',
          ...glassStyle,
          opacity: shouldShow ? 1 : 0,
          transform: shouldShow ? 'scale(1) translateX(0)' : 'scale(0.85) translateX(-12px)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          pointerEvents: shouldShow ? 'auto' : 'none',
          overflow: 'hidden', // clip slide panels
        }}
        onMouseDown={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          {activeCategory ? (
            <button
              onClick={() => setOpenCategory(null)}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontFamily: 'FuturaDisplay, sans-serif', fontSize: '20px', color: 'inherit', lineHeight: 1 }}>
                {activeCategory.label}
              </span>
            </button>
          ) : (
            <span style={{ fontFamily: 'FuturaDisplay, sans-serif', fontSize: '24px', color: '#fff', letterSpacing: '0.01em', lineHeight: 1 }}>
              Icons
            </span>
          )}
          <Image
            src="/assets/icons/icons_menu_icon.svg"
            alt="Icons menu"
            width={22}
            height={22}
            className="opacity-60 select-none pointer-events-none"
            draggable={false}
          />
        </div>

        {/* ── Search bar ───────────────────────────────────────────────── */}
        <div className="px-3 pb-3 shrink-0">
          <div
            className="flex items-center gap-2 rounded-2xl px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for an icon..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setOpenCategory(null); }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-sm text-white outline-none icon-picker-search"
              style={{
                fontFamily: 'var(--font-poppins)',
                fontWeight: 400,
                // placeholder colour via CSS since className placeholder-* doesn't affect font
              }}
            />
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-55">
              <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2.2" />
              <path d="M16.5 16.5L21 21" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* ── Sliding content area ─────────────────────────────────────── */}
        {/* Wrapper — relative, fills remaining space, clips overflow */}
        <div className="relative flex-1 min-h-0">

          {/* ── Home view (search / default) ─────────────────────────── */}
          <div
            className="absolute inset-0 overflow-y-auto flex flex-col gap-2 px-3 pb-3"
            style={{
              transform: activeCategory ? 'translateX(-40%)' : 'translateX(0)',
              opacity: activeCategory ? 0 : 1,
              transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              pointerEvents: activeCategory ? 'none' : 'auto',
            }}
          >
            <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

            {isSearchMode ? (
              <>
                <SectionLabel label={isSearching ? 'Searching…' : `Results (${searchResults.length})`} />
                {!isSearching && searchResults.length === 0 && (
                  <p className="px-1 text-xs text-white/40" style={{ fontFamily: 'var(--font-poppins)' }}>
                    No icons found for "{searchQuery}"
                  </p>
                )}
                <IconGrid icons={searchResults} onSelect={handleSelect} />
              </>
            ) : (
              <>
                <SectionLabel label="Featured" />
                <IconGrid icons={FEATURED_ICONS} onSelect={handleSelect} />
                <div className="mx-1 h-px bg-white/10 my-1" />
                <SectionLabel label="Categories" />
                <div className="flex flex-col">
                  {ICON_CATEGORIES.map(cat => (
                    <CategoryRow
                      key={cat.id}
                      category={cat}
                      onClick={() => setOpenCategory(cat.id)}
                    />
                  ))}
                </div>
                <div className="h-2" />
              </>
            )}
          </div>

          {/* ── Category drill-down view ──────────────────────────────── */}
          {ICON_CATEGORIES.map(cat => (
            <SlidePanel
              key={cat.id}
              active={openCategory === cat.id}
              onSearchClick={focusSearch}
            >
              <SectionLabel label={cat.label} />
              <IconGrid icons={cat.icons} onSelect={handleSelect} />
            </SlidePanel>
          ))}
        </div>

        {/* ── Recently used — sticky footer ─────────────────────────────── */}
        {recentIcons.length > 0 && !isSearchMode && !activeCategory && (
          <div
            className="shrink-0 px-3 pb-3 pt-2"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(25, 27, 33, 0.85)',
              backdropFilter: 'blur(12px)',
              borderBottomLeftRadius: '24px',
              borderBottomRightRadius: '24px',
            }}
          >
            <SectionLabel label="Recently used" />
            <div
              className="flex gap-1 overflow-x-auto pt-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
              {recentIcons.map(icon => (
                <IconTile key={icon.iconId} icon={icon} onSelect={handleSelect} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Placeholder colour — injected globally since Tailwind placeholder-* doesn't affect font */}
      <style>{`
        .icon-picker-search::placeholder {
          color: rgba(255,255,255,0.4);
          font-family: var(--font-poppins);
          font-weight: 400;
        }
      `}</style>
    </>
  );
}
