'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMediaQuery } from '@/lib/use_media_query';
import StitchCanvasBackground from '@/rb_components/stitch_canvas_background';
import { CanvasProvider } from '@/app/features/canvas_page/context/CanvasContext';
import { TextProvider } from '@/app/features/canvas_page/context/TextContext';
import { DeniseAnalysisProvider } from '@/app/features/canvas_page/context/DeniseAnalysisContext';
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
import ShapesTools from '@/app/features/canvas_page/tool_sidebar/shapes/shapes.tools';
import ImageTools from '@/app/features/canvas_page/tool_sidebar/image/image.tools';
import { PenTools } from '@/app/features/canvas_page/tool_sidebar/pen/pen.tools';
import { ContainerProvider } from '@/app/features/canvas_page/context/ContainerContext';
import { GroupProvider } from '@/app/features/canvas_page/context/GroupContext';
import { ContainerGroupToolbar } from '@/app/features/canvas_page/tool_sidebar/container/container.group';
import LayersPanel from '@/app/features/canvas_page/globals/layer';
import { LayerOrderProvider } from '@/app/features/canvas_page/globals/layer.order';
import CanvasWeb from '@/app/features/canvas_page/canvas/canvas.web';
import CanvasMobile from '@/app/features/canvas_page/canvas/canvas.mobile';
import { ClipboardProvider } from '@/app/features/canvas_page/globals/pasting';
import { UndoProvider } from '@/app/features/canvas_page/globals/undo';
import { usePen } from '@/app/features/canvas_page/context/PenContext';
import { useText } from '@/app/features/canvas_page/context/TextContext';
import { RulerSnappingProvider } from '@/app/features/canvas_page/globals/ruler.snapping';
import { useCanvasPersistence } from '@/app/features/canvas_page/hooks/use.canvas.persistence';
import AuthModal from '@/app/features/auth_modals/auth.modal';

// Component that handles canvas persistence
function CanvasPersistenceManager() {
  useCanvasPersistence();
  return null;
}

/**
 * Animation sequence:
 *   stage 0 → page hidden (translateY + opacity 0)
 *   stage 1 → page fades/drifts in                                       (~0ms   → 550ms)
 *   stage 2 → toolbar buttons pop in                                     (~600ms)
 *   stage 3 → sidebar & assistant panel appear (collapsed)               (~900ms)
 *   stage 4 → sidebar expands vertically & assist panel expands horizontally (~1500ms)
 */
export default function CanvasPage() {
  const [stage, setStage] = useState(0);
  const [mobileAssistOpen, setMobileAssistOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const handleOpenSignIn = () => {
    setAuthModalMode('signin');
    setIsAuthModalOpen(true);
  };

  const handleOpenSignUp = () => {
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

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

  // Replay the full 4-stage entrance animation after successful sign-in/sign-up
  const handleAuthSuccess = useCallback(() => {
    // Fade everything out to stage 0 first
    setStage(0);
    // Hold on black briefly, then re-run the full entrance sequence —
    // matches the landing → templates transition feel.
    setTimeout(() => {
      requestAnimationFrame(() => setStage(1));  // page fade in
      setTimeout(() => setStage(2), 600);         // toolbar pop in
      setTimeout(() => setStage(3), 900);         // sidebar appears
      setTimeout(() => setStage(4), 1500);        // sidebar expands
    }, 700); // 550ms fade-out + brief hold
  }, []);

  return (
    <CanvasProvider>
      <UndoProvider>
        <LayerOrderProvider>
        <TextProvider>
          <DeniseAnalysisProvider>
          <DividerProvider>
            <IconProvider>
              <PenProvider>
                <ContainerProvider>
                <GroupProvider>
                <RulerSnappingProvider>
                <ClipboardProvider>
            
            {/* Canvas Persistence Manager - handles auto-save/load */}
            <CanvasPersistenceManager />
            
            <main className="relative h-[100dvh] min-h-0 w-full overflow-hidden bg-[#0e1015]">

              {/* Tool sidebar — appears at stage 3, expands at stage 4 */}
              {isMobile === undefined ? null : isMobile
                ? <ToolSidebarMobile stage={stage} />
                : <ToolSidebarWeb stage={stage} />}

              {isMobile && <MobilePanelDismissal />}

              {/* Font Selector — appears when text is selected (desktop only) */}
              {!isMobile && <FontSelector />}

              {/* Tool panels position themselves beside the desktop toolbar or
                  directly above the mobile toolbar. */}
              <IconPicker />

              <ShapesTools />

              <LayersPanel />

              <ImageTools />

              <PenToolsWrapper />

              {/* Container group toolbar — floats above selection when committed */}
              <ContainerGroupToolbar />

              {/* Assistant Panel — appears at stage 2 */}
              {isMobile === undefined ? null : isMobile
                ? <AssistPanelMobile stage={stage} isOpen={mobileAssistOpen} onSignUp={handleOpenSignUp} />
                : <AssistPanelWeb stage={stage} onSignUp={handleOpenSignUp} />}

              {/* Canvas — fades + drifts up at stage 1 */}
              <div
                style={{
                  opacity: stage >= 1 ? 1 : 0,
                  // `translateY(0)` still creates a containing block for
                  // fixed descendants. Clear it once the entrance finishes.
                  transform: stage >= 1 ? 'none' : 'translateY(18px)',
                  transition: 'opacity 0.55s ease-out, transform 0.55s ease-out',
                }}
              >
                <StitchCanvasBackground>
                  {isMobile === undefined ? null : isMobile ? <CanvasMobile /> : <CanvasWeb />}
                </StitchCanvasBackground>
              </div>

              {/* Toolbar — pops in at stage 2 */}
              {isMobile === undefined ? null : isMobile
                ? <ToolbarMobile stage={stage} onAssistToggle={setMobileAssistOpen} onSignInClick={handleOpenSignIn} onSignOutClick={handleAuthSuccess} />
                : <ToolbarWeb stage={stage} onSignInClick={handleOpenSignIn} onSignOutClick={handleAuthSuccess} />}

              {/* Auth Modal */}
              <AuthModal
                isOpen={isAuthModalOpen}
                initialMode={authModalMode}
                onClose={() => setIsAuthModalOpen(false)}
                onAuthSuccess={handleAuthSuccess}
              />
            </main>
            </ClipboardProvider>
              </RulerSnappingProvider>
              </GroupProvider>
              </ContainerProvider>
              </PenProvider>
            </IconProvider>
          </DividerProvider>
          </DeniseAnalysisProvider>
        </TextProvider>
        </LayerOrderProvider>
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
    selectedStrokeId,
    strokes,
    updateStroke,
  } = usePen();
  
  // Find the selected stroke if one exists
  const selectedStroke = selectedStrokeId ? strokes.find(s => s.id === selectedStrokeId) : undefined;
  
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
      isLocked={selectedStroke?.isLocked}
      onLockToggle={selectedStroke ? () => updateStroke(selectedStroke.id, { isLocked: !selectedStroke.isLocked }) : undefined}
    />
  );
}

/** Closes mobile pickers when the user taps anywhere outside their panel. */
function MobilePanelDismissal() {
  const { activeTool, setActiveTool } = useText();

  useEffect(() => {
    if (activeTool !== 'iconset' && activeTool !== 'shapes') return;

    const dismissOnOutsideTouch = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-mobile-tool-sidebar], [data-mobile-tool-panel]')) return;
      setActiveTool(null);
    };

    document.addEventListener('pointerdown', dismissOnOutsideTouch);
    return () => document.removeEventListener('pointerdown', dismissOnOutsideTouch);
  }, [activeTool, setActiveTool]);

  return null;
}
