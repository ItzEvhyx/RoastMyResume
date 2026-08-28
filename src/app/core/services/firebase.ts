// src/app/core/services/firebase.ts
import { getApps, getApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase client SDK service for RoastMyResume (browser-safe).
 *
 * The client SDK runs in the browser and is governed by Firestore Security
 * Rules. Its config values are public by design (they identify the project,
 * they are not secrets) and are exposed via NEXT_PUBLIC_* env vars so they can
 * be inlined into the browser bundle.
 *
 * For trusted server-side writes/reads that must bypass rules, use the Admin
 * SDK in `firebaseAdmin.ts` instead.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Initialize (or reuse) the single client Firebase app. */
function getClientApp(): FirebaseApp {
  if (!firebaseConfig.projectId) {
    throw new Error(
      'Firebase client config is missing. Set the NEXT_PUBLIC_FIREBASE_* ' +
        'variables in .env.local.'
    );
  }
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

let clientDb: Firestore | null = null;

/** Get the client Firestore instance (browser-side, governed by security rules). */
export function getClientFirestore(): Firestore {
  if (!clientDb) {
    clientDb = getFirestore(getClientApp());
  }
  return clientDb;
}
