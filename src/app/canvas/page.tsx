'use client';

import { useEffect, useState } from 'react';
import StitchCanvasBackground from '@/rb_components/stitch_canvas_background';
import { useMediaQuery } from '@/lib/use_media_query';
import ToolbarWeb from '@/app/features/canvas_page/toolbar/toolbar.web';
import ToolbarMobile from '@/app/features/canvas_page/toolbar/toolbar.mobile';
import ToolSidebarWeb from '@/app/features/canvas_page/tool_sidebar/tool_sidebar.web';
import ToolSidebarMobile from '@/app/features/canvas_page/tool_sidebar/tool_sidebar.mobile';

export default function CanvasPage() {
  const [ready, setReady] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0e1015]">
      {/* Toolbar — fixed overlay, outside the entry animation wrapper */}
      {isMobile === undefined ? null : isMobile ? <ToolbarMobile /> : <ToolbarWeb />}

      {/* Tool sidebar — vertically centered on the left */}
      {isMobile === undefined ? null : isMobile ? <ToolSidebarMobile /> : <ToolSidebarWeb />}

      <div
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 0.55s ease-out, transform 0.55s ease-out',
        }}
      >
        <StitchCanvasBackground>
          {/* Components will be placed here on top of the Stitch canvas background */}
        </StitchCanvasBackground>
      </div>
    </main>
  );
}
