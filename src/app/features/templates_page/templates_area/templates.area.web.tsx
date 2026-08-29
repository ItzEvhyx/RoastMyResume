'use client';

import { useState } from 'react';
import { Poppins } from 'next/font/google';
import { FolderUp } from 'lucide-react';
import SpecularButton from '@/components/specular_button';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-poppins',
});

const CATEGORIES = ['All', 'Tech / CS', 'Business', 'Creative', 'General'] as const;
type Category = typeof CATEGORIES[number];

export default function TemplatesAreaWeb() {
  const [active, setActive] = useState<Category>('All');

  return (
    <section className={`relative z-10 w-full ${poppins.variable}`}>
      {/* Category filter row — pushed right, aligns with where templates will start */}
      <div className="flex items-center gap-3 px-16 py-6">
        {CATEGORIES.map((cat) => (
          <SpecularButton
            key={cat}
            radius={999}
            size="md"
            tint="#0b0d12"
            tintOpacity={1}
            textColor={cat === active ? '#ffffff' : 'rgba(255,255,255,0.5)'}
            intensity={cat === active ? 1 : 0.4}
            onClick={() => setActive(cat)}
            style={{
              fontFamily: 'var(--font-poppins)',
              fontWeight: 600,
              minWidth: 140,
              outline: cat === active ? '1.5px solid rgba(255,255,255,0.5)' : 'none',
            }}
          >
            {cat}
          </SpecularButton>
        ))}
      </div>

      {/* Browse / Upload row */}
      <div className="flex items-center justify-between px-16 pb-4">
        <span
          className="text-sm font-semibold text-white"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          Browse Templates
        </span>

        <button
          className="flex items-center gap-2 text-sm text-white/60 transition-colors duration-200 hover:text-white"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
        >
          <FolderUp size={16} className="text-white/50" />
          Upload yours
        </button>
      </div>

      {/* Template grid will go here */}
    </section>
  );
}
