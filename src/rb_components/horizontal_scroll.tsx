'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import {
  registerPanelScroller,
  type PanelScroller,
} from '@/rb_components/section_scroll';

export interface HorizontalScrollProps {
  children: ReactNode;
  /**
   * How much vertical scroll distance maps to the horizontal travel. 1 = the
   * track moves 1:1 with the scroll (default weight). Values > 1 require more
   * scrolling to move through the panels, so it feels heavier / more
   * deliberate — without any easing lag or gliding.
   */
  weight?: number;
  className?: string;
}

/**
 * Pins the section to the viewport and translates its inner track from right
 * to left as the user scrolls vertically.
 *
 * On top of the pan, it wires up per-panel reveal + parallax animations that
 * are driven by the panel's *horizontal* position (via ScrollTrigger's
 * `containerAnimation`), so:
 *   - Each panel blurs + fades + lifts in as it enters the viewport.
 *   - Any child with `data-speed="<n>"` drifts at a different rate than the
 *     track for a parallax depth effect (n < 1 = slower/back, n > 1 = faster).
 *
 * Each direct child is treated as one full-viewport panel.
 */
export default function HorizontalScroll({
  children,
  weight = 1.6,
  className = '',
}: HorizontalScrollProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;

    // Respect reduced-motion: skip the pin/parallax and let the panels stack
    // and read normally (they're already visible with no blur).
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    const ctx = gsap.context(() => {
      const getScrollAmount = () => track.scrollWidth - window.innerWidth;

      // The main horizontal pan. This tween is reused as `containerAnimation`
      // for every panel-level trigger below.
      //
      // `scrub: true` locks the track to the scroll position 1:1 — no easing
      // lag, no drift, no snap. The `weight` multiplier stretches the pin's
      // scroll distance so it feels heavier without gliding.
      const pan = gsap.to(track, {
        x: () => -getScrollAmount(),
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: () => `+=${getScrollAmount() * weight}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      const panels = gsap.utils.toArray<HTMLElement>('[data-panel]', track);

      // Expose a panel scroller so buttons elsewhere (e.g. "See Sample") can
      // pan the pinned track to a specific panel by animating the *vertical*
      // scroll position to where that panel is centered in the pan.
      const scrollToPanel: PanelScroller = (panelIndex) => {
        const st = pan.scrollTrigger;
        if (!st) return;
        const clamped = Math.max(0, Math.min(panelIndex, panels.length - 1));
        const progress =
          panels.length > 1 ? clamped / (panels.length - 1) : 0;
        const target = st.start + progress * (st.end - st.start);
        gsap.to(window, {
          scrollTo: { y: target, autoKill: false },
          duration: 1,
          ease: 'power2.inOut',
        });
      };
      registerPanelScroller(scrollToPanel);

      panels.forEach((panel, i) => {
        // Reveal: blur -> sharp, fade + slight lift as the panel enters.
        // The first panel (hero) is already on screen at load, so it starts
        // revealed rather than blurred.
        const inner = panel.querySelector<HTMLElement>('[data-panel-inner]') ?? panel;

        if (i === 0) {
          gsap.set(inner, { autoAlpha: 1, filter: 'blur(0px)', yPercent: 0 });
        } else {
          gsap.fromTo(
            inner,
            { autoAlpha: 0, filter: 'blur(14px)', yPercent: 6 },
            {
              autoAlpha: 1,
              filter: 'blur(0px)',
              yPercent: 0,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: panel,
                containerAnimation: pan,
                start: 'left 78%',
                end: 'left 40%',
                scrub: true,
              },
            }
          );
        }

        // Parallax: any element flagged with data-speed drifts horizontally
        // relative to the panel as it crosses the viewport.
        const parallaxEls = gsap.utils.toArray<HTMLElement>('[data-speed]', panel);
        parallaxEls.forEach((el) => {
          const speed = parseFloat(el.dataset.speed || '1');
          const shift = (1 - speed) * window.innerWidth * 0.5;
          gsap.fromTo(
            el,
            { xPercent: 0, x: shift },
            {
              x: -shift,
              ease: 'none',
              scrollTrigger: {
                trigger: panel,
                containerAnimation: pan,
                start: 'left right',
                end: 'right left',
                scrub: true,
              },
            }
          );
        });
      });
    }, root);

    return () => {
      registerPanelScroller(null);
      ctx.revert();
    };
  }, [weight]);

  return (
    <div ref={rootRef} className={`overflow-hidden ${className}`}>
      <div
        ref={trackRef}
        className="flex h-screen flex-nowrap will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}

/**
 * A single full-viewport panel for use as a direct child of HorizontalScroll.
 * The inner wrapper is the element that gets the blur/reveal animation, so the
 * panel box itself stays put while its contents fade in.
 */
export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-panel
      className={`flex h-screen w-screen shrink-0 items-center justify-center ${className}`}
    >
      <div data-panel-inner className="flex w-full items-center justify-center">
        {children}
      </div>
    </div>
  );
}
