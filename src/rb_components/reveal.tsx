'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';

export interface RevealProps {
  children: ReactNode;
  /** Delay (ms) before this element animates in, for staggering siblings. */
  delay?: number;
  /** Blur radius (px) applied while hidden. */
  blur?: number;
  /** Vertical lift (px) the element rises from while revealing. */
  y?: number;
  /** Transition duration (ms). */
  duration?: number;
  /** Reveal once and stay (default) or re-hide when scrolled out of view. */
  once?: boolean;
  /** Element tag to render. Defaults to a div. */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

/**
 * Lazy-scroll reveal: children start blurred, faded, and lifted, then sharpen
 * and settle into place when scrolled into view. Uses IntersectionObserver so
 * it's cheap and framework-free.
 *
 * Respects `prefers-reduced-motion` — motion users get an instant, fully
 * visible element with no blur or transition.
 */
export default function Reveal({
  children,
  delay = 0,
  blur = 12,
  y = 24,
  duration = 700,
  once = true,
  as,
  className = '',
  style,
}: RevealProps) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, reduced]);

  const shown = reduced || visible;

  const motionStyle: CSSProperties = reduced
    ? {}
    : {
        opacity: shown ? 1 : 0,
        filter: shown ? 'blur(0px)' : `blur(${blur}px)`,
        transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity ${duration}ms ease-out, filter ${duration}ms ease-out, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        transitionDelay: `${delay}ms`,
        willChange: 'opacity, filter, transform',
      };

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ ...motionStyle, ...style }}
    >
      {children}
    </Tag>
  );
}
