'use client';

/**
 * use.leave.canvas.guard.ts
 *
 * Blocks leaving /canvas until the user confirms. Covers:
 *  - In-app Back button (call requestLeave)
 *  - Browser back / forward (popstate trap)
 *  - Tab close / refresh / typed URL (beforeunload)
 *  - In-app link clicks away from /canvas
 *
 * Confirming leave clears canvas + Denise persistence (discard).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearCanvasState } from '../services/canvas.persistence';

type LeaveAction =
  | { type: 'history-back' }
  | { type: 'href'; href: string }
  | { type: 'router-back' };

export function useLeaveCanvasGuard() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const pendingRef = useRef<LeaveAction | null>(null);
  const allowLeaveRef = useRef(false);
  const armedRef = useRef(false);

  const armHistoryTrap = useCallback(() => {
    if (typeof window === 'undefined') return;
    // Extra history entry so the first Back hits our trap instead of leaving.
    window.history.pushState({ __canvasGuard: true }, '', window.location.href);
    armedRef.current = true;
  }, []);

  useEffect(() => {
    armHistoryTrap();

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowLeaveRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    const onPopState = () => {
      if (allowLeaveRef.current) return;
      // User hit browser Back — put them back on canvas and ask.
      armHistoryTrap();
      pendingRef.current = { type: 'history-back' };
      setIsOpen(true);
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (allowLeaveRef.current) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const hrefAttr = anchor.getAttribute('href');
      if (!hrefAttr || hrefAttr.startsWith('#')) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname.startsWith('/canvas')) return;

      event.preventDefault();
      event.stopPropagation();
      pendingRef.current = { type: 'href', href: url.pathname + url.search + url.hash };
      setIsOpen(true);
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('popstate', onPopState);
    document.addEventListener('click', onDocumentClick, true);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('click', onDocumentClick, true);
    };
  }, [armHistoryTrap]);

  const requestLeave = useCallback(() => {
    pendingRef.current = { type: 'router-back' };
    setIsOpen(true);
  }, []);

  const onStay = useCallback(() => {
    pendingRef.current = null;
    setIsOpen(false);
  }, []);

  const onLeave = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setIsOpen(false);

    // Discard resume + Denise chat for this document
    clearCanvasState();
    allowLeaveRef.current = true;

    if (pending?.type === 'href') {
      router.push(pending.href);
      return;
    }

    // history-back / router-back → templates is the safe destination
    // (history may be messy after our pushState trap)
    router.push('/templates');
  }, [router]);

  return {
    isLeaveModalOpen: isOpen,
    requestLeave,
    onStay,
    onLeave,
  };
}
