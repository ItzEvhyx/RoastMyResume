'use client';

import { useState } from 'react';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

interface AssistPanelWebProps {
  stage: number;
}

export default function AssistPanelWeb({ stage }: AssistPanelWebProps) {
  const [isOpen, setIsOpen] = useState(true);

  const visible = stage >= 2;

  // Glass morphism style
  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  };

  const expandedWidth = 440;
  const collapsedWidth = 0;

  return (
    <div
      className={`fixed right-6 top-20 flex flex-col gap-4 ${poppins.variable}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(40px)',
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
        pointerEvents: visible ? 'auto' : 'none',
        zIndex: 50,
      }}
    >
      {/* Content Nav - Horizontal pill */}
      <div
        className="overflow-hidden rounded-full px-6 py-4"
        style={{
          ...glassStyle,
          height: '60px',
          width: isOpen ? `${expandedWidth}px` : `${collapsedWidth}px`,
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Content nav items will go here */}
        <div
          className="flex h-full items-center justify-center whitespace-nowrap"
          style={{
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.2s ease-out',
          }}
        >
          <span className="text-sm font-medium text-white/60">Content Nav</span>
        </div>
      </div>

      {/* Content Panel with Chevron Button */}
      <div className="relative">
        {/* Chevron Toggle Button - sticks out on the left, seamless with content */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-0 top-1/2 z-10 flex items-center justify-center rounded-l-2xl transition-all duration-200 hover:brightness-110 active:scale-95"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRight: 'none', // Seamless connection
            width: '40px',
            height: '80px',
            transform: 'translate(-100%, -50%)',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease',
            }}
          >
            <path
              d="M9 18L15 12L9 6"
              stroke="white"
              strokeOpacity="0.8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Content Panel - collapses like toolbar */}
        <div
          className="overflow-hidden rounded-3xl p-6"
          style={{
            ...glassStyle,
            height: 'calc(100vh - 160px)',
            minHeight: '500px',
            maxHeight: '800px',
            width: isOpen ? `${expandedWidth}px` : `${collapsedWidth}px`,
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Content will go here - fades out when closing */}
          <div
            className="flex h-full items-center justify-center whitespace-nowrap"
            style={{
              opacity: isOpen ? 1 : 0,
              transition: 'opacity 0.2s ease-out',
            }}
          >
            <span className="text-sm font-medium text-white/60">Assistant Content</span>
          </div>
        </div>
      </div>
    </div>
  );
}
