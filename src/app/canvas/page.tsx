'use client';

import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/lib/use_media_query';
import StitchCanvasBackground from '@/rb_components/stitch_canvas_background';
import ToolbarWeb from '@/app/features/canvas_page/toolbar/toolbar.web';
import ToolbarMobile from '@/app/features/canvas_page/toolbar/toolbar.mobile';
import ToolSidebarWeb from '@/app/features/canvas_page/tool_sidebar/tool_sidebar.web';
import ToolSidebarMobile from '@/app/features/canvas_page/tool_sidebar/tool_sidebar.mobile';
import CanvasWeb from '@/app/features/canvas_page/canvas/canvas.web';
import CanvasMobile from '@/app/features/canvas_page/canvas/canvas.mobile';

/**
 * Animation sequence:
 *   stage 0 → page hidden (translateY + opacity 0)
 *   stage 1 → page fades/drifts in            (~0ms   → 550ms)
 *   stage 2 → toolbar buttons pop in           (~600ms)
 *   stage 3 → sidebar appears (collapsed)      (~900ms)
 *   stage 4 → sidebar auto-expands             (~1500ms)  ← longer delay, slower expansion
 */
export default function CanvasPage() {
  const [stage, setStage] = useState(0);
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    const timers = [
      requestAnimationFrame(() => setStage(1)),            // page entry
      setTimeout(() => setStage(2), 600),                  // toolbar pop in
      setTimeout(() => setStage(3), 900),                  // sidebar appears
      setTimeout(() => setStage(4), 1500),                 // sidebar expands (600ms after appearing)
    ];
    return () => {
      cancelAnimationFrame(timers[0] as unknown as number);
      timers.slice(1).forEach(t => clearTimeout(t as unknown as ReturnType<typeof setTimeout>));
    };
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0e1015]">

      {/* Toolbar — pops in at stage 2 */}
      {isMobile === undefined ? null : isMobile
        ? <ToolbarMobile stage={stage} />
        : <ToolbarWeb stage={stage} />}

      {/* Tool sidebar — appears at stage 3, expands at stage 4 */}
      {isMobile === undefined ? null : isMobile
        ? <ToolSidebarMobile stage={stage} />
        : <ToolSidebarWeb stage={stage} />}

      {/* Canvas — fades + drifts up at stage 1 */}
      <div
        style={{
          opacity: stage >= 1 ? 1 : 0,
          transform: stage >= 1 ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 0.55s ease-out, transform 0.55s ease-out',
        }}
      >
        <StitchCanvasBackground>
          {isMobile === undefined ? null : isMobile ? <CanvasMobile /> : <CanvasWeb />}
        </StitchCanvasBackground>
      </div>
    </main>
  );
}
