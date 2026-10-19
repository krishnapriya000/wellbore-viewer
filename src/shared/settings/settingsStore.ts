import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DepthUnit } from '@/shared/units/units';

export type ThemePref = 'system' | 'light' | 'dark';

interface SettingsState {
  unit: DepthUnit;
  theme: ThemePref;
  setUnit: (unit: DepthUnit) => void;
  setTheme: (theme: ThemePref) => void;
}

/** Per-viewer preferences. Persisted in localStorage; never holds shared or sensitive data. */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      unit: 'ft',
      theme: 'system',
      setUnit: (unit) => set({ unit }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'wellbore.settings.v1', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
