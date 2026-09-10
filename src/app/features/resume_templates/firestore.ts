/**
 * Firestore helpers for resume templates.
 * Code seeds remain the source of truth; Firestore holds synced copies.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getClientFirestore } from '@/app/core/services/firebase';
import { materializeSeed } from './build';
import { TEMPLATE_META, TEMPLATE_SEEDS, getLocalSeed } from './seeds';
import type { TemplateCanvasPayload, TemplateSeedElements } from './types';

export const TEMPLATES_COLLECTION = 'templates';

export type FirestoreTemplateDoc = {
  id: string;
  name: string;
  tag: string;
  category: string;
  accent?: string;
  blank?: boolean;
  seed: TemplateSeedElements | null;
  updatedAt?: unknown;
};

/** Resolve a template payload: Firestore first, then local seed. */
export async function resolveTemplatePayload(
  templateId: string,
): Promise<TemplateCanvasPayload | null> {
  if (templateId === 'blank') {
    return {
      textElements: [],
      iconElements: [],
      dividerElements: [],
      penStrokes: [],
      groupElements: [],
    };
  }

  try {
    const db = getClientFirestore();
    const snap = await getDoc(doc(db, TEMPLATES_COLLECTION, templateId));
    if (snap.exists()) {
      const data = snap.data() as FirestoreTemplateDoc;
      if (data.seed) return materializeSeed(data.seed);
    }
  } catch (err) {
    console.warn('[templates] Firestore fetch failed, using local seed:', err);
  }

  const local = getLocalSeed(templateId);
  return local ? materializeSeed(local) : null;
}

/** Upsert every local seed into Firestore (used by /api/templates/seed). */
export async function seedTemplatesToFirestore(): Promise<{
  written: string[];
  errors: { id: string; error: string }[];
}> {
  const db = getClientFirestore();
  const written: string[] = [];
  const errors: { id: string; error: string }[] = [];

  for (const meta of TEMPLATE_META) {
    try {
      const seed = meta.blank ? null : TEMPLATE_SEEDS[meta.id] ?? null;
      const payload = JSON.parse(
        JSON.stringify({
          id: meta.id,
          name: meta.name,
          tag: meta.tag,
          category: meta.category,
          accent: meta.accent ?? null,
          blank: meta.blank ?? false,
          seed,
          updatedAt: null,
        }),
      ) as Record<string, unknown>;
      // serverTimestamp can't survive JSON round-trip
      payload.updatedAt = serverTimestamp();

      await setDoc(doc(db, TEMPLATES_COLLECTION, meta.id), payload, {
        merge: true,
      });
      written.push(meta.id);
    } catch (err) {
      errors.push({
        id: meta.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { written, errors };
}

export async function listFirestoreTemplates(): Promise<FirestoreTemplateDoc[]> {
  const db = getClientFirestore();
  const snap = await getDocs(collection(db, TEMPLATES_COLLECTION));
  return snap.docs.map((d) => d.data() as FirestoreTemplateDoc);
}
