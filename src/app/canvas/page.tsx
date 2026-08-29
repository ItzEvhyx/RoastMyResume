'use client';

import { useEffect, useState } from 'react';
import StitchCanvasBackground from '@/rb_components/stitch_canvas_background';

export default function CanvasPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0e1015]">
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
