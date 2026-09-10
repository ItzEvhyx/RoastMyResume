'use client';

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  deleteUser,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getClientAuth, getClientFirestore } from '@/app/core/services/firebase';
import { setAuthUser } from '@/app/core/session/session';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export class GoogleAuthNeedsSignUpError extends Error {
  constructor() {
    super('User does not have an account. Please sign-up first');
    this.name = 'GoogleAuthNeedsSignUpError';
  }
}

async function revokeOrphanGoogleUser(user: User): Promise<void> {
  try {
    await deleteUser(user);
  } catch (err) {
    console.warn('[Google Auth] Failed to delete orphan Auth user:', err);
    try {
      await signOut(getClientAuth());
    } catch {
      // ignore
    }
  }
}

/**
 * Sign in with Google. Requires an existing Firestore `users/{email}` doc
 * (created via email+OTP or Google sign-up). If missing, closes the Google
 * popup session, removes the orphan Auth user, and throws.
 */
export async function signInWithGoogle(): Promise<{ email: string }> {
  const auth = getClientAuth();
  const result = await signInWithPopup(auth, googleProvider);
  const email = result.user.email?.trim().toLowerCase();

  if (!email) {
    await revokeOrphanGoogleUser(result.user);
    throw new Error('Google account did not return an email.');
  }

  const db = getClientFirestore();
  const userSnap = await getDoc(doc(db, 'users', email));

  if (!userSnap.exists()) {
    await revokeOrphanGoogleUser(result.user);
    throw new GoogleAuthNeedsSignUpError();
  }

  setAuthUser({
    email,
    name: result.user.displayName ?? undefined,
  });

  return { email };
}

/**
 * Sign up with Google — creates Auth user + Firestore profile, skips OTP.
 * Does NOT start an app session; caller should send the user to sign-in.
 */
export async function signUpWithGoogle(): Promise<{ email: string }> {
  const auth = getClientAuth();
  const result = await signInWithPopup(auth, googleProvider);
  const email = result.user.email?.trim().toLowerCase();

  if (!email) {
    await revokeOrphanGoogleUser(result.user);
    throw new Error('Google account did not return an email.');
  }

  const db = getClientFirestore();
  const userRef = doc(db, 'users', email);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    await signOut(auth);
    throw new Error('Account already exists. Please sign in instead.');
  }

  await setDoc(
    userRef,
    {
      email,
      verified: true,
      verifiedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      provider: 'google',
      authUid: result.user.uid,
      displayName: result.user.displayName ?? null,
      photoURL: result.user.photoURL ?? null,
    },
    { merge: true },
  );

  // Keep Firebase Auth signed out until the user explicitly signs in.
  await signOut(auth);

  return { email };
}

export function isGooglePopupCancelled(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = 'code' in err ? String((err as { code?: string }).code) : '';
  return (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    code === 'auth/popup-blocked'
  );
}
