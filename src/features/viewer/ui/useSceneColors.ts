import { useSyncExternalStore } from 'react';
import { cssToken } from '../lib/scene';

const read = () => ({
  scene: cssToken('--scene'),
  grid: cssToken('--scene-grid'),
  grid2: cssToken('--scene-grid-2'),
  label: cssToken('--scene-label'),
  actual: cssToken('--actual'),
  wells: [1, 2, 3, 4, 5, 6].map((i) => cssToken(`--w${i}`)),
});

export type SceneColors = ReturnType<typeof read>;

let cache: { key: string; value: SceneColors } | null = null;

function getSnapshot(): SceneColors {
  const value = read();
  const key = JSON.stringify(value);
  if (cache?.key !== key) cache = { key, value }; // same object while tokens are unchanged
  return cache.value;
}

/** Fires when the OS colour scheme or the app's data-theme attribute changes. */
function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', onChange);
  const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(onChange) : null;
  mo?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => {
    mq.removeEventListener('change', onChange);
    mo?.disconnect();
  };
}

/** Scene colours from the same CSS tokens as the page, so light/dark applies to the 3D view too. */
export function useSceneColors(): SceneColors {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
