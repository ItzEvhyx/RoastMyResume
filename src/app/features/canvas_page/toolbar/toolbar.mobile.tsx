'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { exportCanvasToPdf } from '@/app/features/canvas_page/utils/exportToPdf';

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

export default function ToolbarMobile({ stage }: { stage: number }) {
  const router = useRouter();
  const visible = stage >= 2;

  const handleExportPdf = async () => {
    await exportCanvasToPdf('resume.pdf');
  };

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-start justify-between px-4 pt-4">

      {/* Left — Back only on mobile */}
      <div style={popStyle(visible, 0)}>
        <button
          onClick={() => router.back()}
          className="pointer-events-auto flex items-center gap-2 rounded-full px-3.5 py-2 transition-all duration-200 active:scale-95"
          style={glassStyle}
        >
          <Image src="/assets/icons/back_icon.svg" alt="Back" width={16} height={16} className="opacity-80" />
          <span className="text-xs font-medium text-white/80">Back</span>
        </button>
      </div>

      {/* Right — PDF + Sign in */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div style={popStyle(visible, 60)}>
          <button
            onClick={handleExportPdf}
            className="flex items-center justify-center rounded-full p-2.5 transition-all duration-200 active:scale-95"
            style={glassStyle}
          >
            <Image src="/assets/icons/pdf_icon.svg" alt="Export PDF" width={18} height={18} className="opacity-80" />
          </button>
        </div>

        <div style={popStyle(visible, 120)}>
          <button
            className="flex items-center gap-2 rounded-full px-3.5 py-2 transition-all duration-200 active:scale-95"
            style={glassStyle}
          >
            <Image src="/assets/icons/profile_icon.svg" alt="Sign in" width={16} height={16} className="opacity-80" />
            <span className="text-xs font-medium text-white/80">Sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
}
