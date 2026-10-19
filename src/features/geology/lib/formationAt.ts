import type { Formation } from '../model/types';

/** Formation at a point on a wellbore: an MD override for that well wins over the TVD layer. */
export function formationAt(
  formations: readonly Formation[],
  well: string,
  md: number,
  tvd: number,
): Formation | null {
  let hit: Formation | null = null;
  for (const f of formations) if (f.ref === 'MD' && f.well === well && md >= f.from && md < f.to) hit = f;
  if (hit) return hit;
  for (const f of formations) if (f.ref === 'TVD' && tvd >= f.from && tvd < f.to) hit = f;
  return hit;
}
