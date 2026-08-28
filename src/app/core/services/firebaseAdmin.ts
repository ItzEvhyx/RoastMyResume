// src/app/core/services/firebaseAdmin.ts
import {
  getApps,
  initializeApp,
  cert,
  type App,
} from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin SDK service for RoastMyResume (server-side only).
 *
 * The Admin SDK runs exclusively on the server (API routes, server actions,
 * server components). It authenticates with a service account and BYPASSES
 * Firestore Security Rules, so it must NEVER be imported into client code.
 * The runtime guard below throws if this module is ever evaluated in a
 * browser bundle.
 *
 * Credentials are read from environment variables (see .env.local):
 *   - FIREBASE_PROJECT_ID
 *   - FIREBASE_CLIENT_EMAIL
 *   - FIREBASE_PRIVATE_KEY   (PEM string; \n escapes are normalized to real newlines)
 */

// Fail loudly if this server-only module is ever pulled into the browser bundle.
if (typeof window !== 'undefined') {
  throw new Error(
    'firebaseAdmin.ts is server-only and must not be imported into client code.'
  );
}

let adminApp: App | null = null;

/** Lazily initialize a single Firebase Admin app, reusing it across hot reloads. */
function getAdminApp(): App {
  if (adminApp) return adminApp;

  // Reuse an already-initialized app (Next.js dev hot-reload re-runs modules).
  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0];
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin credentials are missing. Set FIREBASE_PROJECT_ID, ' +
        'FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local.'
    );
  }

  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // Env vars store the PEM with literal "\n"; convert back to real newlines.
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });

  return adminApp;
}

let adminDb: Firestore | null = null;

/** Get the Admin Firestore instance (server-side, bypasses security rules). */
export function getAdminFirestore(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp());
  }
  return adminDb;
}
