import { beforeEach, describe, expect, it } from 'vitest';
import {
  INITIAL_CONSTRUCTION_ITEMS,
  useConstructionStore,
} from './constructionStore';

describe('constructionStore', () => {
  beforeEach(() => {
    useConstructionStore.getState().resetToSample();
    useConstructionStore.setState({ version: 0 });
  });

  it('initializes with default sample construction items and version 0', () => {
    const state = useConstructionStore.getState();
    expect(state.items).toHaveLength(INITIAL_CONSTRUCTION_ITEMS.length);
    expect(state.version).toBe(0);
    expect(state.items[0]!.kind).toBe('hole');
    expect(state.items[0]!.size).toBe(17.5);
  });

  it('adds a valid construction item and increments version', () => {
    const result = useConstructionStore.getState().addItem({
      kind: 'hole',
      well: 'L2',
      from: 4500,
      to: 8500,
      size: 8.5,
      note: 'L2 production hole',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.item.id).toBeTruthy();
    expect(result.item.kind).toBe('hole');
    expect(result.item.well).toBe('L2');
    expect(result.item.size).toBe(8.5);

    const state = useConstructionStore.getState();
    expect(state.items).toHaveLength(INITIAL_CONSTRUCTION_ITEMS.length + 1);
    expect(state.version).toBe(1);
    expect(state.items.at(-1)?.id).toBe(result.item.id);
  });

  it('adds an item with an explicit ID', () => {
    const result = useConstructionStore.getState().addItem({
      id: 'custom-csg-99',
      kind: 'casing',
      well: 'L2',
      from: 4000,
      to: 8500,
      size: 7,
      note: 'L2 liner',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.item.id).toBe('custom-csg-99');
    expect(useConstructionStore.getState().items.some((i) => i.id === 'custom-csg-99')).toBe(true);
  });

  it('rejects adding an item with duplicate ID', () => {
    const result = useConstructionStore.getState().addItem({
      id: 'hole-1', // Already in INITIAL_CONSTRUCTION_ITEMS
      kind: 'hole',
      well: 'All',
      from: 0,
      to: 1000,
      size: 17.5,
      note: 'Duplicate',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/already exists/i);
    expect(useConstructionStore.getState().version).toBe(0);
  });

  it('rejects adding an invalid construction item (to <= from, negative from, invalid kind, out-of-range size)', () => {
    // to <= from
    const invertedDepth = useConstructionStore.getState().addItem({
      kind: 'hole',
      well: 'All',
      from: 2000,
      to: 1000,
      size: 12.25,
      note: 'Inverted',
    });
    expect(invertedDepth.ok).toBe(false);
    if (!invertedDepth.ok) {
      expect(invertedDepth.error).toMatch(/to must be deeper than from/i);
    }

    // Negative from
    const negativeFrom = useConstructionStore.getState().addItem({
      kind: 'hole',
      well: 'All',
      from: -100,
      to: 1000,
      size: 12.25,
      note: 'Negative from',
    });
    expect(negativeFrom.ok).toBe(false);

    // Invalid kind
    const badKind = useConstructionStore.getState().addItem({
      kind: 'unknown_kind',
      well: 'All',
      from: 0,
      to: 1000,
      size: 12.25,
      note: '',
    });
    expect(badKind.ok).toBe(false);

    // Size < 1
    const smallSize = useConstructionStore.getState().addItem({
      kind: 'casing',
      well: 'All',
      from: 0,
      to: 1000,
      size: 0.5,
      note: '',
    });
    expect(smallSize.ok).toBe(false);

    // Size > 60
    const largeSize = useConstructionStore.getState().addItem({
      kind: 'casing',
      well: 'All',
      from: 0,
      to: 1000,
      size: 80,
      note: '',
    });
    expect(largeSize.ok).toBe(false);
  });

  it('updates an existing construction item and increments version', () => {
    const updateResult = useConstructionStore.getState().updateItem('csg-2', {
      kind: 'casing',
      well: 'All',
      from: 0,
      to: 4600,
      size: 9.625,
      note: 'Deepened intermediate casing',
    });

    expect(updateResult.ok).toBe(true);
    const updated = useConstructionStore.getState().items.find((i) => i.id === 'csg-2');
    expect(updated?.to).toBe(4600);
    expect(updated?.note).toBe('Deepened intermediate casing');
    expect(useConstructionStore.getState().version).toBe(1);
  });

  it('returns error when updating non-existent item', () => {
    const result = useConstructionStore.getState().updateItem('ghost-id', {
      kind: 'casing',
      well: 'All',
      from: 0,
      to: 1000,
      size: 9.625,
      note: '',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not found/i);
    }
  });

  it('removes an existing construction item and increments version', () => {
    const result = useConstructionStore.getState().removeItem('csg-3');
    expect(result.ok).toBe(true);

    const state = useConstructionStore.getState();
    expect(state.items.some((i) => i.id === 'csg-3')).toBe(false);
    expect(state.items).toHaveLength(INITIAL_CONSTRUCTION_ITEMS.length - 1);
    expect(state.version).toBe(1);
  });

  it('returns error when removing non-existent item', () => {
    const result = useConstructionStore.getState().removeItem('ghost-id');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not found/i);
    }
  });

  it('replaces entire construction item list via setItems', () => {
    const newList = [
      {
        id: 'new-hole-1',
        kind: 'hole' as const,
        well: 'All',
        from: 0,
        to: 3000,
        size: 17.5,
        note: 'Fresh hole',
      },
    ];

    const result = useConstructionStore.getState().setItems(newList);
    expect(result.ok).toBe(true);

    const state = useConstructionStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]!.id).toBe('new-hole-1');
    expect(state.version).toBe(1);
  });

  it('rejects setItems if input is not an array or has invalid items or duplicates', () => {
    // Non-array
    expect(useConstructionStore.getState().setItems({} as unknown[]).ok).toBe(false);

    // Invalid item
    const badItems = [
      {
        id: 'bad-1',
        kind: 'hole',
        well: 'All',
        from: 2000,
        to: 1000, // inverted
        size: 12.25,
        note: '',
      },
    ];
    expect(useConstructionStore.getState().setItems(badItems).ok).toBe(false);

    // Duplicates within batch
    const duplicates = [
      {
        id: 'dup-1',
        kind: 'hole',
        well: 'All',
        from: 0,
        to: 1000,
        size: 12.25,
        note: '',
      },
      {
        id: 'dup-1',
        kind: 'casing',
        well: 'All',
        from: 0,
        to: 1000,
        size: 9.625,
        note: '',
      },
    ];
    const dupResult = useConstructionStore.getState().setItems(duplicates);
    expect(dupResult.ok).toBe(false);
    if (!dupResult.ok) {
      expect(dupResult.error).toMatch(/duplicate construction item id/i);
    }
  });

  it('resets items to sample set via resetToSample', () => {
    useConstructionStore.getState().removeItem('hole-1');
    expect(useConstructionStore.getState().items).toHaveLength(INITIAL_CONSTRUCTION_ITEMS.length - 1);

    useConstructionStore.getState().resetToSample();
    expect(useConstructionStore.getState().items).toHaveLength(INITIAL_CONSTRUCTION_ITEMS.length);
  });

  it('returns engineering fit-check warnings when adding incompatible items', () => {
    // Add 16" casing into 12.25" hole
    const oversizedCasing = useConstructionStore.getState().addItem({
      kind: 'casing',
      well: 'All',
      from: 1200,
      to: 3000,
      size: 16, // In hole-2 (size 12.25)
      note: 'Oversized casing',
    });

    expect(oversizedCasing.ok).toBe(true);
    if (oversizedCasing.ok) {
      expect(oversizedCasing.warnings.length).toBeGreaterThan(0);
      expect(oversizedCasing.warnings[0]).toMatch(/will not fit/i);
    }
  });
});
