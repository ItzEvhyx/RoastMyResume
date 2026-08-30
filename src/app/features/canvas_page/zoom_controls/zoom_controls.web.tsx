'use client';

import { useCanvas } from '../context/CanvasContext';

const glassStyle: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.55)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
};

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.05;

export default function ZoomControlsWeb({ stage }: { stage: number }) {
  const { zoom, setZoom, resetView } = useCanvas();
  const visible = stage >= 3;

  const popStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1) translateX(0)' : 'scale(0.85) translateX(12px)',
    transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
  };

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 z-40"
      style={popStyle}
    >
      {/* Compact zoom pill */}
      <div
        className="pointer-events-auto flex flex-col items-center gap-0.5 rounded-full px-2.5 py-2"
        style={glassStyle}
      >
        <button
          onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-base text-white/80 transition-all hover:bg-white/10 active:scale-90"
          title="Zoom in"
        >
          +
        </button>
        <div className="px-1 py-0.5 text-center text-[10px] text-white/60">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-base text-white/80 transition-all hover:bg-white/10 active:scale-90"
          title="Zoom out"
        >
          −
        </button>
        <div className="my-0.5 h-px w-6 bg-white/15" />
        <button
          onClick={resetView}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/10 active:scale-90"
          title="Reset view"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2L8 8L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
