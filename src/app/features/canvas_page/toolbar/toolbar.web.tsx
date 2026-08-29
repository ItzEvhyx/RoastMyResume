'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Poppins } from 'next/font/google';

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

export default function ToolbarWeb() {
  const router = useRouter();

  return (
    <div className={`pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-start justify-between px-6 pt-5 ${poppins.variable}`}>

      {/* Left — Back */}
      <button
        onClick={() => router.back()}
        className="pointer-events-auto flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-all duration-200 hover:brightness-110 active:scale-95"
        style={{ ...glassStyle, fontFamily: 'var(--font-poppins)' }}
      >
        <Image src="/assets/icons/back_icon.svg" alt="Back" width={18} height={18} className="opacity-80" />
        <span className="text-sm font-medium text-white/80">Back</span>
      </button>

      {/* Right — Export PDF + Sign in */}
      <div className="pointer-events-auto flex items-center gap-3">

        {/* Export PDF */}
        <button
          className="flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-all duration-200 hover:brightness-110 active:scale-95"
          style={{ ...glassStyle, fontFamily: 'var(--font-poppins)' }}
        >
          <Image src="/assets/icons/pdf_icon.svg" alt="Export PDF" width={18} height={18} className="opacity-80" />
          <span className="text-sm font-medium text-white/80">Export PDF</span>
        </button>

        {/* Sign in */}
        <button
          className="flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-all duration-200 hover:brightness-110 active:scale-95"
          style={{ ...glassStyle, fontFamily: 'var(--font-poppins)' }}
        >
          <Image src="/assets/icons/profile_icon.svg" alt="Sign in" width={18} height={18} className="opacity-80" />
          <span className="text-sm font-medium text-white/80">Sign in</span>
        </button>

      </div>
    </div>
  );
}
