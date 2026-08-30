'use client';

import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

interface AssistPanelMobileProps {
  stage: number;
  isOpen: boolean;
}

export default function AssistPanelMobile({ stage, isOpen }: AssistPanelMobileProps) {
  const visible = stage >= 2;

  // Glass morphism style
  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  };

  // Calculate top position based on toolbar height (buttons are ~40px + padding)
  const topOffset = 64; // Top padding + button height + gap

  return (
    <div
      className={`fixed left-0 right-0 overflow-hidden ${poppins.variable}`}
      style={{
        top: `${topOffset}px`,
        height: isOpen ? `calc(100vh - ${topOffset}px)` : '0',
        opacity: visible ? 1 : 0,
        transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out',
        pointerEvents: isOpen ? 'auto' : 'none',
        background: 'rgba(14, 16, 21, 0.98)',
        zIndex: 39, // Below toolbar (z-50) but above canvas
      }}
    >
      <div
        className="flex h-full flex-col gap-4 p-4"
        style={{
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
      >
        {/* Content Nav */}
        <div
          className="rounded-full px-6 py-4"
          style={{
            ...glassStyle,
            height: '56px',
          }}
        >
          <div className="flex h-full items-center justify-center">
            <span className="text-sm font-medium text-white/60">Content Nav</span>
          </div>
        </div>

        {/* Content Panel */}
        <div
          className="flex-1 overflow-auto rounded-3xl p-6"
          style={glassStyle}
        >
          <div className="flex h-full items-center justify-center">
            <span className="text-sm font-medium text-white/60">Assistant Content</span>
          </div>
        </div>
      </div>
    </div>
  );
}
