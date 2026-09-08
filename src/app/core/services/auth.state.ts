'use client';

import { useSyncExternalStore } from 'react';

export interface AuthUser {
  email: string;
}

const STORAGE_KEY = 'rmr_auth_user';

let currentUser: AuthUser | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

// Hydrate from localStorage in browser environment
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      currentUser = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to parse auth user from localStorage:', e);
  }
}

/**
 * Sets or clears the currently authenticated user and notifies listeners.
 */
export function setAuthUser(user: AuthUser | null): void {
  currentUser = user;
  if (typeof window !== 'undefined') {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to persist auth user to localStorage:', e);
    }
  }
  emitChange();
}

/**
 * Signs out the current user and clears session storage.
 */
export function signOutUser(): void {
  setAuthUser(null);
}

/**
 * React hook to access the current authenticated user.
 * Automatically triggers re-renders on login / logout across components.
 */
export function useAuthUser(): AuthUser | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => currentUser,
    () => null
  );
}
