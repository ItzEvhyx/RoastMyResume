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
import { useDocumentMode } from '@/app/features/canvas_page/document_panel/use.document.mode';
import { useAuthUser, signOutUser } from '@/app/core/session/session';
import { truncateEmail } from '@/lib/truncate';

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

interface ToolbarWebProps {
  stage: number;
  onSignInClick?: () => void;
  onSignOutClick?: () => void;
  /** When set, Back asks for leave confirmation instead of navigating immediately. */
  onBackClick?: () => void;
}

export default function ToolbarWeb({ stage, onSignInClick, onSignOutClick, onBackClick }: ToolbarWebProps) {
  const router = useRouter();
  const visible = stage >= 2;
  const [resumeTitle, setResumeTitle] = useState('Untitled Resume');
  const [isEditing, setIsEditing] = useState(false);
  const [exportState, setExportState] = useState<'idle' | 'exporting' | 'done'>('idle');
  const { isGrabMode, setIsGrabMode } = useCanvas();
  const { enabled: smartGuidesEnabled, toggle: toggleSmartGuides } = useRulerSnapping();
  const { isDocumentMode, toggleDocumentMode } = useDocumentMode();

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
    if (exportState === 'exporting') return;
    setExportState('exporting');
    try {
      const fileName = `${resumeTitle.trim() || 'Untitled Resume'}.pdf`;
      await exportCanvasToPdf(fileName);
      setExportState('done');
      setTimeout(() => setExportState('idle'), 1500);
    } catch (error) {
      console.error('PDF export failed:', error);
      setExportState('idle');
    }
  };

  const exportLabel =
    exportState === 'exporting' ? 'Exporting...' : exportState === 'done' ? 'Exported!' : 'Export PDF';

  return (
    <div
      className={`pointer-events-none fixed left-0 right-0 top-0 z-[70] flex min-w-0 items-start justify-between gap-2 px-3 pt-4 sm:gap-3 sm:px-4 sm:pt-5 lg:px-6 ${poppins.variable}`}
    >
      {/* Left — Back + Resume Title + tools */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 lg:gap-3">
        <div className="shrink-0" style={popStyle(visible, 0)}>
          <button
            onClick={() => (onBackClick ? onBackClick() : router.back())}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full p-2.5 transition-all duration-200 hover:brightness-110 active:scale-95 xl:px-4 xl:py-2.5"
            style={{ ...glassStyle, fontFamily: 'var(--font-poppins)' }}
            aria-label="Back"
          >
            <Image
              src="/assets/icons/back_icon.svg"
              alt=""
              width={18}
              height={18}
              draggable={false}
              className="pointer-events-none select-none opacity-80"
            />
            <span className="hidden text-sm font-medium text-white/80 xl:inline">Back</span>
          </button>
        </div>

        {/* Resume Title pill */}
        <div className="min-w-0 max-w-[min(100%,11rem)] sm:max-w-[14rem] lg:max-w-[16rem] xl:max-w-[22rem]" style={popStyle(visible, 60)}>
          <div
            className="pointer-events-auto group flex min-w-0 items-center gap-2 rounded-full px-3 py-2.5 transition-all duration-150 sm:px-4"
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
                className="min-w-0 w-full max-w-[12rem] bg-transparent text-sm font-semibold text-white outline-none"
                style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
              />
            ) : (
              <span
                className="min-w-0 cursor-text truncate text-sm font-semibold text-white transition-colors duration-150 group-hover:text-blue-300"
                onClick={() => setIsEditing(true)}
                title={resumeTitle}
              >
                {resumeTitle}
              </span>
            )}
            <span className="hidden shrink-0 text-sm text-white/50 xl:inline">— Tech / IT Template</span>
          </div>
        </div>

        <div className="shrink-0" style={popStyle(visible, 90)}>
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
              <Image
                src="/assets/tools_icons/grid_icon.png"
                alt="Toggle smart guides"
                width={20}
                height={20}
                draggable={false}
                className={`pointer-events-none select-none ${smartGuidesEnabled ? 'opacity-100' : 'opacity-50'}`}
              />
            </button>
          </GooeyTooltip>
        </div>

        <div className="hidden shrink-0 sm:block" style={popStyle(visible, 120)}>
          <GooeyTooltip
            label={isDocumentMode ? 'Convert back to editable canvas' : 'Convert to text document'}
            position="bottom"
          >
            <button
              onClick={toggleDocumentMode}
              aria-pressed={isDocumentMode}
              className="pointer-events-auto flex items-center gap-2 rounded-full p-2.5 transition-all duration-200 hover:brightness-110 active:scale-95 xl:px-3.5 xl:py-2.5"
              style={{
                ...glassStyle,
                fontFamily: 'var(--font-poppins)',
                background: isDocumentMode ? 'rgba(255,255,255,0.14)' : glassStyle.background,
                boxShadow: isDocumentMode
                  ? 'inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px rgba(255,255,255,0.16), 0 4px 16px rgba(0,0,0,0.35)'
                  : glassStyle.boxShadow,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className={`shrink-0 ${isDocumentMode ? 'text-white' : 'text-white/75'}`}
                aria-hidden
              >
                {isDocumentMode ? (
                  <>
                    <rect x="3" y="3" width="7" height="7" rx="1.2" />
                    <rect x="14" y="3" width="7" height="7" rx="1.2" />
                    <rect x="3" y="14" width="7" height="7" rx="1.2" />
                    <rect x="14" y="14" width="7" height="7" rx="1.2" />
                  </>
                ) : (
                  <>
                    <path d="M6 4h9l3 3v13H6V4z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.5 10h7M8.5 14h7M8.5 18h4" strokeLinecap="round" />
                  </>
                )}
              </svg>
              <span className={`hidden text-sm font-medium xl:inline ${isDocumentMode ? 'text-white' : 'text-white/80'}`}>
                {isDocumentMode ? 'Editable canvas' : 'Text document'}
              </span>
            </button>
          </GooeyTooltip>
        </div>
      </div>

      {/* Right — Mode, Export PDF, Sign in */}
      <div className="pointer-events-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
        <div style={popStyle(visible, 40)}>
          <GooeyTooltip label={isGrabMode ? 'Grab Mode' : 'Cursor Mode'} position="bottom">
            <button
              onClick={() => setIsGrabMode(!isGrabMode)}
              className="flex items-center justify-center rounded-full p-2.5 transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{ ...glassStyle, fontFamily: 'var(--font-poppins)' }}
            >
              {isGrabMode ? (
                <Image
                  src="/assets/icons/grab_icon.svg"
                  alt="Grab mode"
                  width={18}
                  height={18}
                  draggable={false}
                  className="pointer-events-none select-none opacity-80"
                />
              ) : (
                <Image
                  src="/assets/icons/cursor_icon.svg"
                  alt="Cursor mode"
                  width={18}
                  height={18}
                  draggable={false}
                  className="pointer-events-none select-none opacity-80"
                />
              )}
            </button>
          </GooeyTooltip>
        </div>

        <div style={popStyle(visible, 80)}>
          <GooeyTooltip label={exportLabel} position="bottom">
            <button
              onClick={handleExportPdf}
              disabled={exportState === 'exporting'}
              aria-label={exportLabel}
              className="flex items-center gap-2.5 rounded-full p-2.5 transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-70 xl:px-4 xl:py-2.5"
              style={{ ...glassStyle, fontFamily: 'var(--font-poppins)' }}
            >
              <Image
                src="/assets/icons/pdf_icon.svg"
                alt=""
                width={18}
                height={18}
                draggable={false}
                className="pointer-events-none select-none opacity-80"
              />
              <span className="hidden text-sm font-medium text-white/80 xl:inline">{exportLabel}</span>
            </button>
          </GooeyTooltip>
        </div>

        <div style={popStyle(visible, 140)}>
          {!user ? (
            <button
              onClick={onSignInClick}
              className="flex cursor-pointer items-center gap-2.5 rounded-full p-2.5 transition-all duration-200 hover:brightness-110 active:scale-95 xl:px-4 xl:py-2.5"
              style={{ ...glassStyle, fontFamily: 'var(--font-poppins)' }}
              aria-label="Sign in"
            >
              <Image
                src="/assets/icons/profile_icon.svg"
                alt=""
                width={18}
                height={18}
                draggable={false}
                className="pointer-events-none select-none opacity-80"
              />
              <span className="hidden text-sm font-medium text-white/80 xl:inline">Sign in</span>
            </button>
          ) : (
            <div
              className="relative z-50"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className="flex h-[42px] cursor-pointer select-none items-center gap-2 rounded-full border border-white/20 px-3 shadow-md transition-all duration-200 hover:border-white/50 sm:gap-2.5 sm:px-4"
                style={{
                  ...glassStyle,
                  fontFamily: 'var(--font-poppins)',
                }}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                title={user.email}
              >
                <div className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                  <Image
                    src="/assets/icons/profile_icon.svg"
                    alt="Profile"
                    width={18}
                    height={18}
                    className="object-contain"
                  />
                </div>

                <span
                  className="text-sm font-semibold text-[#f5f5f5]"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  {truncateEmail(user.email)}
                </span>

                <svg
                  className={`ml-0.5 h-3.5 w-3.5 text-white/70 transition-transform duration-200 ${
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

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute right-0 top-full z-[100] mt-2 w-60 rounded-2xl border-2 border-white p-3 shadow-2xl"
                    style={{
                      backgroundColor: '#17171a',
                      fontFamily: 'var(--font-poppins)',
                    }}
                  >
                    <div className="px-3 py-2">
                      <p
                        className="text-xs font-normal uppercase tracking-wider text-white/50"
                        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
                      >
                        Signed in as
                      </p>
                      <p
                        className="mt-0.5 truncate text-sm font-bold text-white"
                        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
                        title={user.email}
                      >
                        {user.email}
                      </p>
                    </div>

                    <div className="my-2 h-[1px] bg-white/10" />

                    <button
                      type="button"
                      onClick={() => {
                        signOutUser();
                        setIsDropdownOpen(false);
                        if (onSignOutClick) onSignOutClick();
                      }}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-[0.98]"
                      style={{ fontFamily: 'var(--font-poppins)', fontWeight: 700 }}
                    >
                      <svg
                        className="h-4 w-4 shrink-0 text-red-400"
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
