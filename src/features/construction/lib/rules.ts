import type { ConstructionItem } from '../model/types';

export const itemsFor = (items: readonly ConstructionItem[], well: string) =>
  items.filter((k) => k.well === 'All' || k.well === well);

/** Hole section at an MD; a well-specific section wins over a shared one. */
export function holeAt(
  items: readonly ConstructionItem[],
  well: string,
  md: number,
): ConstructionItem | null {
  let hit: ConstructionItem | null = null;
  for (const k of itemsFor(items, well)) {
    if (k.kind === 'hole' && md >= k.from && md < k.to && (!hit || k.well !== 'All')) hit = k;
  }
  return hit;
}

/** Engineering sanity checks. They warn; they never block the user's entry. */
export function checkItem(
  items: readonly ConstructionItem[],
  item: ConstructionItem,
  well: string,
): string[] {
  const warns: string[] = [];
  if (item.kind === 'casing') {
    const h = holeAt(items, well, item.to - 0.5);
    if (!h) warns.push('no hole section covers the shoe depth');
    else if (item.size >= h.size) warns.push(`${item.size}" casing will not fit a ${h.size}" hole`);
  }
  if (item.kind === 'cement') {
    const covered = itemsFor(items, well).some(
      (k) =>
        k.kind === 'casing' &&
        Math.abs(k.size - item.size) < 0.01 &&
        k.from <= item.from + 0.5 &&
        k.to >= item.to - 0.5,
    );
    if (!covered) warns.push(`no ${item.size}" casing spans this interval`);
  }
  return warns;
}
