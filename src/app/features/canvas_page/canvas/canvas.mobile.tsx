'use client';

import { useRef } from 'react';

/**
 * Mobile version: canvas scaled down to fit screen while maintaining A4 aspect ratio
 */
export default function CanvasMobile() {
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-20 pb-32">
      {/* A4 Canvas - scaled to fit mobile - using inline styles */}
      <div
        ref={canvasRef}
        id="resume-canvas"
        style={{
          width: '100%',
          maxWidth: '360px',
          aspectRatio: '798 / 1123', // A4 ratio
          position: 'relative',
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Canvas content will go here */}
      </div>
    </div>
  );
}
