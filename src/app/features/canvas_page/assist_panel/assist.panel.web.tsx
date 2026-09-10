'use client';

import { useState, useRef, useEffect } from 'react';
import { Poppins } from 'next/font/google';
import { animate } from 'framer-motion';
import { cn } from '@/lib/utils';
import DeniseSignInMsgWeb from './denise_signin/signin.msg.web';
import AskDenise from './denise_tab/ask.denise';
import JobMatch from './job_match/job.match';
import ATSCheck from './ats_check/ats.check';
import Layouts from './layout_tab/layouts';
import SlideAnimation from './animations/slide.animationt';
import { useAuthUser } from '@/app/core/session/session';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

interface AssistPanelWebProps {
  stage: number;
  isSignedIn?: boolean;
  onSignUp?: () => void;
}

const navItems = [
  { label: 'Ask Denise', id: 'ask-denise' },
  { label: 'Job Match', id: 'job-match' },
  { label: 'ATS Check', id: 'ats-check' },
  { label: 'Layouts', id: 'layouts' },
];

export default function AssistPanelWeb({
  stage,
  isSignedIn: externalSignedIn,
  onSignUp,
}: AssistPanelWebProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(440);
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [prevTab, setPrevTab] = useState(0);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [internalSignedIn, setInternalSignedIn] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const didDragResize = useRef(false);
  const resizeOriginX = useRef(0);

  const user = useAuthUser();

  // Determine slide direction based on tab change
  const slideDirection = activeTab > prevTab ? 'left' : 'right';

  // Auto-expand horizontally once stage 4 is reached (matching the toolbar vertical expansion)
  useEffect(() => {
    if (stage >= 4) {
      setIsOpen(true);
    }
  }, [stage]);

  // Use externally controlled sign-in state if provided, otherwise fallback to session user or internal state
  const isSignedIn = externalSignedIn !== undefined ? externalSignedIn : (!!user || internalSignedIn);

  const handleSignUp = () => {
    if (onSignUp) {
      onSignUp();
    } else {
      setInternalSignedIn(true);
    }
  };

  const visible = stage >= 3;

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
    if (!navRef.current || !isOpen) return;
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
  }, [activeTab, isOpen]);

  // Panel resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;

      if (Math.abs(e.clientX - resizeOriginX.current) > 4) {
        didDragResize.current = true;
      }

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
      className={`fixed right-6 top-20 flex flex-col items-end gap-4 ${poppins.variable}`}
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
          border: isOpen ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
          height: '60px',
          width: isOpen ? `${width}px` : `${collapsedWidth}px`,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: isResizing
            ? 'none'
            : 'width 700ms cubic-bezier(0.16, 1, 0.3, 1), opacity 350ms ease-out, border-color 350ms ease-out',
          fontFamily: 'var(--font-poppins)',
        }}
      >
        {/* Nav items */}
        <ul
          className="relative flex items-center justify-between h-full px-3 z-10"
          style={{
            width: `${width}px`,
            minWidth: `${width}px`,
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.25s ease-out',
          }}
        >
          {navItems.map((item, idx) => (
            <li key={idx} className="relative h-full flex items-center justify-center flex-1">
              <button
                data-index={idx}
                onClick={() => {
                  setPrevTab(activeTab);
                  setActiveTab(idx);
                }}
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
        {/* Wider left-edge resize hit target */}
        {isOpen && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              didDragResize.current = false;
              resizeOriginX.current = e.clientX;
              setIsResizing(true);
            }}
            className="absolute left-0 top-0 z-20 h-full w-3 -translate-x-1/2 cursor-ew-resize"
            title="Drag to resize"
          >
            <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/0 transition-colors hover:bg-white/25" />
          </div>
        )}

        {/* Chevron: click toggles; drag horizontally resizes when open */}
        <button
          type="button"
          aria-label={isOpen ? 'Resize or collapse Assistant' : 'Expand Assistant'}
          title={isOpen ? 'Drag to resize · click to collapse' : 'Expand Assistant'}
          onMouseDown={(e) => {
            if (!isOpen) return;
            e.preventDefault();
            didDragResize.current = false;
            resizeOriginX.current = e.clientX;
            setIsResizing(true);
          }}
          onClick={() => {
            if (didDragResize.current) {
              didDragResize.current = false;
              return;
            }
            setIsOpen((open) => !open);
          }}
          className="absolute left-0 top-1/2 z-30 flex items-center justify-center transition-all duration-200 hover:brightness-110 active:scale-95 cursor-ew-resize"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRight: isOpen ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: isOpen ? '16px 0 0 16px' : '16px',
            width: '40px',
            height: '80px',
            transform: 'translate(-100%, -50%)',
            cursor: isOpen ? 'ew-resize' : 'pointer',
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
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: 'none',
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
          className="overflow-hidden rounded-3xl"
          style={{
            ...glassStyle,
            border: isOpen ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
            height: 'calc(100vh - 160px)',
            minHeight: '500px',
            maxHeight: '800px',
            width: isOpen ? `${width}px` : `${collapsedWidth}px`,
            transition: isResizing
              ? 'none'
              : 'width 700ms cubic-bezier(0.16, 1, 0.3, 1), border-color 350ms ease-out',
          }}
        >
          <div
            className="h-full"
            style={{
              width: `${width}px`,
              minWidth: `${width}px`,
              opacity: isOpen ? 1 : 0,
              transition: 'opacity 0.25s ease-out',
            }}
          >
            <SlideAnimation direction={slideDirection} tabKey={activeTab}>
              {!isSignedIn ? (
                /* Show sign-in message for all tabs when not signed in */
                <DeniseSignInMsgWeb onSignUp={handleSignUp} />
              ) : (
                /* Keep Ask Denise mounted so chat state isn't wiped on tab switch */
                <>
                  <div className={activeTab === 0 ? 'h-full' : 'hidden'}>
                    <AskDenise />
                  </div>
                  {activeTab === 1 && <JobMatch />}
                  {activeTab === 2 && <ATSCheck />}
                  {activeTab === 3 && <Layouts />}
                </>
              )}
            </SlideAnimation>
          </div>
        </div>
      </div>
    </div>
  );
}
