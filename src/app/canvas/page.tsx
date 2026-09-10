'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
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
import { useLeaveCanvasGuard } from '@/app/features/canvas_page/hooks/use.leave.canvas.guard';
import LeaveCanvasModal from '@/app/features/canvas_page/globals/leave.canvas.modal';
import AuthModal from '@/app/features/auth_modals/auth.modal';
import DocumentInputs from '@/app/features/canvas_page/document_panel/document.inputs';
import { useCanvas } from '@/app/features/canvas_page/context/CanvasContext';

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
 *
 * Stages only advance forward (`Math.max`). Mixing `requestAnimationFrame` for
 * stage 1 with absolute `setTimeout`s for 2–4 used to race when the tab was
 * backgrounded: timeouts could reach stage 4, then a deferred rAF reset to 1
 * and left the chrome permanently hidden.
 */
const ENTRANCE_STEPS: ReadonlyArray<{ stage: number; delayMs: number }> = [
  { stage: 1, delayMs: 0 },
  { stage: 2, delayMs: 600 },
  { stage: 3, delayMs: 900 },
  { stage: 4, delayMs: 1500 },
];

function advanceStage(next: number) {
  return (prev: number) => Math.max(prev, next);
}

function runEntranceSequence(
  setStage: Dispatch<SetStateAction<number>>,
  timers: Set<ReturnType<typeof setTimeout>>,
  holdMs = 0,
) {
  const start = () => {
    for (const { stage, delayMs } of ENTRANCE_STEPS) {
      const id = setTimeout(() => setStage(advanceStage(stage)), delayMs);
      timers.add(id);
    }
  };

  if (holdMs <= 0) {
    start();
    return;
  }

  const holdId = setTimeout(start, holdMs);
  timers.add(holdId);
}

