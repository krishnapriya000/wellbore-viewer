import { describe, expect, it } from 'vitest';
import { checkItem, holeAt, type ConstructionItem } from '@/features/construction';
import { formationAt, FormationSchema, type Formation } from '@/features/geology';

const F = (o: Partial<Formation>): Formation => ({
  id: 'x',
  ref: 'TVD',
  well: 'All',
  from: 0,
  to: 100,
  name: 'n',
  comp: [{ lith: 'shale', pct: 100 }],
  ...o,
});

describe('formationAt', () => {
  const fms = [
    F({ id: 'a', from: 0, to: 1000, name: 'Upper' }),
    F({ id: 'b', ref: 'MD', well: 'L1', from: 500, to: 600, name: 'Streak' }),
  ];
  it('uses the TVD layer by default and the MD override for that well', () => {
    expect(formationAt(fms, 'L1', 400, 400)?.name).toBe('Upper');
    expect(formationAt(fms, 'L1', 550, 550)?.name).toBe('Streak');
    expect(formationAt(fms, 'L2', 550, 550)?.name).toBe('Upper');
    expect(formationAt(fms, 'L1', 2000, 2000)).toBeNull();
  });
  it('rejects compositions that do not total 100%', () => {
    expect(FormationSchema.safeParse(F({ comp: [{ lith: 'shale', pct: 70 }] })).success).toBe(false);
  });
});

describe('construction rules', () => {
  const K = (o: Partial<ConstructionItem>): ConstructionItem => ({
    id: 'k',
    kind: 'hole',
    well: 'All',
    from: 0,
    to: 100,
    size: 8.5,
    note: '',
    ...o,
  });
  const items = [K({ from: 0, to: 2500, size: 17.5 }), K({ well: 'L1', from: 2500, to: 7000, size: 12.25 })];

  it('prefers the well-specific hole section', () => {
    expect(holeAt(items, 'L1', 3000)?.size).toBe(12.25);
    expect(holeAt(items, 'L2', 3000)).toBeNull();
  });
  it('warns when casing will not fit the hole', () => {
    expect(checkItem(items, K({ kind: 'casing', from: 0, to: 7000, size: 13.375 }), 'L1')[0]).toMatch(
      /will not fit/,
    );
    expect(checkItem(items, K({ kind: 'casing', from: 0, to: 7000, size: 9.625 }), 'L1')).toEqual([]);
    expect(checkItem(items, K({ kind: 'casing', from: 0, to: 9000, size: 9.625 }), 'L1')[0]).toMatch(
      /no hole section/,
    );
  });
  it('warns when cement has no matching casing behind it', () => {
    const withCasing = [...items, K({ kind: 'casing', from: 0, to: 7000, size: 9.625 })];
    expect(checkItem(withCasing, K({ kind: 'cement', from: 4500, to: 7000, size: 9.625 }), 'L1')).toEqual([]);
    expect(checkItem(withCasing, K({ kind: 'cement', from: 4500, to: 7000, size: 7 }), 'L1')[0]).toMatch(
      /no 7" casing/,
    );
  });
});
