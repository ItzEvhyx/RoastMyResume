'use client';

import { Poppins } from 'next/font/google';
import Image from 'next/image';
import localFont from 'next/font/local';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

export default function ATSCheck() {
  return (
    <div className={`flex flex-col h-full p-6 ${poppins.variable} ${futuraDisplay.variable}`}>
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          {/* Check icon next to title */}
          <Image 
            src="/assets/icons/check_icon.png" 
            alt="Check" 
            width={32} 
            height={32}
            className="opacity-90"
          />
          <h1 
            className="text-white leading-tight" 
            style={{ 
              fontFamily: 'var(--font-futura-display)', 
              fontWeight: 800,
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            }}
          >
            ATS Check
          </h1>
        </div>
        <p 
          className="text-white/70 leading-relaxed text-left"
          style={{
            fontFamily: 'var(--font-poppins)',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          Recruiters often never see your resume first but software does. Here's whether it can actually read yours.
        </p>
      </div>

      {/* Check Items */}
      <div className="flex-1 space-y-5">
        {/* Column layout & structure */}
        <div className="pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
              <Image 
                src="/assets/icons/layout_icon.png" 
                alt="Layout" 
                width={24} 
                height={24}
                className="opacity-70"
              />
            </div>
            <span 
              className="text-white/80" 
              style={{ 
                fontFamily: 'var(--font-poppins)', 
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Column layout & structure
            </span>
          </div>
        </div>

        {/* Tables & graphics */}
        <div className="pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
              <Image 
                src="/assets/icons/table_icon.png" 
                alt="Table" 
                width={24} 
                height={24}
                className="opacity-70"
              />
            </div>
            <span 
              className="text-white/80" 
              style={{ 
                fontFamily: 'var(--font-poppins)', 
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Tables & graphics
            </span>
          </div>
        </div>

        {/* Fonts & embedded text */}
        <div className="pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
              <Image 
                src="/assets/icons/font_icon.png" 
                alt="Font" 
                width={24} 
                height={24}
                className="opacity-70"
              />
            </div>
            <span 
              className="text-white/80" 
              style={{ 
                fontFamily: 'var(--font-poppins)', 
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Fonts & embedded text
            </span>
          </div>
        </div>

        {/* File format compatibility */}
        <div className="pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
              <Image 
                src="/assets/icons/file_format_icon.png" 
                alt="File Format" 
                width={24} 
                height={24}
                className="opacity-70"
              />
            </div>
            <span 
              className="text-white/80" 
              style={{ 
                fontFamily: 'var(--font-poppins)', 
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              File format compatibility
            </span>
          </div>
        </div>

        {/* Contact info parsing */}
        <div className="pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
              <Image 
                src="/assets/icons/profile_icon.svg" 
                alt="Profile" 
                width={24} 
                height={24}
                className="opacity-70"
              />
            </div>
            <span 
              className="text-white/80" 
              style={{ 
                fontFamily: 'var(--font-poppins)', 
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Contact info parsing
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 space-y-4">
        <p 
          className="text-white/50" 
          style={{ 
            fontFamily: 'var(--font-poppins)', 
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          Never checked
        </p>
        
        {/* Run ATS Check Button */}
        <button 
          className="w-full bg-white hover:bg-white/90 text-black py-4 px-6 rounded-full flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ 
            fontFamily: 'var(--font-poppins)', 
            fontWeight: 700,
          }}
        >
          <span className="text-base">Run ATS Check</span>
          <Image 
            src="/assets/icons/scan_icon.png" 
            alt="Scan" 
            width={20} 
            height={20}
          />
        </button>
      </div>
    </div>
  );
}
