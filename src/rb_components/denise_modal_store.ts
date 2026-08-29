'use client';

import { useSyncExternalStore } from 'react';

/**
 * Tiny cross-tree store for the "Denise HR intro" modal.
 *
 * The landing page renders two isolated trees (desktop / mobile) and the
 * "Get started" buttons live in different sections. Rather than thread props
 * through both trees, the buttons call `openDeniseModal()` and a single
 * <DeniseModal /> instance mounted at the page level subscribes to this store.
 * Mirrors the module-level coordinator pattern used by section_scroll.ts.
 */

let open = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function openDeniseModal(): void {
  if (open) return;
  open = true;
  emit();
}

export function closeDeniseModal(): void {
  if (!open) return;
  open = false;
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  return open;
}

/** Server render has no modal open, so the snapshot is always false. */
function getServerSnapshot(): boolean {
  return false;
}

/** Subscribe a component to the modal's open state. */
export function useDeniseModalOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
