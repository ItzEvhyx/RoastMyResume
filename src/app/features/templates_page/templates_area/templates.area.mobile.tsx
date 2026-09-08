'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import Image from 'next/image';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-poppins',
});

// ─── Shared types + data (mirrors the web version) ───────────────────────────

const CATEGORIES = ['All', 'Tech / CS', 'Business', 'Creative', 'General'] as const;
type Category = typeof CATEGORIES[number];
type PreviewVariant = 'blank' | 'sidebar' | 'centered' | 'accent' | 'minimal' | 'two-col' | 'compact' | 'timeline';

interface Template {
  id: string;
  name: string;
  tag: string;
  category: Exclude<Category, 'All'>;
  variant: PreviewVariant;
  blank?: boolean;
}

const TEMPLATES: Template[] = [
  { id: 'blank',    name: 'Design from scratch', tag: 'Blank canvas',        category: 'General',   variant: 'blank',    blank: true },
  { id: 'sidebar',  name: 'Sidebar Pro',          tag: 'Sidebar layout',      category: 'Tech / CS', variant: 'sidebar'   },
  { id: 'centered', name: 'Executive',            tag: 'Centered · classic',  category: 'Business',  variant: 'centered'  },
  { id: 'accent',   name: 'Bold Accent',          tag: 'Accent block',        category: 'Creative',  variant: 'accent'    },
  { id: 'minimal',  name: 'Minimal',              tag: 'Simple · top-down',   category: 'General',   variant: 'minimal'   },
  { id: 'two-col',  name: 'Two Column',           tag: 'Dual column',         category: 'Tech / CS', variant: 'two-col'   },
  { id: 'compact',  name: 'Compact',              tag: 'Dense · info-rich',   category: 'Business',  variant: 'compact'   },
  { id: 'timeline', name: 'Timeline',             tag: 'Chronological',       category: 'Creative',  variant: 'timeline'  },
];

// ─── Fake resume preview ──────────────────────────────────────────────────────

function FakeLine({ w = 'w-full', h = 'h-1.5', color = 'bg-neutral-300 rounded-sm', mt = '' }: {
  w?: string; h?: string; color?: string; mt?: string;
}) {
  return <div className={`${h} ${w} ${color} ${mt}`} />;
}

