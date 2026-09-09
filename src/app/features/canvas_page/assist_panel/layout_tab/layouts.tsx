'use client';

import { useState } from 'react';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { clearCanvasState } from '../../services/canvas.persistence';

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

// Template data matching the templates page
interface Template {
  id: string;
  name: string;
  tag: string;
  category: 'Tech / CS' | 'Business' | 'Creative' | 'General';
  variant: 'blank' | 'sidebar' | 'centered' | 'accent' | 'minimal' | 'two-col' | 'compact' | 'timeline';
  blank?: boolean;
}

const TEMPLATES: Template[] = [
  { id: 'blank', name: 'Design from scratch', tag: 'Blank canvas', category: 'General', variant: 'blank', blank: true },
  { id: 'sidebar', name: 'Sidebar Pro', tag: 'Sidebar layout', category: 'Tech / CS', variant: 'sidebar' },
  { id: 'centered', name: 'Executive', tag: 'Centered · classic', category: 'Business', variant: 'centered' },
  { id: 'accent', name: 'Bold Accent', tag: 'Accent block', category: 'Creative', variant: 'accent' },
  { id: 'minimal', name: 'Minimal', tag: 'Simple · top-down', category: 'General', variant: 'minimal' },
  { id: 'two-col', name: 'Two Column', tag: 'Dual column', category: 'Tech / CS', variant: 'two-col' },
  { id: 'compact', name: 'Compact', tag: 'Dense · info-rich', category: 'Business', variant: 'compact' },
  { id: 'timeline', name: 'Timeline', tag: 'Chronological', category: 'Creative', variant: 'timeline' },
];

const CATEGORIES: Array<'Tech / CS' | 'Business' | 'Creative' | 'General'> = ['Tech / CS', 'Business', 'Creative', 'General'];

// Template preview components
const LINE_DARK = 'bg-neutral-300 rounded-sm';
const LINE_DARK_FULL = 'bg-neutral-800 rounded-sm';

function FakeLine({ w = 'w-full', h = 'h-1.5', color = LINE_DARK }: {
  w?: string; h?: string; color?: string;
}) {
  return <div className={`${h} ${w} ${color}`} />;
}

function ResumePreview({ variant }: { variant: Template['variant'] }) {
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
            {[80, 60, 70, 55, 65].map((w, i) => <FakeLine key={i} w={`w-[${w}%]`} color="bg-neutral-600 rounded-sm" />)}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 pt-0.5">
          <FakeLine w="w-[60%]" h="h-2.5" color="bg-neutral-300 rounded-sm" />
          {[95, 88, 80, 95, 85, 70, 90, 78].map((w, i) => <FakeLine key={i} w={`w-[${w}%]`} />)}
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
        {[88, 70, 88, 65, 88, 75, 88, 60].map((w, i) => <FakeLine key={i} w={`w-[${w}%]`} />)}
        <div className="mt-1 h-px w-full bg-neutral-300" />
        {[88, 75, 60].map((w, i) => <FakeLine key={i} w={`w-[${w}%]`} />)}
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
            {[60, 48, 55, 42, 58].map((w, i) => <FakeLine key={i} w={`w-[${w}%]`} />)}
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
        {[85, 68, 85, 60, 85, 72].map((w, i) => <FakeLine key={i} w={`w-[${w}%]`} />)}
        <div className="my-1.5 h-px w-full bg-neutral-200" />
        {[85, 65, 50].map((w, i) => <FakeLine key={i} w={`w-[${w}%]`} />)}
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
            {[95, 85, 90, 75, 88].map((w, i) => <FakeLine key={i} w={`w-[${w}%]`} />)}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <FakeLine w="w-[70%]" h="h-2" color="bg-neutral-500 rounded-sm" />
            {[90, 80, 85, 70, 82].map((w, i) => <FakeLine key={i} w={`w-[${w}%]`} />)}
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
        {[95, 80, 95, 75, 95, 82, 95, 70, 95, 78].map((w, i) => <FakeLine key={i} w={`w-[${w}%]`} />)}
      </div>
    );
  }

  // timeline
  return (
    <div className="flex h-full flex-col gap-0 pt-1">
      <FakeLine w="w-[50%]" h="h-2.5" color="bg-neutral-700 rounded-sm" />
      <div className="mt-2 flex flex-col gap-3">
        {[0, 1, 2].map(i => (
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

export default function Layouts() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleTemplateClick = (template: Template) => {
    // If "Start from Scratch" (blank template) is selected, clear all saved canvas state
    if (template.blank) {
      clearCanvasState();
      // Reload the page to start with a fresh canvas
      window.location.reload();
    }
    // TODO: Add logic for other templates
  };

  const filteredTemplates = selectedCategory
    ? TEMPLATES.filter(t => t.category === selectedCategory)
    : TEMPLATES;

  const handleCategoryClick = (category: string) => {
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedCategory(category);
      setIsAnimating(false);
    }, 300);
  };

  const handleBackClick = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedCategory(null);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className={`flex flex-col h-full ${poppins.variable} ${futuraDisplay.variable} relative`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-3">
          {/* Layout icon next to title */}
          <Image 
            src="/assets/icons/layout_icon.png" 
            alt="Layout" 
            width={32} 
            height={32}
            className="opacity-90"
          />
          <h1
            className="text-white leading-tight"
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
          className="text-white/70 leading-relaxed"
          style={{
            fontFamily: 'var(--font-poppins)',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          Same content, different structure — pick what fits the field.
        </p>
      </div>

      {/* Templates Grid with pop-off/pop-in animation */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory || 'categories'}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="grid grid-cols-2 gap-4"
          >
            {!selectedCategory ? (
              // Show categories
              CATEGORIES.map((category, index) => (
                <motion.button
                  key={category}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  onClick={() => handleCategoryClick(category)}
                  className="group relative flex flex-col gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {/* Category Card */}
                  <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-neutral-100 p-3 shadow-lg group-hover:shadow-xl transition-shadow">
                    <ResumePreview variant={TEMPLATES.find(t => t.category === category)?.variant || 'minimal'} />
                  </div>

                  {/* Category Name */}
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
              ))
            ) : (
              // Show templates for selected category
              filteredTemplates.map((template, index) => (
                <motion.button
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="group relative flex flex-col gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {/* Template Card */}
                  <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-neutral-100 p-3 shadow-lg group-hover:shadow-xl transition-shadow">
                    <ResumePreview variant={template.variant} />
                  </div>

                  {/* Template Name & Tag */}
                  <div className="text-center">
                    <span
                      className="text-white/90 block"
                      style={{
                        fontFamily: 'var(--font-poppins)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      {template.name}
                    </span>
                    <span
                      className="text-white/50 text-xs"
                      style={{
                        fontFamily: 'var(--font-poppins)',
                        fontWeight: 400,
                      }}
                    >
                      {template.tag}
                    </span>
                  </div>
                </motion.button>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Back button - positioned at bottom left corner */}
      {selectedCategory && (
        <div className="absolute bottom-6 left-6">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm"
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
    </div>
  );
}
