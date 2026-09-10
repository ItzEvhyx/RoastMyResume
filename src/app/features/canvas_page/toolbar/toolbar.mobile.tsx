'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Poppins } from 'next/font/google';
import { exportCanvasToPdf } from '@/app/features/canvas_page/utils/exportToPdf';
import { useAuthUser, signOutUser } from '@/app/core/session/session';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const glassStyle: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.55)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 16px rgba(0,0,0,0.35)',
};

function popStyle(visible: boolean, delay: number): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(-6px)',
    transition: `opacity 0.3s ease-out ${delay}ms, transform 0.3s ease-out ${delay}ms`,
  };
}

interface ToolbarMobileProps {
  stage: number;
  onAssistToggle?: (isOpen: boolean) => void;
  onSignInClick?: () => void;
  onSignOutClick?: () => void;
  onBackClick?: () => void;
}

export default function ToolbarMobile({ stage, onAssistToggle, onSignInClick, onSignOutClick, onBackClick }: ToolbarMobileProps) {
  const router = useRouter();
  const [assistOpen, setAssistOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [resumeTitle, setResumeTitle] = useState('Untitled Resume');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const user = useAuthUser();
  const visible = stage >= 2;

  const handleExportPdf = async () => {
    const fileName = `${resumeTitle.trim() || 'Untitled Resume'}.pdf`;
    await exportCanvasToPdf(fileName);
  };

  const handleAssistToggle = () => {
    const newState = !assistOpen;
    setAssistOpen(newState);
    onAssistToggle?.(newState);
  };

  const collapsedTitle =
    resumeTitle.length > 5 ? `${resumeTitle.slice(0, 5)}…` : resumeTitle;

  return (
    <div className={`pointer-events-none fixed left-0 right-0 top-0 z-[70] flex items-start justify-between px-4 pt-4 ${poppins.variable}`}>

      {/* Left — Back + compact title */}
      <div className="flex items-center gap-2">
        <div style={popStyle(visible, 0)}>
          <button
            onClick={() => (onBackClick ? onBackClick() : router.back())}
            className="pointer-events-auto flex items-center justify-center rounded-full p-2.5 transition-all duration-200 active:scale-95"
            style={glassStyle}
            aria-label="Back"
          >
            <Image src="/assets/icons/back_icon.svg" alt="Back" width={16} height={16} draggable={false} className="pointer-events-none select-none opacity-80" />
          </button>
        </div>

        <div style={popStyle(visible, 40)}>
          <div
            className="pointer-events-auto flex items-center rounded-full px-3 py-2 transition-all duration-200"
            style={{
              ...glassStyle,
              fontFamily: 'var(--font-poppins)',
              minWidth: isEditingTitle ? 160 : undefined,
            }}
          >
            {isEditingTitle ? (
              <input
                type="text"
                value={resumeTitle}
                maxLength={25}
                autoFocus
                onChange={(e) => setResumeTitle(e.target.value.slice(0, 25))}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="w-full bg-transparent text-xs font-semibold text-white outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="truncate text-xs font-semibold text-white/90"
                title={resumeTitle}
              >
                {collapsedTitle}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right — Assist chevron, PDF icon, Sign in */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div style={popStyle(visible, 30)}>
          <button
            onClick={handleAssistToggle}
            className="flex items-center justify-center rounded-full p-2.5 transition-all duration-200 active:scale-95"
            style={glassStyle}
            aria-label={assistOpen ? 'Close assistant' : 'Open assistant'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              style={{
                transform: assistOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }}
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="white"
                strokeOpacity="0.8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div style={popStyle(visible, 60)}>
          <button
            onClick={handleExportPdf}
            className="flex items-center justify-center rounded-full p-2.5 transition-all duration-200 active:scale-95"
            style={glassStyle}
            aria-label="Export PDF"
            title="Export PDF"
          >
            <Image src="/assets/icons/pdf_icon.svg" alt="Export PDF" width={18} height={18} draggable={false} className="pointer-events-none select-none opacity-80" />
          </button>
        </div>

        <div style={popStyle(visible, 120)}>
          {!user ? (
            <button
              onClick={onSignInClick}
              className="flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 transition-all duration-200 active:scale-95"
              style={glassStyle}
            >
              <Image src="/assets/icons/profile_icon.svg" alt="Sign in" width={16} height={16} draggable={false} className="pointer-events-none select-none opacity-80" />
              <span className="text-xs font-medium text-white/80">Sign in</span>
            </button>
          ) : (
            <div className="relative z-50">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/20 px-3 py-2 transition-all duration-200 active:scale-95"
                style={glassStyle}
              >
                <Image src="/assets/icons/profile_icon.svg" alt="Profile" width={16} height={16} className="object-contain" />
                <span className="max-w-[90px] truncate text-xs font-medium text-white/90" style={{ fontFamily: 'var(--font-poppins)' }}>
                  {user.email}
                </span>
                <svg
                  className={`h-3 w-3 text-white/70 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-white' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    className="absolute right-0 top-full z-[100] mt-2 w-52 rounded-xl border-2 border-white p-2.5 shadow-2xl"
                    style={{ backgroundColor: '#17171a', fontFamily: 'var(--font-poppins)' }}
                  >
                    <div className="px-2 py-1">
                      <p className="text-[10px] font-normal uppercase tracking-wider text-white/50">Signed in as</p>
                      <p className="mt-0.5 truncate text-xs font-bold text-white">{user.email}</p>
                    </div>
                    <div className="my-1.5 h-[1px] bg-white/10" />
                    <button
                      type="button"
                      onClick={() => {
                        signOutUser();
                        setIsDropdownOpen(false);
                        onSignOutClick?.();
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-bold text-white hover:bg-white/10"
                    >
                      <svg className="h-3.5 w-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-white transition-colors hover:text-red-300">Sign - out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
