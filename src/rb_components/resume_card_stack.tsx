'use client';

import { useEffect, useState } from 'react';

export interface ResumeCardStackItem {
  image: string;
  alt?: string;
}

export interface ResumeCardStackProps {
  items: ResumeCardStackItem[];
  /** Width of the front card in px. Height is derived from the A4 ratio. */
  cardWidth?: number;
  /** Corner radius in px. */
  radius?: number;
  /** How many cards behind the front one are visible. */
  visible?: number;
  /** Horizontal offset per card behind, in px (negative = stacks to the left). */
  offsetX?: number;
  /** Vertical offset per card behind, in px. */
  offsetY?: number;
  /** Scale reduction per card behind (0.05 = 5% smaller each step). */
  scaleStep?: number;
  /** Auto-advance interval in ms. */
  interval?: number;
  className?: string;
}

// Resume templates are A4 portrait (1414 x 2000 ≈ 0.707).
const A4_RATIO = 2000 / 1414;

const ResumeCardStack = ({
  items,
  cardWidth = 420,
  radius = 10,
  visible = 2,
  offsetX = -26,
  offsetY = 14,
  scaleStep = 0.06,
  interval = 3000,
  className = '',
}: ResumeCardStackProps) => {
  const count = items.length;
  const cardHeight = Math.round(cardWidth * A4_RATIO);
  const [front, setFront] = useState(0);

  useEffect(() => {
    if (count < 2) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const id = setInterval(() => {
      setFront((f) => (f + 1) % count);
    }, Math.max(interval, 800));
    return () => clearInterval(id);
  }, [count, interval]);

  // Total footprint so the container reserves the right space for the stack.
  const stackW = cardWidth + Math.abs(offsetX) * visible;
  const stackH = cardHeight + Math.abs(offsetY) * visible;

  return (
    <div
      className={className}
      style={{ position: 'relative', width: stackW, height: stackH }}
      aria-roledescription="carousel"
      aria-label="Resume templates"
    >
      {items.map((item, i) => {
        // depth = how far this card is behind the front one (0 = front)
        const depth = (i - front + count) % count;
        const isVisible = depth <= visible;
        const scale = 1 - depth * scaleStep;

        return (
          <div
            key={i}
            aria-hidden={depth !== 0}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: cardWidth,
              height: cardHeight,
              borderRadius: radius,
              overflow: 'hidden',
              background: '#0b0d12',
              boxShadow:
                '0 30px 60px -20px rgba(0,0,0,0.65), 0 8px 20px -10px rgba(0,0,0,0.5)',
              transformOrigin: 'left center',
              transform: `translate(${offsetX * depth}px, ${offsetY * depth}px) scale(${scale})`,
              opacity: isVisible ? 1 : 0,
              zIndex: count - depth,
              transition:
                'transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 700ms ease, filter 700ms ease',
              filter: `brightness(${Math.max(0.4, 1 - depth * 0.22)})`,
              pointerEvents: 'none',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.alt || ''}
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ResumeCardStack;