export default function CanvasPage() {
  const [stage, setStage] = useState(0);
  const [mobileAssistOpen, setMobileAssistOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const entranceTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const clearEntranceTimers = useCallback(() => {
    entranceTimersRef.current.forEach(clearTimeout);
    entranceTimersRef.current.clear();
  }, []);

  const handleOpenSignIn = () => {
    setAuthModalMode('signin');
    setIsAuthModalOpen(true);
  };

  const handleOpenSignUp = () => {
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  useEffect(() => {
    const timers = entranceTimersRef.current;
    runEntranceSequence(setStage, timers);
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  // Replay the full 4-stage entrance animation after successful sign-in/sign-up
  const handleAuthSuccess = useCallback(() => {
    clearEntranceTimers();
    // Fade everything out to stage 0 first
    setStage(0);
    // Hold on black briefly, then re-run the full entrance sequence —
    // matches the landing → templates transition feel.
    runEntranceSequence(setStage, entranceTimersRef.current, 700);
  }, [clearEntranceTimers]);

  const {
    isLeaveModalOpen,
    requestLeave,
    onStay,
    onLeave,
  } = useLeaveCanvasGuard();

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
              <DocumentModeChrome
                stage={stage}
                isMobile={isMobile}
                mobileAssistOpen={mobileAssistOpen}
                setMobileAssistOpen={setMobileAssistOpen}
                handleOpenSignIn={handleOpenSignIn}
                handleOpenSignUp={handleOpenSignUp}
                handleAuthSuccess={handleAuthSuccess}
                requestLeave={requestLeave}
                isAuthModalOpen={isAuthModalOpen}
                authModalMode={authModalMode}
                setIsAuthModalOpen={setIsAuthModalOpen}
                isLeaveModalOpen={isLeaveModalOpen}
                onStay={onStay}
                onLeave={onLeave}
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

/** Chrome that respects document mode (hides tools, shows form panel on desktop). */
function DocumentModeChrome({
  stage,
  isMobile,
  mobileAssistOpen,
  setMobileAssistOpen,
  handleOpenSignIn,
  handleOpenSignUp,
  handleAuthSuccess,
  requestLeave,
  isAuthModalOpen,
  authModalMode,
  setIsAuthModalOpen,
  isLeaveModalOpen,
  onStay,
  onLeave,
}: {
  stage: number;
  isMobile: boolean | undefined;
  mobileAssistOpen: boolean;
  setMobileAssistOpen: Dispatch<SetStateAction<boolean>>;
  handleOpenSignIn: () => void;
  handleOpenSignUp: () => void;
  handleAuthSuccess: () => void;
  requestLeave: () => void;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  setIsAuthModalOpen: (open: boolean) => void;
  isLeaveModalOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
}) {
  const { isDocumentMode } = useCanvas();
  const toolsHidden = Boolean(isDocumentMode && isMobile === false);

  return (
    <>
      {/* Tool chrome — hidden (not overlapping) while document panel is active */}
      {isMobile ? (
        mobileAssistOpen ? null : <ToolSidebarMobile stage={stage} />
      ) : (
        <div
          className={
            toolsHidden
              ? 'pointer-events-none hidden'
              : 'contents'
          }
          aria-hidden={toolsHidden}
        >
          <ToolSidebarWeb stage={stage} />
        </div>
      )}

      {isMobile && !isDocumentMode && !mobileAssistOpen && <MobilePanelDismissal />}

      {!isMobile && (
        <div
          className={toolsHidden ? 'pointer-events-none hidden' : 'contents'}
          aria-hidden={toolsHidden}
        >
          <FontSelector />
        </div>
      )}
      {isMobile && !mobileAssistOpen && <FontSelector />}

      <div
        className={
          toolsHidden || (isMobile && mobileAssistOpen)
            ? 'pointer-events-none hidden'
            : 'contents'
        }
        aria-hidden={toolsHidden || Boolean(isMobile && mobileAssistOpen)}
      >
        <IconPicker />
        <ShapesTools />
        <LayersPanel />
        <ImageTools />
        <PenToolsWrapper />
        <ContainerGroupToolbar />
      </div>

      {/* Document form panel — desktop only; self-hides when inactive */}
      {!isMobile && <DocumentInputs />}

      {/* Assistant Panel — always available */}
      {isMobile === undefined ? null : isMobile
        ? <AssistPanelMobile stage={stage} isOpen={mobileAssistOpen} onSignUp={handleOpenSignUp} />
        : <AssistPanelWeb stage={stage} onSignUp={handleOpenSignUp} />}

      <div
        style={{
          opacity: stage >= 1 ? 1 : 0,
          transform: stage >= 1 ? 'none' : 'translateY(18px)',
          transition: 'opacity 0.55s ease-out, transform 0.55s ease-out',
        }}
      >
        <StitchCanvasBackground>
          {isMobile === undefined ? null : isMobile ? <CanvasMobile /> : <CanvasWeb />}
        </StitchCanvasBackground>
      </div>

      {isMobile === undefined ? null : isMobile
        ? <ToolbarMobile stage={stage} onAssistToggle={setMobileAssistOpen} onSignInClick={handleOpenSignIn} onSignOutClick={handleAuthSuccess} onBackClick={requestLeave} />
        : <ToolbarWeb stage={stage} onSignInClick={handleOpenSignIn} onSignOutClick={handleAuthSuccess} onBackClick={requestLeave} />}

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <LeaveCanvasModal
        isOpen={isLeaveModalOpen}
        onStay={onStay}
        onLeave={onLeave}
      />
    </>
  );
}

/** Closes mobile pickers when the user taps anywhere outside their panel. */
function MobilePanelDismissal() {
  const { activeTool, setActiveTool } = useText();

  useEffect(() => {
    if (activeTool !== 'iconset' && activeTool !== 'shapes' && activeTool !== 'image' && activeTool !== 'layers' && activeTool !== 'pen' && activeTool !== 'fontstyle') return;

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
