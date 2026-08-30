'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Poppins } from 'next/font/google';
import { useState } from 'react';
import { useCanvas } from '@/app/features/canvas_page/context/CanvasContext';
import { exportCanvasToPdf } from '@/app/features/canvas_page/utils/exportToPdf';
import GooeyTooltip from '@/app/features/canvas_page/components/GooeyTooltip';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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

export default function ToolbarWeb({ stage }: { stage: number }) {
  const router = useRouter();
  const visible = stage >= 2;
  const [resumeTitle, setResumeTitle] = useState('Untitled Resume');
  const [isEditing, setIsEditing] = useState(false);
  const { isGrabMode, setIsGrabMode } = useCanvas();

  const handleExportPdf = async () => {
    const fileName = `${resumeTitle.trim() || 'Untitled Resume'}.pdf`;
    await exportCanvasToPdf(fileName);
  };

  return (
    <div className={`pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-start justify-between px-6 pt-5 ${poppins.variable}`}>

      {/* Left — Back + Resume Title */}
      <div className="flex items-center gap-3">
        <div style={popStyle(visible, 0)}>
          <button
            onClick={() => router.back()}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{ ...glassStyle, fontFamily: 'var(--font-poppins)' }}
          >
            <Image src="/assets/icons/back_icon.svg" alt="Back" width={18} height={18} className="opacity-80" />
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
                style={{ width: '200px' }}
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
            <span className="text-sm text-white/50">— Tech / CS template</span>
          </div>
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
                <Image src="/assets/icons/grab_icon.svg" alt="Grab mode" width={18} height={18} className="opacity-80" />
              ) : (
                <Image src="/assets/icons/cursor_icon.svg" alt="Cursor mode" width={18} height={18} className="opacity-80" />
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
            <Image src="/assets/icons/pdf_icon.svg" alt="Export PDF" width={18} height={18} className="opacity-80" />
            <span className="text-sm font-medium text-white/80">Export PDF</span>
          </button>
        </div>

        <div style={popStyle(visible, 140)}>
          <button
            className="flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{ ...glassStyle, fontFamily: 'var(--font-poppins)' }}
          >
            <Image src="/assets/icons/profile_icon.svg" alt="Sign in" width={18} height={18} className="opacity-80" />
            <span className="text-sm font-medium text-white/80">Sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
}
