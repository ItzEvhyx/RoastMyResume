'use client';

import Image from 'next/image';

/**
 * ShapeFrameToggle
 *
 * Toolbar button that converts a shape into an image frame and back.
 * Lives here so that frame-related UI is co-located with the frame
 * rendering logic rather than buried inside shapes.tools.tsx.
 */
export function ShapeFrameToggle({
  isFrame,
  onToggle,
}: {
  isFrame: boolean;
  onToggle: () => void;
}) {
  const label = isFrame ? 'Convert to shape' : 'Convert to frame';
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onToggle}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/10 active:bg-white/20"
      style={{ background: isFrame ? 'rgba(255,255,255,0.13)' : 'transparent' }}
    >
      <Image
        src="/assets/tools_icons/frame_icon.png"
        alt=""
        width={24}
        height={24}
        draggable={false}
        className="pointer-events-none select-none opacity-80"
      />
    </button>
  );
}
