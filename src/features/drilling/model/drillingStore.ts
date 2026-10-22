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
    md: 0,
    mode: 'actual',
    playing: true,
    speedFtPerS: 250,
    feed: [],
    setActiveWell: (name, startMd = 0) => set({ activeWell: name, md: startMd, feed: [], playing: true }),
    setMode: (mode) => set({ mode }),
    setPlaying: (playing) => set({ playing }),
    setSpeed: (speedFtPerS) => set({ speedFtPerS }),
    restart: () => set({ md: 0, feed: [], playing: true }),
    pushFeed: (items) =>
      set((s) => ({
        feed: [...items.map((i) => ({ ...i, id: ++feedId })).reverse(), ...s.feed].slice(0, 4),
      })),
  })),
);
