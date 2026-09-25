'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Poppins } from 'next/font/google';
import Image from 'next/image';
import {
  TEMPLATE_CATEGORIES,
  type TemplateCategoryFilter,
} from '@/app/features/resume_templates/types';
import { TEMPLATE_META } from '@/app/features/resume_templates/seeds';
import { TemplatePreview } from '@/app/features/resume_templates/preview';
import { applyTemplateToStorage } from '@/app/features/resume_templates/apply';
import { useResumeImport } from '@/app/features/resume_import/use.resume.import';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-poppins',
});

function TemplateCard({
  template,
  colIndex,
}: {
  template: (typeof TEMPLATE_META)[number];
  colIndex: number;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const previewAnchor = colIndex === 0 ? 'top-2 left-2' : 'top-2 right-2';
  const isBlank = !!template.blank;

  const handleUse = (e: React.MouseEvent) => {
    e.preventDefault();
    applyTemplateToStorage(template.id);
    router.push('/canvas');
  };

  return (
    <Link
      href="/canvas"
      className="group relative flex cursor-pointer flex-col no-underline focus:outline-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleUse}
    >
      <div
        className="relative overflow-hidden rounded-xl border bg-[#f4f3ef] transition-all duration-200"
        style={{
          aspectRatio: '794 / 1123',
          transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
          boxShadow: hovered
            ? '0 16px 32px -10px rgba(0,0,0,0.7)'
            : '0 4px 10px -4px rgba(0,0,0,0.4)',
          borderColor: hovered
            ? 'rgba(255,255,255,0.25)'
            : 'rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="h-full w-full transition-all duration-200"
          style={{ filter: hovered ? 'brightness(0.85)' : 'none' }}
        >
          <TemplatePreview templateId={template.id} blank={isBlank} />
        </div>

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
          <div
            className={`absolute ${previewAnchor} w-[55%] overflow-hidden rounded-lg border border-white/15 bg-white shadow-xl`}
            style={{ aspectRatio: '794 / 1123' }}
          >
            <TemplatePreview templateId={template.id} blank={isBlank} />
          </div>
          <div className="flex-1" />
          <div className="flex justify-center pb-0.5">
            <span
              className="rounded-lg border border-white/50 bg-black/60 px-4 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {isBlank ? 'Start Building' : 'Use this Template'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 px-0.5">
        <p
          className="text-sm font-bold text-white"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          {template.name}
        </p>
        <p
          className="mt-0.5 text-[10px] uppercase tracking-widest text-white/35"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          {template.category} · {template.tag}
        </p>
      </div>
    </Link>
  );
}

export default function TemplatesAreaMobile() {
  const [active, setActive] = useState<TemplateCategoryFilter>('All');
  const { openPicker, inputProps, error } = useResumeImport();

  const filtered =
    active === 'All'
      ? TEMPLATE_META
      : TEMPLATE_META.filter((t) => t.category === active);

  return (
    <section className={`relative z-10 w-full ${poppins.variable}`}>
      <div className="flex gap-2 overflow-x-auto px-4 py-4 no-scrollbar">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActive(cat)}
            className="flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors"
            style={{
              fontFamily: 'var(--font-poppins)',
              background:
                cat === active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)',
              color: cat === active ? '#fff' : 'rgba(255,255,255,0.5)',
              border:
                cat === active
                  ? '1px solid rgba(255,255,255,0.35)'
                  : '1px solid transparent',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 pb-4">
        <span
          className="text-sm font-semibold text-white"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          Browse Templates
        </span>
        <button
          type="button"
          onClick={openPicker}
          className="flex items-center gap-1.5 text-xs text-white/60"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          <Image
            src="/assets/icons/folder_icon.svg"
            alt=""
            width={14}
            height={14}
            draggable={false}
            className="pointer-events-none select-none opacity-50"
          />
          Upload yours
        </button>
        <input {...inputProps} />
      </div>
      {error && (
        <p
          className="-mt-2 px-4 pb-4 text-right text-[11px] text-red-400"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 px-4 pb-16">
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
