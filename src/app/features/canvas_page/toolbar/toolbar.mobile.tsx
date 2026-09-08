'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { exportCanvasToPdf } from '@/app/features/canvas_page/utils/exportToPdf';
import { useAuthUser, signOutUser } from '@/app/core/session/session';

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
}

export default function ToolbarMobile({ stage, onAssistToggle, onSignInClick }: ToolbarMobileProps) {
  const router = useRouter();
  const [assistOpen, setAssistOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const user = useAuthUser();
  const visible = stage >= 2;

  const handleExportPdf = async () => {
    await exportCanvasToPdf('resume.pdf');
  };

  const handleAssistToggle = () => {
    const newState = !assistOpen;
    setAssistOpen(newState);
    onAssistToggle?.(newState);
  };

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[70] flex items-start justify-between px-4 pt-4">

      {/* Left — Back only on mobile */}
      <div style={popStyle(visible, 0)}>
        <button
          onClick={() => router.back()}
          className="pointer-events-auto flex items-center gap-2 rounded-full px-3.5 py-2 transition-all duration-200 active:scale-95"
          style={glassStyle}
        >
          <Image src="/assets/icons/back_icon.svg" alt="Back" width={16} height={16} draggable={false} className="opacity-80 select-none pointer-events-none" />
          <span className="text-xs font-medium text-white/80">Back</span>
        </button>
      </div>

      {/* Right — Assistant + PDF + Sign in */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Assistant Panel Toggle */}
        <div style={popStyle(visible, 30)}>
          <button
            onClick={handleAssistToggle}
            className="flex items-center justify-center rounded-full p-2.5 transition-all duration-200 active:scale-95"
            style={glassStyle}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
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
          >
            <Image src="/assets/icons/pdf_icon.svg" alt="Export PDF" width={18} height={18} draggable={false} className="opacity-80 select-none pointer-events-none" />
          </button>
        </div>

        <div style={popStyle(visible, 120)}>
          {!user ? (
            <button
              onClick={onSignInClick}
              className="flex items-center gap-2 rounded-full px-3.5 py-2 transition-all duration-200 active:scale-95 cursor-pointer"
              style={glassStyle}
            >
              <Image src="/assets/icons/profile_icon.svg" alt="Sign in" width={16} height={16} draggable={false} className="opacity-80 select-none pointer-events-none" />
              <span className="text-xs font-medium text-white/80">Sign in</span>
            </button>
          ) : (
            <div className="relative z-50">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 transition-all duration-200 active:scale-95 cursor-pointer border border-white/20"
                style={glassStyle}
              >
                <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
                  <Image src="/assets/icons/profile_icon.svg" alt="Profile" width={16} height={16} className="object-contain" />
                </div>
                <span className="text-xs font-medium text-white/90 max-w-[90px] truncate" style={{ fontFamily: 'var(--font-poppins)' }}>
                  {user.email}
                </span>
                <svg
                  className={`w-3 h-3 text-white/70 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-white' : ''}`}
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
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl border-2 border-white p-2.5 shadow-2xl z-[100]"
                    style={{ backgroundColor: '#17171a', fontFamily: 'var(--font-poppins)' }}
                  >
                    <div className="px-2 py-1">
                      <p className="text-[10px] text-white/50 uppercase tracking-wider font-normal" style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}>
                        Signed in as
                      </p>
                      <p className="text-xs font-bold text-white truncate mt-0.5" style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}>
                        {user.email}
                      </p>
                    </div>

                    <div className="h-[1px] bg-white/10 my-1.5" />

                    <button
                      type="button"
                      onClick={() => {
                        signOutUser();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-bold text-white hover:bg-white/10 text-left cursor-pointer"
                      style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
                    >
                      <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-white hover:text-red-300 transition-colors">Sign - out</span>
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
