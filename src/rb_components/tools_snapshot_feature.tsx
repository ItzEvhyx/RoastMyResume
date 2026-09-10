'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const ICON_COLOR = '#0f1016';

/** Canvas sidebar tools (7) + layers — 8 icons, 2×4. */
const TOOL_ICONS = [
  { src: '/assets/tools_icons/font_style_icon.svg', label: 'Text' },
  { src: '/assets/tools_icons/divider_icon.svg', label: 'Divider' },
  { src: '/assets/tools_icons/iconset_icon.svg', label: 'Icon set' },
  { src: '/assets/tools_icons/image_upload_icon.svg', label: 'Image upload' },
  { src: '/assets/tools_icons/container_icon.svg', label: 'Container' },
  { src: '/assets/tools_icons/pen_icon.svg', label: 'Pen' },
  { src: '/assets/tools_icons/shapes_icon.svg', label: 'Shapes' },
  { src: '/assets/tools_icons/layer_icon.svg', label: 'Layers' },
] as const;

const ROW_1 = TOOL_ICONS.slice(0, 4);
const ROW_2 = TOOL_ICONS.slice(4, 8);

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.35 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 420, damping: 16, mass: 0.7 },
  },
};

function TintedIcon({ src, label }: { src: string; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="block h-14 w-14 sm:h-16 sm:w-16"
      style={{
        backgroundColor: ICON_COLOR,
        WebkitMaskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskImage: `url(${src})`,
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskSize: 'contain',
      }}
    />
  );
}

/**
 * Features “Tools snapshot” — 2×4 canvas tool icons with a center divider,
 * staggered pop-in when the card scrolls into view.
 */
export default function ToolsSnapshotFeature({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.45 });

  return (
    <div
      ref={ref}
      className={`flex h-full w-full items-center justify-center px-4 py-3 sm:px-6 ${className}`}
    >
      <motion.div
        className="flex w-full max-w-lg flex-col gap-1.5 sm:gap-2"
        variants={containerVariants}
        initial="hidden"
        animate={inView ? 'show' : 'hidden'}
      >
        <div className="grid grid-cols-4 place-items-center gap-2 sm:gap-4">
          {ROW_1.map((icon) => (
            <motion.div key={icon.src} variants={itemVariants} className="flex items-center justify-center">
              <TintedIcon src={icon.src} label={icon.label} />
            </motion.div>
          ))}
        </div>

        <div className="h-px w-full bg-[#0f1016]/20" aria-hidden />

        <div className="grid grid-cols-4 place-items-center gap-2 sm:gap-4">
          {ROW_2.map((icon) => (
            <motion.div key={icon.src} variants={itemVariants} className="flex items-center justify-center">
              <TintedIcon src={icon.src} label={icon.label} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
