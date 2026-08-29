'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { FolderUp } from 'lucide-react';
import SpecularButton from '@/components/specular_button';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-poppins',
});

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Template data ────────────────────────────────────────────────────────────

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

// ─── Fake resume line primitives ──────────────────────────────────────────────

const LINE_DARK = 'bg-neutral-300 rounded-sm';
const LINE_DARK_FULL = 'bg-neutral-800 rounded-sm';

/** One thin "text" line */
function FakeLine({ w = 'w-full', h = 'h-1.5', color = LINE_DARK, mt = '' }: {
  w?: string; h?: string; color?: string; mt?: string;
}) {
  return <div className={`${h} ${w} ${color} ${mt}`} />;
}

/** Renders a CSS-only fake resume preview for each template variant */
function ResumePreview({ variant }: { variant: PreviewVariant }) {

  if (variant === 'blank') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-neutral-300/60">
          <div className="h-8 w-8 rounded border-2 border-dashed border-neutral-300/40" />
          <span className="text-[9px] uppercase tracking-widest">Blank</span>
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className="flex h-full gap-2">
        <div className="w-[32%] rounded-sm bg-neutral-800 p-1.5 flex flex-col gap-1.5">
          <FakeLine w="w-[70%]" h="h-2" color={LINE_DARK_FULL} />
          <FakeLine w="w-[50%]" h="h-1.5" color="bg-neutral-600 rounded-sm" />
          <div className="mt-1.5 flex flex-col gap-1">
            {[80,60,70,55,65].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} color="bg-neutral-600 rounded-sm" />)}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 pt-0.5">
          <FakeLine w="w-[60%]" h="h-2.5" color="bg-neutral-300 rounded-sm" />
          {[95,88,80,95,85,70,90,78].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
        </div>
      </div>
    );
  }

  if (variant === 'centered') {
    return (
      <div className="flex h-full flex-col items-center gap-1.5 pt-1">
        <FakeLine w="w-[55%]" h="h-2.5" color="bg-neutral-700 rounded-sm" />
        <FakeLine w="w-[40%]" h="h-1.5" color="bg-neutral-400 rounded-sm" />
        <div className="my-1 h-px w-full bg-neutral-300" />
        {[88,70,88,65,88,75,88,60].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
        <div className="mt-1 h-px w-full bg-neutral-300" />
        {[88,75,60].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
      </div>
    );
  }

  if (variant === 'accent') {
    return (
      <div className="relative h-full">
        <div className="absolute right-0 top-0 h-full w-[34%] rounded-r-sm bg-neutral-800" />
        <div className="relative z-10 flex flex-col gap-1.5 pt-1">
          <FakeLine w="w-[50%]" h="h-2.5" color="bg-neutral-700 rounded-sm" />
          <FakeLine w="w-[38%]" color="bg-neutral-400 rounded-sm" />
          <div className="mt-2 flex flex-col gap-1">
            {[60,48,55,42,58].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="flex h-full flex-col gap-1.5 pt-1">
        <FakeLine w="w-[50%]" h="h-2.5" color="bg-neutral-700 rounded-sm" />
        <FakeLine w="w-[35%]" color="bg-neutral-400 rounded-sm" />
        <div className="my-1.5 h-px w-full bg-neutral-200" />
        {[85,68,85,60,85,72].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
        <div className="my-1.5 h-px w-full bg-neutral-200" />
        {[85,65,50].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
      </div>
    );
  }

  if (variant === 'two-col') {
    return (
      <div className="flex h-full flex-col gap-1.5 pt-1">
        <FakeLine w="w-[65%]" h="h-2.5" color="bg-neutral-700 rounded-sm" />
        <div className="mt-1 flex gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <FakeLine w="w-[70%]" h="h-2" color="bg-neutral-500 rounded-sm" />
            {[95,85,90,75,88].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <FakeLine w="w-[70%]" h="h-2" color="bg-neutral-500 rounded-sm" />
            {[90,80,85,70,82].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex h-full flex-col gap-1 pt-0.5">
        <div className="flex items-baseline justify-between">
          <FakeLine w="w-[45%]" h="h-2.5" color="bg-neutral-700 rounded-sm" />
          <FakeLine w="w-[30%]" h="h-1.5" color="bg-neutral-400 rounded-sm" />
        </div>
        <div className="my-1 h-px w-full bg-neutral-300" />
        {[95,80,95,75,95,82,95,70,95,78].map((w,i)=><FakeLine key={i} w={`w-[${w}%]`} />)}
      </div>
    );
  }

  // timeline
  return (
    <div className="flex h-full flex-col gap-0 pt-1">
      <FakeLine w="w-[50%]" h="h-2.5" color="bg-neutral-700 rounded-sm" />
      <div className="mt-2 flex flex-col gap-3">
        {[0,1,2].map(i=>(
          <div key={i} className="flex gap-2">
            <div className="flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-neutral-400" />
              <div className="flex-1 w-px bg-neutral-200" />
            </div>
            <div className="flex flex-1 flex-col gap-1 pb-1">
              <FakeLine w="w-[60%]" h="h-2" color="bg-neutral-500 rounded-sm" />
              <FakeLine w="w-[88%]" />
              <FakeLine w="w-[75%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Single template card ──────────────────────────────────────────────────────

function TemplateCard({ template, colIndex }: { template: Template; colIndex: number }) {
  const [hovered, setHovered] = useState(false);
  // Mini preview anchors to top-left for cols 0-1, top-right for cols 2-3
  const previewAnchor = colIndex >= 2 ? 'top-2 right-2' : 'top-2 left-2';
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
        className="relative overflow-hidden rounded-xl border border-white/10 bg-[#f4f3ef] transition-all duration-200"
        style={{
          aspectRatio: '3/4',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: hovered ? '0 20px 40px -12px rgba(0,0,0,0.7)' : '0 4px 12px -4px rgba(0,0,0,0.4)',
          borderColor: hovered ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
        }}
      >
        {/* Resume content — barely dims on hover */}
        <div
          className="h-full w-full p-4 transition-all duration-200"
          style={{
            filter: hovered ? 'brightness(0.85)' : 'none',
          }}
        >
          <ResumePreview variant={template.variant} />
        </div>

        {/* Liquid glass overlay — very subtle frosted pane */}
        <div
          className="absolute inset-0 flex flex-col justify-between p-3 transition-opacity duration-200"
          style={{
            opacity: hovered ? 1 : 0,
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(4px) saturate(120%)',
            WebkitBackdropFilter: 'blur(4px) saturate(120%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          {/* Mini resume preview — top-left or top-right */}
          <div className={`absolute ${previewAnchor} w-[58%] overflow-hidden rounded-lg border border-white/15 bg-[#f4f3ef] shadow-xl`}
            style={{ aspectRatio: '3/4' }}>
            <div className="h-full w-full p-2.5">
              <ResumePreview variant={template.variant} />
            </div>
          </div>

          {/* Spacer so button stays at bottom */}
          <div className="flex-1" />

          {/* "Use this Template" button — bottom center */}
          <div className="flex justify-center pb-1">
            <span
              className="rounded-lg border border-white/50 bg-black/60 px-5 py-2 text-xs font-bold text-white backdrop-blur-sm transition-transform duration-150 group-active:scale-95"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {template.blank ? 'Start Building' : 'Use this Template'}
            </span>
          </div>
        </div>
      </div>

      {/* Card label */}
      <div className="mt-2.5 px-1">
        <p
          className="text-sm font-bold text-white"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          {template.name}
        </p>
        <p
          className="mt-0.5 text-xs uppercase tracking-widest text-white/35"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          {template.category} · {template.tag}
        </p>
      </div>
    </Link>
  );
}

// ─── Main area component ───────────────────────────────────────────────────────

export default function TemplatesAreaWeb() {
  const [active, setActive] = useState<Category>('All');

  const filtered = active === 'All'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === active);

  return (
    <section className={`relative z-10 w-full ${poppins.variable}`}>
      {/* Category filter row */}
      <div className="flex items-center gap-3 px-16 py-6">
        {CATEGORIES.map((cat) => (
          <SpecularButton
            key={cat}
            radius={999}
            size="md"
            tint="#0b0d12"
            tintOpacity={1}
            textColor={cat === active ? '#ffffff' : 'rgba(255,255,255,0.5)'}
            intensity={cat === active ? 1 : 0.4}
            onClick={() => setActive(cat)}
            style={{
              fontFamily: 'var(--font-poppins)',
              fontWeight: 600,
              minWidth: 140,
              outline: cat === active ? '1.5px solid rgba(255,255,255,0.5)' : 'none',
            }}
          >
            {cat}
          </SpecularButton>
        ))}
      </div>

      {/* Browse / Upload row */}
      <div className="flex items-center justify-between px-16 pb-5">
        <span
          className="text-sm font-semibold text-white"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          Browse Templates
        </span>
        <button
          className="flex items-center gap-2 text-sm text-white/60 transition-colors duration-200 hover:text-white"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
        >
          <FolderUp size={16} className="text-white/50" />
          Upload yours
        </button>
      </div>

      {/* Template grid — 4 columns, overflow visible so preview modals escape */}
      <div
        className="grid gap-x-6 gap-y-12 px-16 pb-20"
        style={{ gridTemplateColumns: 'repeat(4, 1fr)', overflow: 'visible' }}
      >
        {filtered.map((template, i) => (
          <TemplateCard
            key={template.id}
            template={template}
            colIndex={i % 4}
          />
        ))}
      </div>
    </section>
  );
}
