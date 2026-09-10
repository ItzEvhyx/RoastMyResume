'use client';

import { useState } from 'react';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { TEMPLATE_META } from '@/app/features/resume_templates/seeds';
import { TemplatePreview } from '@/app/features/resume_templates/preview';
import { useApplyTemplate } from '@/app/features/resume_templates/use.apply.template';
import type { TemplateCategory } from '@/app/features/resume_templates/types';
import SwapLayoutModal from './swap.layout.modal';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

const CATEGORIES: TemplateCategory[] = [
  'ATS Friendly',
  'Business',
  'Tech',
  'Generic',
];

export default function Layouts() {
  const applyTemplate = useApplyTemplate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);

  const filteredTemplates = selectedCategory
    ? TEMPLATE_META.filter((t) => t.category === selectedCategory)
    : TEMPLATE_META;

  const pendingMeta = pendingTemplateId
    ? TEMPLATE_META.find((t) => t.id === pendingTemplateId)
    : null;

  const handleTemplateClick = (templateId: string) => {
    setPendingTemplateId(templateId);
  };

  const confirmSwap = () => {
    if (!pendingTemplateId) return;
    applyTemplate(pendingTemplateId);
    setPendingTemplateId(null);
  };

  return (
    <div
      className={`relative flex h-full flex-col ${poppins.variable} ${futuraDisplay.variable}`}
    >
      <div className="p-6 pb-4">
        <div className="mb-3 flex items-center gap-3">
          <Image
            src="/assets/icons/layout_icon.png"
            alt="Layout"
            width={32}
            height={32}
            className="opacity-90"
          />
          <h1
            className="leading-tight text-white"
            style={{
              fontFamily: 'var(--font-futura-display)',
              fontWeight: 800,
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            }}
          >
            Swap Layout
          </h1>
        </div>
        <p
          className="leading-relaxed text-white/70"
          style={{
            fontFamily: 'var(--font-poppins)',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          Pick a new structure — your current canvas edits will be replaced.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory || 'categories'}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="grid grid-cols-2 gap-4"
          >
            {!selectedCategory
              ? CATEGORIES.map((category, index) => {
                  const sample =
                    TEMPLATE_META.find((t) => t.category === category) ??
                    TEMPLATE_META[0];
                  return (
                    <motion.button
                      key={category}
                      type="button"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      onClick={() => setSelectedCategory(category)}
                      className="group relative flex flex-col gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="relative aspect-[794/1123] overflow-hidden rounded-2xl bg-white p-0 shadow-lg transition-shadow group-hover:shadow-xl">
                        <TemplatePreview
                          templateId={sample.id}
                          blank={sample.blank}
                        />
                      </div>
                      <div className="text-center">
                        <span
                          className="text-white/90"
                          style={{
                            fontFamily: 'var(--font-poppins)',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                          }}
                        >
                          {category}
                        </span>
                      </div>
                    </motion.button>
                  );
                })
              : filteredTemplates.map((template, index) => (
                  <motion.button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateClick(template.id)}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="group relative flex flex-col gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="relative aspect-[794/1123] overflow-hidden rounded-2xl bg-white shadow-lg transition-shadow group-hover:shadow-xl">
                      <TemplatePreview
                        templateId={template.id}
                        blank={template.blank}
                      />
                    </div>
                    <div className="text-center">
                      <span
                        className="block text-white/90"
                        style={{
                          fontFamily: 'var(--font-poppins)',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        {template.name}
                      </span>
                      <span
                        className="text-xs text-white/50"
                        style={{
                          fontFamily: 'var(--font-poppins)',
                          fontWeight: 400,
                        }}
                      >
                        {template.tag}
                      </span>
                    </div>
                  </motion.button>
                ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {selectedCategory && (
        <div className="absolute bottom-6 left-6">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-white/70 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
            style={{
              fontFamily: 'var(--font-poppins)',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            <Image
              src="/assets/icons/back_icon.svg"
              alt="Back"
              width={16}
              height={16}
              className="opacity-70"
            />
            Back
          </button>
        </div>
      )}

      <SwapLayoutModal
        isOpen={!!pendingTemplateId}
        templateName={pendingMeta?.name ?? 'this template'}
        onCancel={() => setPendingTemplateId(null)}
        onConfirm={confirmSwap}
      />
    </div>
  );
}
