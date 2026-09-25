import {
  saveCanvasState,
  clearCanvasState,
  type CanvasState,
} from '@/app/features/canvas_page/services/canvas.persistence';
import { clearDeniseState } from '@/app/features/canvas_page/services/denise.persistence';
import {
  emptyCanvasPayload,
  materializeSeed,
} from './build';
import { getLocalSeed } from './seeds';
import type { TemplateCanvasPayload } from './types';

const ACTIVE_TEMPLATE_KEY = 'roastmyresume_active_template';

export function setActiveTemplateId(id: string | null) {
  try {
    if (!id) localStorage.removeItem(ACTIVE_TEMPLATE_KEY);
    else localStorage.setItem(ACTIVE_TEMPLATE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function getActiveTemplateId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_TEMPLATE_KEY);
  } catch {
    return null;
  }
}

/** Build a user-owned canvas copy from a local seed (never mutates the seed). */
export function buildTemplateCanvasState(
  templateId: string,
): TemplateCanvasPayload | null {
  if (templateId === 'blank') return emptyCanvasPayload();
  const seed = getLocalSeed(templateId);
  if (!seed) return null;
  return materializeSeed(seed);
}

/**
 * Overwrite local canvas with a fresh template copy and reset Denise chat.
 * Call before navigating to /canvas or when swapping layouts in-place.
 */
export function applyTemplateToStorage(templateId: string): boolean {
  clearDeniseState();

  if (templateId === 'blank') {
    clearCanvasState();
    setActiveTemplateId('blank');
    return true;
  }

  const payload = buildTemplateCanvasState(templateId);
  if (!payload) return false;

  saveCanvasState(payload);
  setActiveTemplateId(templateId);
  return true;
}

/** Start the canvas blank for an incoming resume import and reset Denise chat. */
export function resetForImport() {
  clearDeniseState();
  clearCanvasState();
  setActiveTemplateId('imported');
}

export function canvasStateFromPayload(
  payload: TemplateCanvasPayload,
): Omit<CanvasState, 'version' | 'timestamp'> {
  return payload;
}
