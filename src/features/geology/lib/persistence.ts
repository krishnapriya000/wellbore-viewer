import { FormationSchema, type Formation } from '../model/types';

export const GEOLOGY_STORAGE_KEY = 'wellbore_geology_v1';

/**
 * Loads persisted geological formations from localStorage.
 * Safely parses JSON and validates against FormationSchema.
 * If storage is empty, corrupted, or invalid, returns the fallback array.
 */
export function loadPersistedFormations(fallback: readonly Formation[]): Formation[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [...fallback];
  }

  try {
    const raw = window.localStorage.getItem(GEOLOGY_STORAGE_KEY);
    if (!raw) return [...fallback];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...fallback];
    }

    const validated: Formation[] = [];
    for (const item of parsed) {
      const res = FormationSchema.safeParse(item);
      if (res.success) {
        validated.push(res.data);
      }
    }

    return validated.length > 0 ? validated : [...fallback];
  } catch {
    return [...fallback];
  }
}

/**
 * Persists an array of formations into localStorage.
 * Silently catches quota/security exceptions.
 */
export function persistFormations(formations: readonly Formation[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(GEOLOGY_STORAGE_KEY, JSON.stringify(formations));
  } catch {
    // Quota exceeded or private browsing mode
  }
}

/**
 * Clears persisted formations from localStorage.
 */
export function clearPersistedFormations(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(GEOLOGY_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
