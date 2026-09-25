'use client';

import { useSyncExternalStore } from 'react';
import type { ExtractedResume } from './types';

/**
 * Import job shared across the templates → canvas route change.
 * The finished result is mirrored to sessionStorage so a remount or reload
 * on /canvas still picks it up instead of spinning forever.
 */
export type ResumeImportState =
  | { status: 'idle' }
  | { status: 'reading'; fileName: string }
  | { status: 'ready'; resume: ExtractedResume }
  | { status: 'error'; error: string };

const PENDING_KEY = 'rmr_import_pending';
const RESULT_KEY = 'rmr_import_result';
const TIMEOUT_MS = 120_000;

const IDLE: ResumeImportState = { status: 'idle' };

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function readInitial(): ResumeImportState {
  const ss = storage();
  if (!ss) return IDLE;
  try {
    const result = ss.getItem(RESULT_KEY);
    if (result) return { status: 'ready', resume: JSON.parse(result) as ExtractedResume };
    if (ss.getItem(PENDING_KEY)) {
      // A reload killed the in-flight request; it can never finish now.
      ss.removeItem(PENDING_KEY);
      return {
        status: 'error',
        error: 'The import was interrupted by a page reload. Please upload your resume again.',
      };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return IDLE;
}

let state: ResumeImportState = readInitial();
let jobId = 0;
const listeners = new Set<() => void>();

function set(next: ResumeImportState) {
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useResumeImportState(): ResumeImportState {
  return useSyncExternalStore(subscribe, () => state, () => IDLE);
}

export function resetResumeImport() {
  jobId++;
  const ss = storage();
  ss?.removeItem(PENDING_KEY);
  ss?.removeItem(RESULT_KEY);
  set(IDLE);
}

export function failResumeImport(error: string) {
  const ss = storage();
  ss?.removeItem(PENDING_KEY);
  ss?.removeItem(RESULT_KEY);
  set({ status: 'error', error });
}

/** Kick off the upload; the canvas overlay consumes the result. */
export function startResumeImport(file: File, email: string) {
  const id = ++jobId;
  const ss = storage();
  ss?.removeItem(RESULT_KEY);
  ss?.setItem(PENDING_KEY, String(Date.now()));
  set({ status: 'reading', fileName: file.name });

  const form = new FormData();
  form.append('file', file);
  form.append('email', email);

  void fetch('/api/resume-import', {
    method: 'POST',
    headers: { 'x-user-email': email },
    body: form,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
    .then(async (res) => {
      const data = (await res.json().catch(() => ({}))) as {
        resume?: ExtractedResume;
        error?: string;
      };
      if (!res.ok || !data.resume) {
        throw new Error(data.error || 'Could not read that PDF. Try another file.');
      }
      if (id !== jobId) return;
      try {
        ss?.setItem(RESULT_KEY, JSON.stringify(data.resume));
      } catch {
        /* quota — in-memory state still works */
      }
      ss?.removeItem(PENDING_KEY);
      set({ status: 'ready', resume: data.resume });
    })
    .catch((err: unknown) => {
      if (id !== jobId) return;
      console.error('[resume-import]', err);
      const timedOut = err instanceof DOMException && err.name === 'TimeoutError';
      failResumeImport(
        timedOut
          ? 'Reading your resume took too long. Please try again.'
          : err instanceof Error
            ? err.message
            : 'Resume import failed.',
      );
    });
}
