'use client';

import { useState, useEffect } from 'react';
import { useText } from '../../context/TextContext';

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
  const shouldShow = selectedElement && toolbarExpanded && activeTool === 'fontstyle';

  return (
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
              className="rounded-lg px-4 py-3 text-left text-sm text-white/80 transition-all duration-150 hover:bg-white/10 active:scale-95"
              style={{
                fontFamily: font.family,
                background: selectedElement?.fontFamily === font.family 
                  ? 'rgba(255, 255, 255, 0.15)' 
                  : 'transparent',
              }}
            >
              {font.name}
            </button>
          ))}
          
          {displayFonts.length === 0 && (
            <div className="py-8 text-center text-sm text-white/40">
              No fonts found
            </div>
          )}
        </div>
      </div>

      {/* Search input - sticky at bottom */}
      <div className="border-t border-white/10 p-3">
        <input
          type="text"
          placeholder="Search fonts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition-all focus:border-white/20 focus:bg-white/10"
        />
      </div>
    </div>
  );
}
