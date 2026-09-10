/**
 * denise.persistence.ts
 *
 * Persists Ask Denise chat threads + analysis UI state across refreshes.
 * Cleared together with canvas state when the user starts from scratch.
 */

const STORAGE_KEY = 'roastmyresume_denise_state';
const VERSION = 1;

export type DeniseChatMode = 'roast' | 'help';
export type DenisePersistedPhase = 'interview' | 'fixes';
export type DenisePersistedSeverity = 'weak' | 'vague' | 'improve';

export interface DeniseChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DenisePersistedHighlight {
  elementId: string;
  quote: string;
  severity: DenisePersistedSeverity;
}

export interface DenisePersistedFix {
  elementId: string;
  suggestedContent: string;
}

export interface DenisePersistedState {
  version: number;
  timestamp: number;
  mode: DeniseChatMode;
  threads: Record<DeniseChatMode, DeniseChatMessage[]>;
  analysis: {
    highlights: DenisePersistedHighlight[];
    fixes: DenisePersistedFix[];
    phase: DenisePersistedPhase;
    applied: boolean;
    showingAfter: boolean;
    checkpoint: Record<string, string>;
    bulletproofById: Record<string, string>;
  };
}

const EMPTY_THREADS: Record<DeniseChatMode, DeniseChatMessage[]> = {
  roast: [],
  help: [],
};

function isChatMessage(value: unknown): value is DeniseChatMessage {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    (row.role === 'user' || row.role === 'assistant') &&
    typeof row.content === 'string'
  );
}

function normalizeThreads(
  value: unknown,
): Record<DeniseChatMode, DeniseChatMessage[]> {
  if (!value || typeof value !== 'object') return { ...EMPTY_THREADS, roast: [], help: [] };
  const row = value as Record<string, unknown>;
  const roast = Array.isArray(row.roast) ? row.roast.filter(isChatMessage) : [];
  const help = Array.isArray(row.help) ? row.help.filter(isChatMessage) : [];
  return { roast, help };
}

function normalizeAnalysis(
  value: unknown,
): DenisePersistedState['analysis'] {
  const empty = {
    highlights: [] as DenisePersistedHighlight[],
    fixes: [] as DenisePersistedFix[],
    phase: 'interview' as DenisePersistedPhase,
    applied: false,
    showingAfter: false,
    checkpoint: {} as Record<string, string>,
    bulletproofById: {} as Record<string, string>,
  };
  if (!value || typeof value !== 'object') return empty;
  const row = value as Record<string, unknown>;

  const highlights: DenisePersistedHighlight[] = [];
  if (Array.isArray(row.highlights)) {
    for (const item of row.highlights) {
      if (!item || typeof item !== 'object') continue;
      const h = item as Record<string, unknown>;
      if (
        typeof h.elementId === 'string' &&
        typeof h.quote === 'string' &&
        (h.severity === 'weak' || h.severity === 'vague' || h.severity === 'improve')
      ) {
        highlights.push({
          elementId: h.elementId,
          quote: h.quote,
          severity: h.severity,
        });
      }
    }
  }

  const fixes: DenisePersistedFix[] = [];
  if (Array.isArray(row.fixes)) {
    for (const item of row.fixes) {
      if (!item || typeof item !== 'object') continue;
      const f = item as Record<string, unknown>;
      if (typeof f.elementId === 'string' && typeof f.suggestedContent === 'string') {
        fixes.push({
          elementId: f.elementId,
          suggestedContent: f.suggestedContent,
        });
      }
    }
  }

  const stringMap = (raw: unknown): Record<string, string> => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v;
    }
    return out;
  };

  return {
    highlights,
    fixes,
    phase: row.phase === 'fixes' ? 'fixes' : 'interview',
    applied: row.applied === true,
    showingAfter: row.showingAfter === true,
    checkpoint: stringMap(row.checkpoint),
    bulletproofById: stringMap(row.bulletproofById),
  };
}

export function saveDeniseState(
  state: Omit<DenisePersistedState, 'version' | 'timestamp'>,
) {
  try {
    const data: DenisePersistedState = {
      version: VERSION,
      timestamp: Date.now(),
      ...state,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save Denise state:', error);
  }
}

export function loadDeniseState(): DenisePersistedState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored) as DenisePersistedState;
    if (data.version !== VERSION) {
      clearDeniseState();
      return null;
    }
    return {
      version: data.version,
      timestamp: data.timestamp,
      mode: data.mode === 'help' ? 'help' : 'roast',
      threads: normalizeThreads(data.threads),
      analysis: normalizeAnalysis(data.analysis),
    };
  } catch (error) {
    console.error('Failed to load Denise state:', error);
    return null;
  }
}

export function clearDeniseState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear Denise state:', error);
  }
}

const EMPTY_ANALYSIS: DenisePersistedState['analysis'] = {
  highlights: [],
  fixes: [],
  phase: 'interview',
  applied: false,
  showingAfter: false,
  checkpoint: {},
  bulletproofById: {},
};

/** Merge-patch so chat and analysis can persist independently. */
export function patchDeniseState(patch: {
  mode?: DeniseChatMode;
  threads?: Record<DeniseChatMode, DeniseChatMessage[]>;
  analysis?: DenisePersistedState['analysis'];
}) {
  const current = loadDeniseState();
  saveDeniseState({
    mode: patch.mode ?? current?.mode ?? 'roast',
    threads: patch.threads ?? current?.threads ?? { roast: [], help: [] },
    analysis: patch.analysis ?? current?.analysis ?? EMPTY_ANALYSIS,
  });
}
