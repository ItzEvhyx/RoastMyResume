'use client';

import { useState, useEffect } from 'react';
import { Poppins } from 'next/font/google';
import { useText } from '../../context/TextContext';

// Fonts
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

const FUTURA_STYLE = `
  @font-face {
    font-family: 'FuturaDisplay';
    src: url('/assets/fonts/futura_display/Futura Display.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
`;

// Top 12 most common resume fonts (first 6 visible, rest via scroll)
const DEFAULT_FONTS = [
  { name: 'Calibri', family: 'Calibri, sans-serif' },
  { name: 'Helvetica', family: 'Helvetica, Arial, sans-serif' },
  { name: 'Georgia', family: 'Georgia, serif' },
  { name: 'Times New Roman', family: 'Times New Roman, Times, serif' },
  { name: 'Arial', family: 'Arial, sans-serif' },
  { name: 'Garamond', family: 'Garamond, serif' },
  { name: 'Cambria', family: 'Cambria, Georgia, serif' },
  { name: 'Trebuchet MS', family: 'Trebuchet MS, sans-serif' },
  { name: 'Verdana', family: 'Verdana, sans-serif' },
  { name: 'Book Antiqua', family: 'Book Antiqua, Palatino, serif' },
  { name: 'Didot', family: 'Didot, serif' },
  { name: 'Gill Sans', family: 'Gill Sans, sans-serif' },
];

// Popular Google Fonts library (accessible via search)
const GOOGLE_FONTS = [
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Raleway',
  'PT Sans', 'Merriweather', 'Nunito', 'Playfair Display', 'Ubuntu',
  'Mukta', 'Rubik', 'Poppins', 'Roboto Condensed', 'Noto Sans',
  'Source Sans Pro', 'Roboto Slab', 'Bebas Neue', 'Barlow',
  'Libre Baskerville', 'Crimson Text', 'EB Garamond', 'Inconsolata',
  'Bitter', 'Fjalla One', 'Kanit', 'Archivo', 'Vollkorn', 'Quicksand',
];

const glassStyle: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.55)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
};

export default function FontSelector() {
  const { selectedId, textElements, updateElement, toolbarExpanded, activeTool } = useText();
  const [searchQuery, setSearchQuery] = useState('');
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  const selectedElement = textElements.find(el => el.id === selectedId);

  // Load Google Font dynamically
  const loadGoogleFont = (fontName: string) => {
    if (loadedFonts.has(fontName)) return;

    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    setLoadedFonts(prev => new Set([...prev, fontName]));
  };

  const handleFontSelect = (fontFamily: string, fontName: string) => {
    if (!selectedId) return;

    // Load Google Font if it's not a system font
    if (GOOGLE_FONTS.includes(fontName)) {
      loadGoogleFont(fontName);
    }

    updateElement(selectedId, { fontFamily });
  };

  // Filter fonts based on search
  const getDisplayFonts = () => {
    if (!searchQuery) {
      return DEFAULT_FONTS;
    }

    const query = searchQuery.toLowerCase();
    const allFonts = [
      ...DEFAULT_FONTS,
      ...GOOGLE_FONTS.map(name => ({ 
        name, 
        family: `'${name}', sans-serif`,
      }))
    ];

    return allFonts.filter(font => 
      font.name.toLowerCase().includes(query)
    );
  };

  const displayFonts = getDisplayFonts();

  // Prevent backspace from deleting text elements
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.stopPropagation();
    }
  };

  // Don't render if no text is selected OR if text tool is not active
  const shouldShow = selectedElement && activeTool === 'fontstyle';

  return (
    <>
      <style>{FUTURA_STYLE}</style>
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .font-search-input,
        .font-search-input::placeholder {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          font-weight: 400 !important;
        }
        .font-search-input::placeholder {
          color: rgba(255, 255, 255, 0.4) !important;
        }
        .font-name-text {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          font-weight: 400 !important;
        }
      `}</style>
      <div
        className="fixed left-[110px] z-40 flex flex-col rounded-3xl transition-all duration-400 ease-out"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        style={{
          ...glassStyle,
          width: '200px',
          height: 'calc(100vh - 280px)',
          maxHeight: '550px',
          top: 'calc(50% - (100vh - 280px) / 2 + 40px)',
          opacity: shouldShow ? 1 : 0,
          transform: shouldShow ? 'scale(1) translateX(0)' : 'scale(0.85) translateX(-12px)',
          pointerEvents: shouldShow ? 'auto' : 'none',
        }}
      >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <span style={{ fontFamily: 'FuturaDisplay, sans-serif', fontSize: '24px', color: '#fff', letterSpacing: '0.01em', lineHeight: 1 }}>
          Select Font
        </span>
      </div>

      {/* Divider line */}
      <div className="mx-3 h-[1px] bg-white/10 shrink-0" />

      {/* Font list - fixed height, scrollable without visible scrollbar */}
      <div 
        className="flex-1 overflow-y-auto p-3"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        <div className="flex flex-col gap-2">
          {displayFonts.map((font, idx) => (
            <button
              key={idx}
              onClick={() => handleFontSelect(font.family, font.name)}
              className="font-name-text rounded-lg px-4 py-3 text-left text-sm text-white/80 transition-all duration-150 hover:bg-white/10 active:scale-95"
              style={{
                fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontWeight: 400,
                background: selectedElement?.fontFamily === font.family 
                  ? 'rgba(255, 255, 255, 0.15)' 
                  : 'transparent',
              }}
            >
              {font.name}
            </button>
          ))}
          
          {displayFonts.length === 0 && (
            <div className="font-name-text py-8 text-center text-sm text-white/40" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}>
              No fonts found
            </div>
          )}
        </div>
      </div>

      {/* Search input - sticky at bottom */}
      <div className="border-t border-white/10 p-3 shrink-0">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search fonts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="font-search-input"
            style={{
              width: '100%',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.05)',
              padding: '10px 12px',
              fontSize: '14px',
              color: '#ffffff',
              outline: 'none',
              fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: 400,
            }}
          />
        </div>
      </div>
      </div>
    </>
  );
}
