'use client';

import { useState, useRef, useEffect } from 'react';
import { Poppins } from 'next/font/google';
import { animate } from 'framer-motion';
import { cn } from '@/lib/utils';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

interface AssistPanelMobileProps {
  stage: number;
  isOpen: boolean;
}

const navItems = [
  { label: 'Ask Denise', id: 'ask-denise' },
  { label: 'Job Match', id: 'job-match' },
  { label: 'ATS Check', id: 'ats-check' },
  { label: 'Layouts', id: 'layouts' },
];

export default function AssistPanelMobile({ stage, isOpen }: AssistPanelMobileProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const visible = stage >= 2;

  // Refs for spotlight positions
  const spotlightX = useRef(0);
  const ambienceX = useRef(0);

  // Glass morphism style
  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  };

  // Spotlight mouse/touch tracking
  useEffect(() => {
    if (!navRef.current) return;
    const nav = navRef.current;

    const handleMove = (x: number) => {
      const rect = nav.getBoundingClientRect();
      const localX = x - rect.left;
      setHoverX(localX);
      spotlightX.current = localX;
      nav.style.setProperty('--spotlight-x', `${localX}px`);
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX);
    };

    const handleLeave = () => {
      setHoverX(null);
      const activeItem = nav.querySelector(`[data-index="${activeTab}"]`);
      if (activeItem) {
        const navRect = nav.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        const targetX = itemRect.left - navRect.left + itemRect.width / 2;

        animate(spotlightX.current, targetX, {
          type: 'spring',
          stiffness: 200,
          damping: 20,
          onUpdate: (v) => {
            spotlightX.current = v;
            nav.style.setProperty('--spotlight-x', `${v}px`);
          }
        });
      }
    };

    nav.addEventListener('mousemove', handleMouseMove);
    nav.addEventListener('touchmove', handleTouchMove);
    nav.addEventListener('mouseleave', handleLeave);
    nav.addEventListener('touchend', handleLeave);

    return () => {
      nav.removeEventListener('mousemove', handleMouseMove);
      nav.removeEventListener('touchmove', handleTouchMove);
      nav.removeEventListener('mouseleave', handleLeave);
      nav.removeEventListener('touchend', handleLeave);
    };
  }, [activeTab]);

  // Active tab ambience movement
  useEffect(() => {
    if (!navRef.current) return;
    const nav = navRef.current;
    const activeItem = nav.querySelector(`[data-index="${activeTab}"]`);

    if (activeItem) {
      const navRect = nav.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const targetX = itemRect.left - navRect.left + itemRect.width / 2;

      animate(ambienceX.current, targetX, {
        type: 'spring',
        stiffness: 200,
        damping: 20,
        onUpdate: (v) => {
          ambienceX.current = v;
          nav.style.setProperty('--ambience-x', `${v}px`);
        },
      });
    }
  }, [activeTab]);

  const topOffset = 64;

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
        zIndex: 39,
      }}
    >
      <div
        className="flex h-full flex-col gap-4 p-4"
        style={{
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
      >
        {/* Content Nav with spotlight effect */}
        <div
          ref={navRef}
          className={`relative overflow-hidden rounded-full ${poppins.variable}`}
          style={{
            ...glassStyle,
            height: '56px',
            fontFamily: 'var(--font-poppins)',
          }}
        >
          {/* Nav items */}
          <ul className="relative flex items-center justify-between h-full px-2 z-10">
            {navItems.map((item, idx) => (
              <li key={idx} className="relative h-full flex items-center justify-center flex-1">
                <button
                  data-index={idx}
                  onClick={() => setActiveTab(idx)}
                  className={cn(
                    'px-2 py-2 text-xs font-bold transition-colors duration-200 rounded-full whitespace-nowrap w-full',
                    activeTab === idx
                      ? 'text-white'
                      : 'text-white/50 active:text-white/80'
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Spotlight effect */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 w-full h-full z-[1] transition-opacity duration-300"
            style={{
              opacity: hoverX !== null ? 1 : 0,
              background: `radial-gradient(100px circle at var(--spotlight-x) 100%, rgba(255,255,255,0.15) 0%, transparent 50%)`
            }}
          />

          {/* Active tab ambience */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 w-full h-[2px] z-[2]"
            style={{
              background: `radial-gradient(50px circle at var(--ambience-x) 0%, rgba(255,255,255,1) 0%, transparent 100%)`
            }}
          />
        </div>

        {/* Content Panel */}
        <div
          className="flex-1 overflow-auto rounded-3xl p-6"
          style={glassStyle}
        >
          <div className="flex h-full items-center justify-center">
            <span className="text-sm font-medium text-white/60">
              {navItems[activeTab].label} Content
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
