'use client';

/**
 * Tiny cross-tree scroll coordinator.
 *
 * The landing page renders two fully isolated trees:
 *  - Desktop: sections are panels inside a GSAP-pinned HorizontalScroll, so
 *    "scrolling to a section" means moving the *vertical* scroll position to
 *    the point where the pinned track has panned that panel into view.
 *  - Mobile: sections are ordinary stacked blocks, so a normal
 *    `scrollIntoView` on the section's id works.
 *
 * HorizontalScroll registers a panel-scroller here while it's mounted. The
 * hero buttons call `scrollToSection(id)`, which uses the registered scroller
 * on desktop and falls back to id-based scrolling on mobile.
 */

export type PanelScroller = (panelIndex: number) => void;

/** Ordered section ids, matching the panel order in both landing trees. */
export const SECTION_ORDER = [
  'hero',
  'about',
  'features',
  'sample',
  'contacts',
] as const;

export type SectionId = (typeof SECTION_ORDER)[number];

let panelScroller: PanelScroller | null = null;

/** Called by HorizontalScroll on mount; pass null on unmount. */
export function registerPanelScroller(scroller: PanelScroller | null): void {
  panelScroller = scroller;
}

/**
 * Scroll to a section by id. Uses the desktop horizontal-scroll panel scroller
 * when one is registered, otherwise falls back to native id scrolling (mobile).
 */
export function scrollToSection(id: SectionId): void {
  const index = SECTION_ORDER.indexOf(id);

  if (panelScroller && index >= 0) {
    panelScroller(index);
    return;
  }

  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
