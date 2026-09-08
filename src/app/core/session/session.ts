'use client';

import { useSyncExternalStore } from 'react';

export interface SessionUser {
  email: string;
  name?: string;
  signedInAt?: number;
}

const SESSION_STORAGE_KEY = 'rmr_auth_session';

let inMemorySession: SessionUser | null = null;
let isHydrated = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/**
 * Reads the session from localStorage in the browser.
 */
function readStorageSession(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch (err) {
    console.warn('[Session] Failed to parse session from storage:', err);
    return null;
  }
}

/**
 * Writes the session to localStorage in the browser.
 */
function writeStorageSession(session: SessionUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      // Optional cookie sync for server/middleware compatibility
      document.cookie = `${SESSION_STORAGE_KEY}=${encodeURIComponent(
        JSON.stringify(session)
      )}; path=/; max-age=2592000; SameSite=Lax`;
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      document.cookie = `${SESSION_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax`;
    }
  } catch (err) {
    console.warn('[Session] Failed to write session to storage:', err);
  }
}

/**
 * Initializes session hydration and registers cross-tab storage sync.
 */
function ensureHydration() {
  if (typeof window === 'undefined' || isHydrated) return;
  inMemorySession = readStorageSession();
  isHydrated = true;

  // Listen for storage events from other browser tabs/windows
  window.addEventListener('storage', (event) => {
    if (event.key === SESSION_STORAGE_KEY) {
      inMemorySession = readStorageSession();
      notify();
    }
  });
}

// Trigger initial hydration on module evaluation in browser
if (typeof window !== 'undefined') {
  ensureHydration();
}

/**
 * Retrieves the currently persisted user session synchronously.
 */
export function getSession(): SessionUser | null {
  ensureHydration();
  return inMemorySession;
}

/**
 * Saves a user session to persistent storage (retained across page reloads and browser restarts).
 */
export function setSession(user: SessionUser | { email: string } | null): void {
  ensureHydration();
  if (user) {
    inMemorySession = {
      signedInAt: Date.now(),
      ...user,
      email: user.email.trim().toLowerCase(),
    };
  } else {
    inMemorySession = null;
  }
  writeStorageSession(inMemorySession);
  notify();
}

/**
 * Clears the session from storage and signs out the user.
 */
export function clearSession(): void {
  setSession(null);
}

// Aliases for seamless drop-in compatibility across the codebase
export const setAuthUser = setSession;
export const signOutUser = clearSession;

/**
 * React hook to access the current session user.
 * Guarantees persistence across reloads and syncs across all tabs and components.
 */
export function useSession(): {
  user: SessionUser | null;
  isAuthenticated: boolean;
  signIn: (email: string) => void;
  signOut: () => void;
} {
  const user = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => {
      ensureHydration();
      return inMemorySession;
    },
    () => null
  );

  return {
    user,
    isAuthenticated: !!user,
    signIn: (email: string) => setSession({ email }),
    signOut: clearSession,
  };
}

/**
 * Simple hook alias returning the authenticated user object or null.
 */
export function useAuthUser(): SessionUser | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => {
      ensureHydration();
      return inMemorySession;
    },
    () => null
  );
}
