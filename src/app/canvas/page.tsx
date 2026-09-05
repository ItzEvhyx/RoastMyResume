'use client';

import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/lib/use_media_query';
import StitchCanvasBackground from '@/rb_components/stitch_canvas_background';
import { CanvasProvider } from '@/app/features/canvas_page/context/CanvasContext';
import { TextProvider } from '@/app/features/canvas_page/context/TextContext';
import { DividerProvider } from '@/app/features/canvas_page/context/DividerContext';
import { IconProvider } from '@/app/features/canvas_page/context/IconContext';
import { PenProvider } from '@/app/features/canvas_page/context/PenContext';
import ToolbarWeb from '@/app/features/canvas_page/toolbar/toolbar.web';
import ToolbarMobile from '@/app/features/canvas_page/toolbar/toolbar.mobile';
import ToolSidebarWeb from '@/app/features/canvas_page/tool_sidebar/tool_sidebar.web';
import ToolSidebarMobile from '@/app/features/canvas_page/tool_sidebar/tool_sidebar.mobile';
import AssistPanelWeb from '@/app/features/canvas_page/assist_panel/assist.panel.web';
import AssistPanelMobile from '@/app/features/canvas_page/assist_panel/assist.panel.mobile';
import FontSelector from '@/app/features/canvas_page/tool_sidebar/texts/select.font';
import IconPicker from '@/app/features/canvas_page/tool_sidebar/icons_set/pick.icon';
import { PenTools } from '@/app/features/canvas_page/tool_sidebar/pen/pen.tools';
import CanvasWeb from '@/app/features/canvas_page/canvas/canvas.web';
import CanvasMobile from '@/app/features/canvas_page/canvas/canvas.mobile';
import { ClipboardProvider } from '@/app/features/canvas_page/globals/pasting';
import { UndoProvider } from '@/app/features/canvas_page/globals/undo';
import { usePen } from '@/app/features/canvas_page/context/PenContext';

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
  const [mobileAssistOpen, setMobileAssistOpen] = useState(false);
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
    <CanvasProvider>
      <UndoProvider>
        <TextProvider>
          <DividerProvider>
            <IconProvider>
              <PenProvider>
                <ClipboardProvider>
            <main className="relative min-h-screen w-full overflow-hidden bg-[#0e1015]">

              {/* Toolbar — pops in at stage 2 */}
              {isMobile === undefined ? null : isMobile
                ? <ToolbarMobile stage={stage} onAssistToggle={setMobileAssistOpen} />
                : <ToolbarWeb stage={stage} />}

              {/* Tool sidebar — appears at stage 3, expands at stage 4 */}
              {isMobile === undefined ? null : isMobile
                ? <ToolSidebarMobile stage={stage} />
                : <ToolSidebarWeb stage={stage} />}

              {/* Font Selector — appears when text is selected (desktop only) */}
              {!isMobile && <FontSelector />}

              {/* Icon Picker — appears when iconset tool is active (desktop only) */}
              {!isMobile && <IconPicker />}

              {/* Pen Tools — appears when pen tool is active (desktop only) */}
              {!isMobile && <PenToolsWrapper />}

              {/* Assistant Panel — appears at stage 2 */}
              {isMobile === undefined ? null : isMobile
                ? <AssistPanelMobile stage={stage} isOpen={mobileAssistOpen} />
                : <AssistPanelWeb stage={stage} />}

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
            </ClipboardProvider>
              </PenProvider>
            </IconProvider>
          </DividerProvider>
        </TextProvider>
      </UndoProvider>
    </CanvasProvider>
  );
}

// Wrapper component to use the pen context
function PenToolsWrapper() {
  const {
    isPenActive,
    penColor,
    setPenColor,
    penThickness,
    setPenThickness,
    eraserSize,
    setEraserSize,
    isEraserActive,
    setIsEraserActive,
  } = usePen();
  
  return (
    <PenTools
      isActive={isPenActive}
      color={penColor}
      thickness={penThickness}
      eraserSize={eraserSize}
      isEraserActive={isEraserActive}
      onColorChange={setPenColor}
      onThicknessChange={setPenThickness}
      onEraserSizeChange={setEraserSize}
      onEraserToggle={() => setIsEraserActive(!isEraserActive)}
    />
  );
}
