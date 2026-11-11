import { FormationSchema, type Formation } from '../model/types';

export const GEOLOGY_STORAGE_KEY = 'wellbore_geology_v3';

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
    // Purge older legacy keys
    window.localStorage.removeItem('wellbore_geology_v1');
    window.localStorage.removeItem('wellbore_geology_v2');

    const raw = window.localStorage.getItem(GEOLOGY_STORAGE_KEY);
    if (!raw) return [...fallback];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...fallback];
    }

    // Check if the persisted data contains obsolete names like 'Overburden'
    if (parsed.some((p: unknown) => {
      if (typeof p === 'object' && p !== null) {
        const item = p as Record<string, unknown>;
        return item['name'] === 'Overburden' || item['name'] === 'Target Sand';
      }
      return false;
    })) {
      window.localStorage.removeItem(GEOLOGY_STORAGE_KEY);
      return [...fallback];
    }

    const validated: Formation[] = [];
    const seenIds = new Set<string>();
    for (const item of parsed) {
      if (typeof item === 'object' && item !== null) {
        const itemObj = item as Record<string, unknown>;
        if (itemObj['id'] === 'temp-id' || !itemObj['id'] || seenIds.has(String(itemObj['id']))) {
          itemObj['id'] = 'u' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
        }
      }
      const res = FormationSchema.safeParse(item);
      if (res.success) {
        seenIds.add(res.data.id);
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
