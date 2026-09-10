'use client';

import { useState, useRef, useEffect } from 'react';
import { Poppins } from 'next/font/google';
import { animate } from 'framer-motion';
import { cn } from '@/lib/utils';
import DeniseSignInMsgMobile from './denise_signin/signin.msg.mobile';
import AskDenise from './denise_tab/ask.denise';
import JobMatch from './job_match/job.match';
import ATSCheck from './ats_check/ats.check';
import Layouts from './layout_tab/layouts';
import { useAuthUser } from '@/app/core/session/session';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

interface AssistPanelMobileProps {
  stage: number;
  isOpen: boolean;
  isSignedIn?: boolean;
  onSignUp?: () => void;
}

const navItems = [
  { label: 'Ask Denise', id: 'ask-denise' },
  { label: 'Job Match', id: 'job-match' },
  { label: 'ATS Check', id: 'ats-check' },
  { label: 'Layouts', id: 'layouts' },
];

export default function AssistPanelMobile({
  stage,
  isOpen,
  isSignedIn: externalSignedIn,
  onSignUp,
}: AssistPanelMobileProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [internalSignedIn, setInternalSignedIn] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const user = useAuthUser();

  const isSignedIn = externalSignedIn !== undefined ? externalSignedIn : (!!user || internalSignedIn);

  const handleSignUp = () => {
    if (onSignUp) onSignUp();
    else setInternalSignedIn(true);
  };

  const visible = stage >= 2;
  const spotlightX = useRef(0);
  const ambienceX = useRef(0);

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  };

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
          },
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
        height: isOpen ? `calc(100dvh - ${topOffset}px)` : '0',
        opacity: visible ? 1 : 0,
        transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out',
        pointerEvents: isOpen ? 'auto' : 'none',
        background: 'rgba(14, 16, 21, 0.98)',
        zIndex: 55,
      }}
    >
      <div
        className="flex h-full flex-col gap-4 p-4"
        style={{
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
      >
        <div
          ref={navRef}
          className={`relative overflow-hidden rounded-full ${poppins.variable}`}
          style={{
            ...glassStyle,
            height: '56px',
            fontFamily: 'var(--font-poppins)',
          }}
        >
          <ul className="relative z-10 flex h-full items-center justify-between px-2">
            {navItems.map((item, idx) => (
              <li key={item.id} className="relative flex h-full flex-1 items-center justify-center">
                <button
                  data-index={idx}
                  onClick={() => setActiveTab(idx)}
                  className={cn(
                    'w-full whitespace-nowrap rounded-full px-2 py-2 text-xs font-bold transition-colors duration-200',
                    activeTab === idx ? 'text-white' : 'text-white/50 active:text-white/80',
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          <div
            className="pointer-events-none absolute bottom-0 left-0 z-[1] h-full w-full transition-opacity duration-300"
            style={{
              opacity: hoverX !== null ? 1 : 0,
              background: `radial-gradient(100px circle at var(--spotlight-x) 100%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
            }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 z-[2] h-[2px] w-full"
            style={{
              background: `radial-gradient(50px circle at var(--ambience-x) 0%, rgba(255,255,255,1) 0%, transparent 100%)`,
            }}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-3xl" style={glassStyle}>
          <div className="h-full w-full overflow-hidden">
            {!isSignedIn ? (
              <DeniseSignInMsgMobile onSignUp={handleSignUp} />
            ) : (
              <>
                {/* Keep Ask Denise mounted so chat state survives tab switches */}
                <div className={activeTab === 0 ? 'h-full' : 'hidden'}>
                  <AskDenise />
                </div>
                {activeTab === 1 && <JobMatch />}
                {activeTab === 2 && <ATSCheck />}
                {activeTab === 3 && <Layouts />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
