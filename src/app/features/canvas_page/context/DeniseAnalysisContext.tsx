'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { useText } from './TextContext';

export type DeniseSeverity = 'weak' | 'vague' | 'improve';

export interface DeniseHighlight {
  elementId: string;
  quote: string;
  severity: DeniseSeverity;
}

export interface DeniseFix {
  elementId: string;
  suggestedContent: string;
}

interface DeniseAnalysisContextType {
  isScanning: boolean;
  isAnalyzing: boolean;
  highlights: DeniseHighlight[];
  fixes: DeniseFix[];
  applied: boolean;
  showingAfter: boolean;
  /** Element ids Denise already rewrote — still match her suggested text. */
  bulletproofById: Record<string, string>;
  /** Start looping scan overlay (stops only via completeScan). */
  beginScan: (options?: { clearFixes?: boolean }) => void;
  /** Stop the scan once Denise finishes thinking. */
  completeScan: () => void;
  setIsAnalyzing: (value: boolean) => void;
  setAnalysisResult: (result: {
    highlights: DeniseHighlight[];
    fixes: DeniseFix[];
  }) => void;
  /** Roast mode: update canvas highlights without wiping Help-me fixes / apply state. */
  setHighlightsOnly: (highlights: DeniseHighlight[]) => void;
  applyFixes: () => void;
  toggleBeforeAfter: () => void;
  abandonFixes: () => void;
  clearAnalysis: () => void;
}

const DeniseAnalysisContext = createContext<DeniseAnalysisContextType | undefined>(
  undefined,
);

const SEVERITIES: DeniseSeverity[] = ['weak', 'vague', 'improve'];

export function isDeniseSeverity(value: unknown): value is DeniseSeverity {
  return typeof value === 'string' && SEVERITIES.includes(value as DeniseSeverity);
}

export function DeniseAnalysisProvider({ children }: { children: ReactNode }) {
  const { textElements, updateElement, startUpdateBatch, endUpdateBatch } = useText();

  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [highlights, setHighlights] = useState<DeniseHighlight[]>([]);
  const [fixes, setFixes] = useState<DeniseFix[]>([]);
  const [applied, setApplied] = useState(false);
  const [showingAfter, setShowingAfter] = useState(false);
  const [checkpoint, setCheckpoint] = useState<Record<string, string>>({});
  const [bulletproofById, setBulletproofById] = useState<Record<string, string>>(
    {},
  );

  const clearAnalysis = useCallback(() => {
    setHighlights([]);
    setFixes([]);
    setApplied(false);
    setShowingAfter(false);
    setCheckpoint({});
    setIsAnalyzing(false);
    setIsScanning(false);
    // Keep bulletproofById — approved rewrites stay trusted across asks
  }, []);

  const beginScan = useCallback((options?: { clearFixes?: boolean }) => {
    const clearFixes = options?.clearFixes !== false;
    setHighlights([]);
    if (clearFixes) {
      setFixes([]);
      setApplied(false);
      setShowingAfter(false);
      setCheckpoint({});
    }
    setIsScanning(true);
  }, []);

  const completeScan = useCallback(() => {
    setIsScanning(false);
  }, []);

  const filterAgainstBulletproof = useCallback(
    <T extends { elementId: string }>(items: T[]): T[] =>
      items.filter((item) => {
        const approved = bulletproofById[item.elementId];
        if (!approved) return true;
        const live = textElements.find((t) => t.id === item.elementId);
        return !live || live.content !== approved;
      }),
    [bulletproofById, textElements],
  );

  const setAnalysisResult = useCallback(
    (result: { highlights: DeniseHighlight[]; fixes: DeniseFix[] }) => {
      // Drop any highlights/fixes that target Denise-approved text still on canvas
      setHighlights(filterAgainstBulletproof(result.highlights));
      setFixes(filterAgainstBulletproof(result.fixes));
      setApplied(false);
      setShowingAfter(false);
      setCheckpoint({});
    },
    [filterAgainstBulletproof],
  );

  const setHighlightsOnly = useCallback(
    (next: DeniseHighlight[]) => {
      setHighlights(filterAgainstBulletproof(next));
    },
    [filterAgainstBulletproof],
  );

  const applySuggestedContents = useCallback(
    (fixList: DeniseFix[]) => {
      startUpdateBatch();
      for (const fix of fixList) {
        const exists = textElements.some((el) => el.id === fix.elementId);
        if (!exists) continue;
        updateElement(fix.elementId, { content: fix.suggestedContent });
      }
      endUpdateBatch();
    },
    [textElements, updateElement, startUpdateBatch, endUpdateBatch],
  );

  const restoreCheckpoint = useCallback(
    (snap: Record<string, string>) => {
      startUpdateBatch();
      for (const [id, content] of Object.entries(snap)) {
        const exists = textElements.some((el) => el.id === id);
        if (!exists) continue;
        updateElement(id, { content });
      }
      endUpdateBatch();
    },
    [textElements, updateElement, startUpdateBatch, endUpdateBatch],
  );

  const applyFixes = useCallback(() => {
    if (!fixes.length) return;

    const snap: Record<string, string> = {};
    const approved: Record<string, string> = { ...bulletproofById };
    for (const fix of fixes) {
      const el = textElements.find((t) => t.id === fix.elementId);
      if (el) snap[fix.elementId] = el.content;
      approved[fix.elementId] = fix.suggestedContent;
    }
    if (!Object.keys(snap).length) return;

    setCheckpoint(snap);
    setBulletproofById(approved);
    applySuggestedContents(fixes);
    setHighlights([]); // Applied text is no longer "weak"
    setApplied(true);
    setShowingAfter(true);
  }, [fixes, textElements, bulletproofById, applySuggestedContents]);

  const toggleBeforeAfter = useCallback(() => {
    if (!applied || !Object.keys(checkpoint).length) return;

    if (showingAfter) {
      restoreCheckpoint(checkpoint);
      setShowingAfter(false);
    } else {
      applySuggestedContents(fixes);
      setShowingAfter(true);
    }
  }, [
    applied,
    checkpoint,
    showingAfter,
    fixes,
    restoreCheckpoint,
    applySuggestedContents,
  ]);

  const abandonFixes = useCallback(() => {
    if (!Object.keys(checkpoint).length) {
      setApplied(false);
      setShowingAfter(false);
      return;
    }
    restoreCheckpoint(checkpoint);
    // Undo approval for abandoned elements
    setBulletproofById((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(checkpoint)) {
        delete next[id];
      }
      return next;
    });
    setApplied(false);
    setShowingAfter(false);
    setCheckpoint({});
  }, [checkpoint, restoreCheckpoint]);

  return (
    <DeniseAnalysisContext.Provider
      value={{
        isScanning,
        isAnalyzing,
        highlights,
        fixes,
        applied,
        showingAfter,
        bulletproofById,
        beginScan,
        completeScan,
        setIsAnalyzing,
        setAnalysisResult,
        setHighlightsOnly,
        applyFixes,
        toggleBeforeAfter,
        abandonFixes,
        clearAnalysis,
      }}
    >
      {children}
    </DeniseAnalysisContext.Provider>
  );
}

export function useDeniseAnalysis() {
  const context = useContext(DeniseAnalysisContext);
  if (context === undefined) {
    throw new Error('useDeniseAnalysis must be used within a DeniseAnalysisProvider');
  }
  return context;
}
