'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Poppins } from 'next/font/google';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvas } from '@/app/features/canvas_page/context/CanvasContext';
import { exportCanvasToPdf } from '@/app/features/canvas_page/utils/exportToPdf';
import GooeyTooltip from '@/app/features/canvas_page/components/GooeyTooltip';
import { useRulerSnapping } from '@/app/features/canvas_page/globals/ruler.snapping';
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

// Each button pops in with a staggered scale+fade.
function popStyle(visible: boolean, delay: number): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(-6px)',
    transition: `opacity 0.3s ease-out ${delay}ms, transform 0.3s ease-out ${delay}ms`,
  };
}

interface ToolbarWebProps {
  stage: number;
  onSignInClick?: () => void;
}

export default function ToolbarWeb({ stage, onSignInClick }: ToolbarWebProps) {
  const router = useRouter();
  const visible = stage >= 2;
  const [resumeTitle, setResumeTitle] = useState('Untitled Resume');
  const [isEditing, setIsEditing] = useState(false);
  const { isGrabMode, setIsGrabMode } = useCanvas();
  const { enabled: smartGuidesEnabled, toggle: toggleSmartGuides } = useRulerSnapping();

  const user = useAuthUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    };
  }, []);

  const handleExportPdf = async () => {
    const fileName = `${resumeTitle.trim() || 'Untitled Resume'}.pdf`;
    await exportCanvasToPdf(fileName);
  };

  return (
    <div className={`pointer-events-none fixed left-0 right-0 top-0 z-[70] flex items-start justify-between px-6 pt-5 ${poppins.variable}`}>

      {/* Left — Back + Resume Title */}
      <div className="flex items-center gap-3">
        <div style={popStyle(visible, 0)}>
          <button
            onClick={() => router.back()}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{ ...glassStyle, fontFamily: 'var(--font-poppins)' }}
          >
            <Image src="/assets/icons/back_icon.svg" alt="Back" width={18} height={18} draggable={false} className="opacity-80 select-none pointer-events-none" />
            <span className="text-sm font-medium text-white/80">Back</span>
          </button>
        </div>

        {/* Resume Title pill */}
        <div style={popStyle(visible, 60)}>
          <div
            className="pointer-events-auto group flex items-center gap-2 rounded-full px-4 py-2.5 transition-all duration-150"
            style={{ ...glassStyle, fontFamily: 'var(--font-poppins)' }}
          >
            {isEditing ? (
              <input
                type="text"
                value={resumeTitle}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 25) {
                    setResumeTitle(value);
                  }
                }}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditing(false);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                maxLength={25}
                autoFocus
                className="bg-transparent text-sm font-semibold text-white outline-none"
                style={{ width: '200px', fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
              />
            ) : (
              <span
                className="cursor-text text-sm font-semibold text-white transition-colors duration-150 group-hover:text-blue-300"
                onClick={() => setIsEditing(true)}
                title={resumeTitle.length > 25 ? resumeTitle : undefined}
              >
                {resumeTitle.length > 25 ? `${resumeTitle.slice(0, 25)}...` : resumeTitle}
              </span>
            )}
            <span className="text-sm text-white/50">— Tech / IT Template</span>
          </div>
        </div>

        <div style={popStyle(visible, 90)}>
          <GooeyTooltip label={smartGuidesEnabled ? 'Smart guides on' : 'Smart guides off'} position="bottom">
            <button
              onClick={toggleSmartGuides}
              aria-pressed={smartGuidesEnabled}
              className="pointer-events-auto flex items-center justify-center rounded-full p-2.5 transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{
                ...glassStyle,
                background: smartGuidesEnabled ? 'rgba(255,255,255,0.14)' : glassStyle.background,
                boxShadow: smartGuidesEnabled
                  ? 'inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px rgba(255,255,255,0.16), 0 4px 16px rgba(0,0,0,0.35)'
                  : glassStyle.boxShadow,
              }}
            >
              <Image src="/assets/tools_icons/grid_icon.png" alt="Toggle smart guides" width={20} height={20} draggable={false} className={`pointer-events-none select-none ${smartGuidesEnabled ? 'opacity-100' : 'opacity-50'}`} />
            </button>
          </GooeyTooltip>
        </div>
      </div>

      {/* Right — staggered: Mode Toggle, Export PDF, then Sign in */}
      <div className="pointer-events-auto flex items-center gap-3">
        {/* Mode Toggle */}
        <div style={popStyle(visible, 40)}>
          <GooeyTooltip label={isGrabMode ? "Grab Mode" : "Cursor Mode"} position="bottom">
            <button
              onClick={() => setIsGrabMode(!isGrabMode)}
              className="flex items-center justify-center rounded-full p-2.5 transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{ ...glassStyle, fontFamily: 'var(--font-poppins)' }}
            >
              {isGrabMode ? (
                <Image src="/assets/icons/grab_icon.svg" alt="Grab mode" width={18} height={18} draggable={false} className="opacity-80 select-none pointer-events-none" />
              ) : (
                <Image src="/assets/icons/cursor_icon.svg" alt="Cursor mode" width={18} height={18} draggable={false} className="opacity-80 select-none pointer-events-none" />
              )}
            </button>
          </GooeyTooltip>
        </div>

        <div style={popStyle(visible, 80)}>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{ ...glassStyle, fontFamily: 'var(--font-poppins)' }}
          >
            <Image src="/assets/icons/pdf_icon.svg" alt="Export PDF" width={18} height={18} draggable={false} className="opacity-80 select-none pointer-events-none" />
            <span className="text-sm font-medium text-white/80">Export PDF</span>
          </button>
        </div>

        <div style={popStyle(visible, 140)}>
          {!user ? (
            <button
              onClick={onSignInClick}
              className="flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-all duration-200 hover:brightness-110 active:scale-95 cursor-pointer"
              style={{ ...glassStyle, fontFamily: 'var(--font-poppins)' }}
            >
              <Image
                src="/assets/icons/profile_icon.svg"
                alt="Sign in"
                width={18}
                height={18}
                draggable={false}
                className="opacity-80 select-none pointer-events-none"
              />
              <span className="text-sm font-medium text-white/80">Sign in</span>
            </button>
          ) : (
            <div
              className="relative z-50"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {/* User Profile Pill Button */}
              <div
                className="flex items-center gap-2.5 h-[42px] px-4 rounded-full cursor-pointer transition-all duration-200 shadow-md border border-white/20 hover:border-white/50 select-none"
                style={{
                  ...glassStyle,
                  fontFamily: 'var(--font-poppins)',
                }}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
              >
                {/* profile_icon.svg on the left */}
                <div className="relative w-[18px] h-[18px] shrink-0 flex items-center justify-center">
                  <Image
                    src="/assets/icons/profile_icon.svg"
                    alt="Profile"
                    width={18}
                    height={18}
                    className="object-contain"
                  />
                </div>

                {/* User Email */}
                <span
                  className="text-sm font-semibold text-[#f5f5f5] max-w-[180px] truncate"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  {user.email}
                </span>

                {/* Dropdown Chevron */}
                <svg
                  className={`w-3.5 h-3.5 ml-0.5 text-white/70 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-white' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Dropdown Container */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-60 rounded-2xl border-2 border-white p-3 shadow-2xl z-[100]"
                    style={{
                      backgroundColor: '#17171a',
                      fontFamily: 'var(--font-poppins)',
                    }}
                  >
                    <div className="px-3 py-2">
                      <p
                        className="text-xs text-white/50 uppercase tracking-wider font-normal"
                        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
                      >
                        Signed in as
                      </p>
                      <p
                        className="text-sm text-white truncate font-bold mt-0.5"
                        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
                      >
                        {user.email}
                      </p>
                    </div>

                    <div className="h-[1px] bg-white/10 my-2" />

                    <button
                      type="button"
                      onClick={() => {
                        signOutUser();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-white hover:bg-white/10 active:scale-[0.98] transition-all text-left cursor-pointer"
                      style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
                    >
                      <svg
                        className="w-4 h-4 text-red-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span className="text-white hover:text-red-300 transition-colors">
                        Sign - out
                      </span>
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
