import { useEffect, useRef, useState } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';

/**
 * Reads a fast-changing store value at most every `intervalMs`.
 * Use it for panels that show live drilling numbers: the 3D scene reads the store
 * every frame, the side panel refreshes ~5 times a second.
 */
export function useThrottledStore<S, T>(
  store: UseBoundStore<StoreApi<S>>,
  selector: (state: S) => T,
  intervalMs = 200,
): T {
  const selectorRef = useRef(selector);
  useEffect(() => {
    selectorRef.current = selector;
  });
  const [value, setValue] = useState(() => selector(store.getState()));

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = selectorRef.current(store.getState());
      setValue((prev) => (Object.is(prev, next) ? prev : next));
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [store, intervalMs]);

  return value;
}
