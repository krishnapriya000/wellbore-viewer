import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface FeedItem {
  id: number;
  kind: 'survey' | 'formation' | 'event' | 'section';
  text: string;
}

interface DrillingState {
  /** Only this wellbore drills; others show their plan (matches the reference viewer). */
  activeWell: string | null;
  /** Bit measured depth, ft. Changes every frame — read with getState() or useThrottledStore, never a plain selector. */
  md: number;
  /** Per-well drilled progress in ft MD, preserving each lateral's position when switching. */
  wellProgress: Record<string, number>;
  mode: 'actual' | 'plan';
  playing: boolean;
  speedFtPerS: number;
  feed: FeedItem[];
  setActiveWell: (name: string, startMd?: number) => void;
  setMode: (mode: 'actual' | 'plan') => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (ftPerS: number) => void;
  restart: () => void;
  pushFeed: (items: Omit<FeedItem, 'id'>[]) => void;
}

let feedId = 0;

export const useDrilling = create<DrillingState>()(
  subscribeWithSelector((set) => ({
    activeWell: null,
    md: 5600,
    wellProgress: { L1: 5600, L2: 0, L3: 0 },
    mode: 'actual',
    playing: true,
    speedFtPerS: 250,
    feed: [],
    setActiveWell: (name, startMd) =>
      set((s) => {
        const progress = { ...s.wellProgress };
        if (s.activeWell) {
          progress[s.activeWell] = s.md;
        }
        const targetMd = startMd !== undefined ? startMd : (progress[name] ?? 0);
        progress[name] = targetMd;
        return {
          activeWell: name,
          md: targetMd,
          wellProgress: progress,
          feed: [],
          playing: startMd !== undefined ? true : s.playing,
        };
      }),
    setMode: (mode) => set({ mode }),
    setPlaying: (playing) => set({ playing }),
    setSpeed: (speedFtPerS) => set({ speedFtPerS }),
    restart: () =>
      set((s) => {
        const progress = { ...s.wellProgress };
        if (s.activeWell) {
          progress[s.activeWell] = 0;
        }
        return { md: 0, wellProgress: progress, feed: [], playing: true };
      }),
    pushFeed: (items) =>
      set((s) => ({
        feed: [...items.map((i) => ({ ...i, id: ++feedId })).reverse(), ...s.feed].slice(0, 4),
      })),
  })),
);
