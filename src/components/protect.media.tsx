'use client';

import { useEffect } from 'react';

const MEDIA_SELECTOR = 'img, video, svg, picture';

function isProtectedMedia(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest('[data-allow-media-interact]')) return false;
  return Boolean(target.closest(MEDIA_SELECTOR));
}

/**
 * Site-wide: block native drag-off and “save as” on PNGs / SVGs / videos / etc.
 * Matches the grab_icon / depth-carousel pattern (draggable=false + no user-drag).
 * Opt out with data-allow-media-interact on a parent when needed.
 */
export default function ProtectMedia() {
  useEffect(() => {
    const onDragStart = (e: DragEvent) => {
      if (isProtectedMedia(e.target)) e.preventDefault();
    };

    const onContextMenu = (e: MouseEvent) => {
      if (isProtectedMedia(e.target)) e.preventDefault();
    };

    document.addEventListener('dragstart', onDragStart, true);
    document.addEventListener('contextmenu', onContextMenu, true);
    return () => {
      document.removeEventListener('dragstart', onDragStart, true);
      document.removeEventListener('contextmenu', onContextMenu, true);
    };
  }, []);

  return null;
}
