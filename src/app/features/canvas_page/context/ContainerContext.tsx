'use client';

/**
 * ContainerContext
 *
 * Drives the lasso multi-select / group tool.
 *
 * State machine
 * ─────────────
 *   idle         → user hasn't started drawing a lasso yet
 *   drawing      → user is dragging the selection rect
 *   committed    → drag ended; elements are selected; Group/Delete toolbar is visible
 *
 * Selected IDs are typed so downstream code knows which context to call for
 * updates / deletes without doing id-prefix sniffing at call sites.
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LassoState = 'idle' | 'drawing' | 'committed';

/** Canvas-space lasso rectangle (all values in px, 0-794 / 0-1123). */
export interface LassoRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectedElementIds {
  textIds: string[];
  dividerIds: string[];
  iconIds: string[];
  strokeIds: string[];
}

const EMPTY_SELECTION: SelectedElementIds = {
  textIds: [],
  dividerIds: [],
  iconIds: [],
  strokeIds: [],
};

function totalCount(sel: SelectedElementIds) {
  // Fast Refresh can preserve a selection created before pen strokes were
  // added to this model, so accept that older state until the next lasso.
  return sel.textIds.length + sel.dividerIds.length + sel.iconIds.length + (sel.strokeIds?.length ?? 0);
}

// ─── Context interface ────────────────────────────────────────────────────────

interface ContainerContextType {
  /** Whether the lasso tool is active (the 'container' sidebar button is on). */
  isLassoActive: boolean;
  setIsLassoActive: (active: boolean) => void;

  lassoState: LassoState;

  /** The rect being drawn or the last completed rect (canvas coords). */
  lassoRect: LassoRect | null;

  /** Elements hit by the last completed lasso. */
  selection: SelectedElementIds;

  /** Total number of selected elements. */
  selectionCount: number;

  /** Called by LassoCanvas when the user starts dragging. */
  startLasso: (x: number, y: number) => void;

  /** Called on every mousemove while drawing. */
  updateLasso: (x: number, y: number) => void;

  /**
   * Called on mouseup.  Pass the final hit-tested element ids.
   * If nothing was hit, reverts to idle.
   */
  commitLasso: (selection: SelectedElementIds) => void;

  /** Clear selection and return to idle (e.g. after Group/Delete or Escape). */
  clearLasso: () => void;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const ContainerContext = createContext<ContainerContextType | undefined>(undefined);

export function ContainerProvider({ children }: { children: ReactNode }) {
  const [isLassoActive, setIsLassoActiveState] = useState(false);
  const [lassoState, setLassoState] = useState<LassoState>('idle');
  const [lassoRect, setLassoRect] = useState<LassoRect | null>(null);
  const [anchorX, setAnchorX] = useState(0);
  const [anchorY, setAnchorY] = useState(0);
  const [selection, setSelection] = useState<SelectedElementIds>(EMPTY_SELECTION);

  const setIsLassoActive = useCallback((active: boolean) => {
    setIsLassoActiveState(active);
    if (!active) {
      // Deactivating the tool also clears any in-progress lasso.
      setLassoState('idle');
      setLassoRect(null);
      setSelection(EMPTY_SELECTION);
    }
  }, []);

  const startLasso = useCallback((x: number, y: number) => {
    setAnchorX(x);
    setAnchorY(y);
    setLassoRect({ x, y, width: 0, height: 0 });
    setLassoState('drawing');
    setSelection(EMPTY_SELECTION);
  }, []);

  const updateLasso = useCallback(
    (x: number, y: number) => {
      setLassoRect({
        x: Math.min(x, anchorX),
        y: Math.min(y, anchorY),
        width: Math.abs(x - anchorX),
        height: Math.abs(y - anchorY),
      });
    },
    [anchorX, anchorY],
  );

  const commitLasso = useCallback((sel: SelectedElementIds) => {
    if (totalCount(sel) === 0) {
      // Nothing hit → go back to idle but keep tool active.
      setLassoState('idle');
      setLassoRect(null);
      setSelection(EMPTY_SELECTION);
      return;
    }
    setSelection(sel);
    setLassoState('committed');
  }, []);

  const clearLasso = useCallback(() => {
    setLassoState('idle');
    setLassoRect(null);
    setSelection(EMPTY_SELECTION);
  }, []);

  return (
    <ContainerContext.Provider
      value={{
        isLassoActive,
        setIsLassoActive,
        lassoState,
        lassoRect,
        selection,
        selectionCount: totalCount(selection),
        startLasso,
        updateLasso,
        commitLasso,
        clearLasso,
      }}
    >
      {children}
    </ContainerContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useContainer() {
  const ctx = useContext(ContainerContext);
  if (!ctx) throw new Error('useContainer must be used within a ContainerProvider');
  return ctx;
}
