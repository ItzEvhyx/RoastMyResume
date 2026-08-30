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

interface AssistPanelWebProps {
  stage: number;
}

const navItems = [
  { label: 'Ask Denise', id: 'ask-denise' },
  { label: 'Job Match', id: 'job-match' },
  { label: 'ATS Check', id: 'ats-check' },
  { label: 'Layouts', id: 'layouts' },
];

export default function AssistPanelWeb({ stage }: AssistPanelWebProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [width, setWidth] = useState(440);
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const visible = stage >= 2;

  const minWidth = 320;
  const maxWidth = 800;

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

  // Spotlight mouse tracking
  useEffect(() => {
    if (!navRef.current) return;
    const nav = navRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = nav.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setHoverX(x);
      spotlightX.current = x;
      nav.style.setProperty('--spotlight-x', `${x}px`);
    };

    const handleMouseLeave = () => {
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
    nav.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      nav.removeEventListener('mousemove', handleMouseMove);
      nav.removeEventListener('mouseleave', handleMouseLeave);
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

  // Panel resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      
      const panelRect = panelRef.current.getBoundingClientRect();
      const newWidth = panelRect.right - e.clientX;
      
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const collapsedWidth = 0;

  return (
    <div
      ref={panelRef}
      className={`fixed right-6 top-20 flex flex-col gap-4 ${poppins.variable}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(40px)',
        transition: isResizing ? 'none' : 'opacity 0.5s ease-out, transform 0.5s ease-out',
        pointerEvents: visible ? 'auto' : 'none',
        zIndex: 50,
      }}
    >
      {/* Content Nav - Horizontal pill with spotlight effect */}
      <div
        ref={navRef}
        className={`relative overflow-hidden rounded-full ${poppins.variable}`}
        style={{
          ...glassStyle,
          height: '60px',
          width: isOpen ? `${width}px` : `${collapsedWidth}px`,
          transition: isResizing ? 'none' : 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: 'var(--font-poppins)',
        }}
      >
        {/* Nav items */}
        <ul
          className="relative flex items-center justify-between h-full px-3 z-10"
          style={{
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.2s ease-out',
          }}
        >
          {navItems.map((item, idx) => (
            <li key={idx} className="relative h-full flex items-center justify-center flex-1">
              <button
                data-index={idx}
                onClick={() => setActiveTab(idx)}
                className={cn(
                  'px-4 py-2 text-sm font-bold transition-colors duration-200 rounded-full whitespace-nowrap w-full',
                  activeTab === idx
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80'
                )}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Spotlight effect (follows mouse) */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-full h-full z-[1] transition-opacity duration-300"
          style={{
            opacity: hoverX !== null ? 1 : 0,
            background: `radial-gradient(120px circle at var(--spotlight-x) 100%, rgba(255,255,255,0.15) 0%, transparent 50%)`
          }}
        />

        {/* Active tab ambience (bottom glow) */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-full h-[2px] z-[2]"
          style={{
            background: `radial-gradient(60px circle at var(--ambience-x) 0%, rgba(255,255,255,1) 0%, transparent 100%)`
          }}
        />
      </div>

      {/* Content Panel with Chevron Button */}
      <div className="relative">
        {/* Resize Handle - draggable left border */}
        {isOpen && (
          <div
            onMouseDown={() => setIsResizing(true)}
            className="absolute left-0 top-0 z-20 h-full w-1 cursor-ew-resize transition-colors hover:bg-white/20"
            style={{
              transform: 'translateX(-50%)',
            }}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity hover:opacity-100" />
          </div>
        )}

        {/* Chevron Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-0 top-1/2 z-10 flex items-center justify-center rounded-l-2xl transition-all duration-200 hover:brightness-110 active:scale-95"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRight: 'none',
            width: '40px',
            height: '80px',
            transform: 'translate(-100%, -50%)',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease',
            }}
          >
            <path
              d="M9 18L15 12L9 6"
              stroke="white"
              strokeOpacity="0.8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Content Panel */}
        <div
          className="overflow-hidden rounded-3xl p-6"
          style={{
            ...glassStyle,
            height: 'calc(100vh - 160px)',
            minHeight: '500px',
            maxHeight: '800px',
            width: isOpen ? `${width}px` : `${collapsedWidth}px`,
            transition: isResizing ? 'none' : 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            className="flex h-full items-center justify-center whitespace-nowrap"
            style={{
              opacity: isOpen ? 1 : 0,
              transition: 'opacity 0.2s ease-out',
            }}
          >
            <span className="text-sm font-medium text-white/60">
              {navItems[activeTab].label} Content
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
