'use client';

import Image from 'next/image';

interface LockButtonProps {
  isLocked: boolean;
  onToggle: () => void;
}

/**
 * Reusable lock/unlock toggle button for element toolbars.
 * Shows unlocked icon by default, switches to locked when toggled.
 */
export function LockButton({ isLocked, onToggle }: LockButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isLocked ? 'Unlock element' : 'Lock element'}
      aria-label={isLocked ? 'Unlock element' : 'Lock element'}
      className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150 hover:bg-white/10 active:scale-90"
      style={{
        background: isLocked ? 'rgba(255,255,255,0.12)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <Image
        src={isLocked ? '/assets/tools_icons/locked_icon.png' : '/assets/tools_icons/unlocked_icon.png'}
        alt={isLocked ? 'Locked' : 'Unlocked'}
        width={24}
        height={24}
        draggable={false}
        className="pointer-events-none select-none"
        style={{
          opacity: isLocked ? 1 : 0.7,
        }}
      />
    </button>
  );
}

/**
 * Divider for toolbars
 */
export function ToolbarDivider() {
  return (
    <div
      style={{
        width: 1,
        height: 26,
        background: 'rgba(255,255,255,0.2)',
        marginInline: 4,
        flexShrink: 0,
      }}
    />
  );
}
