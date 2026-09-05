'use client';

/**
 * icons_set/color.overlay.tsx
 *
 * IconColorOverlay — renders an SVG icon with an exact, accurate color using
 * CSS masking instead of CSS filters.
 *
 * How it works:
 *   1. The original <img> is rendered hidden (opacity 0) so it keeps its
 *      layout space and loads the SVG.
 *   2. A <div> of the same size is absolutely positioned on top, painted with
 *      the chosen color, and uses the SVG URL as a CSS mask-image.
 *   The mask punches out the shape of the icon and fills it with the exact
 *   color — no hue-rotation approximation, no filter math.
 *
 * This approach works reliably for any single-color SVG regardless of the
 * original fill color baked into the source file.
 */

interface IconColorOverlayProps {
  /** Iconify SVG URL, e.g. https://api.iconify.design/mdi/email.svg */
  svgUrl: string;
  /** Exact hex or CSS color to apply */
  color: string;
  /** Default square size used by regular icons. */
  size: number;
  width?: number;
  height?: number;
  /** CSS transform for flip state */
  flipTransform?: string;
  className?: string;
}

export function IconColorOverlay({
  svgUrl,
  color,
  size,
  width = size,
  height = size,
  flipTransform,
  className,
}: IconColorOverlayProps) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width,
        height,
        flexShrink: 0,
        transform: flipTransform && flipTransform !== 'none' ? flipTransform : undefined,
        // Contain the mask overlay precisely
        display: 'inline-block',
      }}
    >
      {/* Invisible spacer image — keeps layout dimensions correct while the
          SVG resource is loaded by the browser. The mask below shares the
          same URL so the browser serves it from cache. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={svgUrl}
        alt=""
        aria-hidden
        draggable={false}
        width={width}
        height={height}
        style={{
          display: 'block',
          width,
          height,
          opacity: 0,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        loading="lazy"
      />

      {/* Color overlay — masked to the icon's shape */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: color,
          // Standard + WebKit mask properties for full browser coverage
          maskImage: `url(${svgUrl})`,
          maskSize: '100% 100%',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskImage: `url(${svgUrl})`,
          WebkitMaskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
          transition: 'background-color 0.12s ease',
        }}
      />
    </div>
  );
}