function ResumePreview({ variant }: { variant: PreviewVariant }) {
  if (variant === 'blank') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-1.5 text-neutral-300/60">
          <div className="h-6 w-6 rounded border-2 border-dashed border-neutral-300/40" />
          <span className="text-[7px] uppercase tracking-widest">Blank</span>
        </div>
      </div>
    );
  }
  if (variant === 'sidebar') {
    return (
      <div className="flex h-full gap-1.5">
        <div className="w-[32%] rounded-sm bg-neutral-800 p-1 flex flex-col gap-1">
          <FakeLine w="w-[70%]" h="h-1.5" color="bg-neutral-200 rounded-sm" />
          <FakeLine w="w-[50%]" color="bg-neutral-600 rounded-sm" />
          {[80,60,70].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} color="bg-neutral-600 rounded-sm" />)}
        </div>
        <div className="flex flex-1 flex-col gap-1 pt-0.5">
          <FakeLine w="w-[60%]" h="h-2" color="bg-neutral-300 rounded-sm" />
          {[95,88,80,90,75].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
        </div>
      </div>
    );
  }
  if (variant === 'centered') {
    return (
      <div className="flex h-full flex-col items-center gap-1 pt-1">
        <FakeLine w="w-[55%]" h="h-2" color="bg-neutral-700 rounded-sm" />
        <div className="my-0.5 h-px w-full bg-neutral-300" />
        {[88,70,88,65,88,75,60].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
      </div>
    );
  }
  if (variant === 'accent') {
    return (
      <div className="relative h-full">
        <div className="absolute right-0 top-0 h-full w-[34%] rounded-r-sm bg-neutral-800" />
        <div className="relative z-10 flex flex-col gap-1 pt-1">
          <FakeLine w="w-[50%]" h="h-2" color="bg-neutral-700 rounded-sm" />
          {[60,48,55,42,58].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
        </div>
      </div>
    );
  }
  if (variant === 'minimal') {
    return (
      <div className="flex h-full flex-col gap-1 pt-1">
        <FakeLine w="w-[50%]" h="h-2" color="bg-neutral-700 rounded-sm" />
        <div className="my-1 h-px w-full bg-neutral-200" />
        {[85,68,85,60,72,85].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
      </div>
    );
  }
  if (variant === 'two-col') {
    return (
      <div className="flex h-full flex-col gap-1 pt-1">
        <FakeLine w="w-[65%]" h="h-2" color="bg-neutral-700 rounded-sm" />
        <div className="mt-1 flex gap-1.5">
          <div className="flex flex-1 flex-col gap-1">
            {[95,85,90,75].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            {[90,80,85,70].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
          </div>
        </div>
      </div>
    );
  }
  if (variant === 'compact') {
    return (
      <div className="flex h-full flex-col gap-1 pt-0.5">
        <div className="flex items-baseline justify-between">
          <FakeLine w="w-[45%]" h="h-2" color="bg-neutral-700 rounded-sm" />
          <FakeLine w="w-[28%]" h="h-1" color="bg-neutral-400 rounded-sm" />
        </div>
        <div className="my-0.5 h-px w-full bg-neutral-300" />
        {[95,80,95,75,95,82,78].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
      </div>
    );
  }
  // timeline
  return (
    <div className="flex h-full flex-col gap-0 pt-1">
      <FakeLine w="w-[50%]" h="h-2" color="bg-neutral-700 rounded-sm" />
      <div className="mt-1.5 flex flex-col gap-2">
        {[0,1,2].map(i=>(
          <div key={i} className="flex gap-1.5">
            <div className="flex flex-col items-center">
              <div className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <div className="flex-1 w-px bg-neutral-200" />
            </div>
            <div className="flex flex-1 flex-col gap-0.5 pb-0.5">
              <FakeLine w="w-[60%]" h="h-1.5" color="bg-neutral-500 rounded-sm" />
              <FakeLine w="w-[88%]" />
              <FakeLine w="w-[75%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Template card (2-column mobile layout) ───────────────────────────────────

function TemplateCard({ template, colIndex }: { template: Template; colIndex: number }) {
  const [hovered, setHovered] = useState(false);
  // 2-col: col 0 → preview top-left, col 1 → preview top-right
  const previewAnchor = colIndex === 0 ? 'top-2 left-2' : 'top-2 right-2';
  const href = template.blank || template.id === 'blank' ? '/canvas' : `/canvas?template=${template.id}`;

  return (
    <Link
      href={href}
      className="group relative flex cursor-pointer flex-col no-underline focus:outline-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Paper thumbnail */}
      <div
        className="relative overflow-hidden rounded-xl border bg-[#f4f3ef] transition-all duration-200"
        style={{
          aspectRatio: '3/4',
          transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
          boxShadow: hovered ? '0 16px 32px -10px rgba(0,0,0,0.7)' : '0 4px 10px -4px rgba(0,0,0,0.4)',
          borderColor: hovered ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
        }}
      >
        {/* Resume lines — barely dims on hover */}
        <div
          className="h-full w-full p-3 transition-all duration-200"
          style={{ filter: hovered ? 'brightness(0.85)' : 'none' }}
        >
          <ResumePreview variant={template.variant} />
        </div>

        {/* Liquid glass overlay — subtle frosted pane */}
        <div
          className="absolute inset-0 flex flex-col justify-between p-2.5 transition-opacity duration-200"
          style={{
            opacity: hovered ? 1 : 0,
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(4px) saturate(120%)',
            WebkitBackdropFilter: 'blur(4px) saturate(120%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          {/* Mini preview — top corner */}
          <div
            className={`absolute ${previewAnchor} w-[55%] overflow-hidden rounded-lg border border-white/15 bg-[#f4f3ef] shadow-xl`}
            style={{ aspectRatio: '3/4' }}
          >
            <div className="h-full w-full p-2">
              <ResumePreview variant={template.variant} />
            </div>
          </div>

          <div className="flex-1" />

          {/* Button — bottom center */}
          <div className="flex justify-center pb-1">
            <span
              className="rounded-lg border border-white/50 bg-black/60 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-sm transition-transform duration-150 group-active:scale-95"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {template.blank ? 'Start Building' : 'Use this Template'}
            </span>
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="mt-2 px-0.5">
        <p className="text-xs font-bold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
          {template.name}
        </p>
        <p className="mt-0.5 text-[10px] uppercase tracking-widest text-white/35" style={{ fontFamily: 'var(--font-poppins)' }}>
          {template.category} · {template.tag}
        </p>
      </div>
    </Link>
  );
}

// ─── Main mobile area ─────────────────────────────────────────────────────────

export default function TemplatesAreaMobile() {
  const [active, setActive] = useState<Category>('All');

  const filtered = active === 'All'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === active);

  return (
    <section className={`relative z-10 w-full ${poppins.variable}`}>
      {/* Category filter row — horizontal scroll so all chips fit */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 py-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className="shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-150"
            style={{
              fontFamily: 'var(--font-poppins)',
              background: cat === active ? '#ffffff' : '#141414',
              color: cat === active ? '#000000' : 'rgba(255,255,255,0.55)',
              borderColor: cat === active ? '#ffffff' : 'rgba(255,255,255,0.15)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Browse / Upload row */}
      <div className="flex items-center justify-between px-4 pb-4">
        <span className="text-xs font-semibold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
          Browse Templates
        </span>
        <button className="flex items-center gap-1.5 text-xs text-white/55 transition-colors hover:text-white"
          style={{ fontFamily: 'var(--font-poppins)' }}>
          <Image src="/assets/icons/folder_icon.svg" alt="folder" width={13} height={13} className="opacity-55" />
          Upload yours
        </button>
      </div>

      {/* 2-column grid */}
      <div
        className="grid gap-x-4 gap-y-8 px-4 pb-16"
        style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
      >
        {filtered.map((template, i) => (
          <TemplateCard
            key={template.id}
            template={template}
            colIndex={i % 2}
          />
        ))}
      </div>
    </section>
  );
}
