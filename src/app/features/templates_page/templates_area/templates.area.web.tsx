'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Poppins } from 'next/font/google';
import Image from 'next/image';
import SpecularButton from '@/components/specular_button';
import {
  TEMPLATE_CATEGORIES,
  type TemplateCategoryFilter,
} from '@/app/features/resume_templates/types';
import { TEMPLATE_META } from '@/app/features/resume_templates/seeds';
import { TemplatePreview } from '@/app/features/resume_templates/preview';
import { applyTemplateToStorage } from '@/app/features/resume_templates/apply';

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
  const previewAnchor = colIndex >= 2 ? 'top-2 right-2' : 'top-2 left-2';
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
        className="relative overflow-hidden rounded-xl border border-white/10 bg-[#f4f3ef] transition-all duration-200"
        style={{
          aspectRatio: '794 / 1123',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: hovered
            ? '0 20px 40px -12px rgba(0,0,0,0.7)'
            : '0 4px 12px -4px rgba(0,0,0,0.4)',
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
          <div
            className={`absolute ${previewAnchor} w-[58%] overflow-hidden rounded-lg border border-white/15 bg-white shadow-xl`}
            style={{ aspectRatio: '794 / 1123' }}
          >
            <TemplatePreview templateId={template.id} blank={isBlank} />
          </div>

          <div className="flex-1" />

          <div className="flex justify-center pb-1">
            <span
              className="rounded-lg border border-white/50 bg-black/60 px-5 py-2 text-xs font-bold text-white backdrop-blur-sm transition-transform duration-150 group-active:scale-95"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {isBlank ? 'Start Building' : 'Use this Template'}
            </span>
          </div>
        </div>
      </div>

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

export default function TemplatesAreaWeb() {
  const [active, setActive] = useState<TemplateCategoryFilter>('All');

  const filtered =
    active === 'All'
      ? TEMPLATE_META
      : TEMPLATE_META.filter((t) => t.category === active);

  return (
    <section className={`relative z-10 w-full ${poppins.variable}`}>
      <div className="flex flex-wrap items-center gap-3 px-16 py-6">
        {TEMPLATE_CATEGORIES.map((cat) => (
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
              outline:
                cat === active ? '1.5px solid rgba(255,255,255,0.5)' : 'none',
            }}
          >
            {cat}
          </SpecularButton>
        ))}
      </div>

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
          <Image
            src="/assets/icons/folder_icon.svg"
            alt="folder"
            width={16}
            height={16}
            draggable={false}
            className="pointer-events-none select-none opacity-50"
          />
          Upload yours
        </button>
      </div>

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
