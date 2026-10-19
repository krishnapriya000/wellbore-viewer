/**
 * The drilling clock as pure functions. The 3D layer calls `advance` once per frame;
 * React never sees per-frame values.
 */
export interface ClockState {
  md: number;
  playing: boolean;
  speedFtPerS: number;
}

export function advance(state: ClockState, dtSeconds: number, tdFt: number): ClockState {
  if (!state.playing || tdFt <= 0) return state;
  const dt = Math.min(0.1, Math.max(0, dtSeconds)); // a backgrounded tab must not jump the bit
  const md = Math.min(tdFt, state.md + state.speedFtPerS * dt);
  return { ...state, md, playing: md < tdFt };
}

/** MDs of the items (stations, events, formation tops) the bit passed between two depths. */
export function passedBetween<T>(
  items: readonly T[],
  getMd: (t: T) => number,
  fromMd: number,
  toMd: number,
): T[] {
  return items.filter((t) => getMd(t) > fromMd && getMd(t) <= toMd);
}
