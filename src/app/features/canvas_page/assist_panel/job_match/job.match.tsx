'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import JobMatchAnimation from './job.match.animation';

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

interface JobMatchProps {
  onBack?: () => void;
}

export default function JobMatch({ onBack }: JobMatchProps) {
  const [jobDescription, setJobDescription] = useState('');

  return (
    <div className={`flex h-full flex-col p-6 ${poppins.variable} ${futuraDisplay.variable}`}>
      {/* Header Section with Briefcase Icon and Title */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
          <Image
            src="/assets/icons/briefcase_icon.png"
            alt="Job Match"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h2
          className="text-white leading-tight"
          style={{
            fontFamily: 'var(--font-futura-display), sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
          }}
        >
          Job Match
        </h2>
      </div>

      {/* Subtitle */}
      <p
        className="text-white/70 text-sm leading-snug mb-4"
        style={{
          fontFamily: 'var(--font-poppins)',
          fontWeight: 600,
        }}
      >
        Paste a posting and see where you actually stand.
      </p>

      {/* White Container - Shows animation automatically */}
      <div
        className="rounded-3xl mb-4 relative overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          height: '360px',
        }}
      >
        <JobMatchAnimation />
      </div>

      {/* Spacer to push input to bottom */}
      <div className="flex-1" />

      {/* Job Description Textarea */}
      <div className="space-y-3">
        <div
          className="rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste a job description here..."
            className="w-full h-24 bg-transparent text-white placeholder:text-white/40 outline-none resize-none px-5 py-4 rounded-3xl"
            style={{
              fontFamily: 'var(--font-poppins)',
              fontWeight: 400,
              fontSize: '0.875rem',
            }}
          />
        </div>
      </div>
    </div>
  );
}
