import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { backendClient, type BackendIncidentFamily } from '@/shared/api/backendClient';
import { useIncidentCategoriesStore } from './incidentCategoriesStore';

describe('incidentCategoriesStore', () => {
  beforeEach(() => {
    useIncidentCategoriesStore.setState({
      families: [],
      isLoading: false,
      error: null,
      expandedFamilyIds: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with an empty list of families', () => {
    const { families, isLoading, error } = useIncidentCategoriesStore.getState();
    expect(families).toEqual([]);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('fetches incident families dynamically from backend API and maps types count', async () => {
    const mockBackendData: BackendIncidentFamily[] = [
      {
        id: 'fam-1',
        name: 'Well Control',
        description: 'Primary and secondary well control incidents',
        typesCount: 2,
        incidentTypes: [
          { id: 't-1', familyId: 'fam-1', name: 'Gas Kick', description: null, createdAt: '2026-11-14', updatedAt: '2026-11-14' },
          { id: 't-2', familyId: 'fam-1', name: 'Loss of Circulation', description: null, createdAt: '2026-11-14', updatedAt: '2026-11-14' },
        ],
        createdAt: '2026-11-14T00:00:00.000Z',
        updatedAt: '2026-11-14T00:00:00.000Z',
      },
      {
        id: 'fam-2',
        name: 'Mechanical / Equipment',
        description: 'Drill string and surface equipment failures',
        typesCount: 1,
        incidentTypes: [
          { id: 't-3', familyId: 'fam-2', name: 'Stuck Pipe', description: null, createdAt: '2026-11-14', updatedAt: '2026-11-14' },
        ],
        createdAt: '2026-11-14T00:00:00.000Z',
        updatedAt: '2026-11-14T00:00:00.000Z',
      },
    ];

    vi.spyOn(backendClient, 'getIncidentFamilies').mockResolvedValueOnce(mockBackendData);

    await useIncidentCategoriesStore.getState().fetchFamilies();

    const state = useIncidentCategoriesStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.families).toHaveLength(2);
    expect(state.families[0]?.name).toBe('Well Control');
    expect(state.families[0]?.typesCount).toBe(2);
    expect(state.families[0]?.incidentTypes).toHaveLength(2);
    expect(state.families[1]?.name).toBe('Mechanical / Equipment');
    expect(state.families[1]?.typesCount).toBe(1);
  });

  it('handles backend network or query error cleanly without throwing', async () => {
    vi.spyOn(backendClient, 'getIncidentFamilies').mockRejectedValueOnce(
      new Error('Failed to connect to PostgreSQL database'),
    );

    await useIncidentCategoriesStore.getState().fetchFamilies();

    const state = useIncidentCategoriesStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Failed to connect to PostgreSQL database');
    expect(state.families).toEqual([]);
  });

  it('supports toggle, expandAll, and collapseAll', () => {
    useIncidentCategoriesStore.setState({
      families: [
        { id: 'fam-1', name: 'F1', typesCount: 0, incidentTypes: [], createdAt: '', updatedAt: '' },
        { id: 'fam-2', name: 'F2', typesCount: 0, incidentTypes: [], createdAt: '', updatedAt: '' },
      ],
      expandedFamilyIds: [],
    });

    useIncidentCategoriesStore.getState().toggleFamilyExpanded('fam-1');
    expect(useIncidentCategoriesStore.getState().expandedFamilyIds).toEqual(['fam-1']);

    useIncidentCategoriesStore.getState().toggleFamilyExpanded('fam-1');
    expect(useIncidentCategoriesStore.getState().expandedFamilyIds).toEqual([]);

    useIncidentCategoriesStore.getState().expandAll();
    expect(useIncidentCategoriesStore.getState().expandedFamilyIds).toEqual(['fam-1', 'fam-2']);

    useIncidentCategoriesStore.getState().collapseAll();
    expect(useIncidentCategoriesStore.getState().expandedFamilyIds).toEqual([]);
  });

  it('selects family, expands it and selects its first incident type by default', () => {
    useIncidentCategoriesStore.setState({
      families: [
        {
          id: 'fam-1',
          name: '1. Well Control',
          typesCount: 1,
          incidentTypes: [
            {
              id: 't-1',
              familyId: 'fam-1',
              name: 'Kick / Influx',
              code: 'DW-WC-01',
              createdAt: '',
              updatedAt: '',
            },
          ],
          createdAt: '',
          updatedAt: '',
        },
      ],
      expandedFamilyIds: [],
      selectedFamilyId: null,
      selectedIncidentCode: null,
    });

    useIncidentCategoriesStore.getState().selectFamily('fam-1');
    const state = useIncidentCategoriesStore.getState();
    expect(state.selectedFamilyId).toBe('fam-1');
    expect(state.expandedFamilyIds).toContain('fam-1');
    expect(state.selectedIncidentCode).toBe('DW-WC-01');
  });

  it('selects incident type and finds its parent family', () => {
    useIncidentCategoriesStore.setState({
      families: [
        {
          id: 'fam-1',
          name: '1. Well Control',
          typesCount: 1,
          incidentTypes: [
            {
              id: 't-1',
              familyId: 'fam-1',
              name: 'Kick / Influx',
              code: 'DW-WC-01',
              createdAt: '',
              updatedAt: '',
            },
          ],
          createdAt: '',
          updatedAt: '',
        },
      ],
      expandedFamilyIds: [],
      selectedFamilyId: null,
      selectedTypeId: null,
    });

    useIncidentCategoriesStore.getState().selectType('t-1', 'DW-WC-01');
    const state = useIncidentCategoriesStore.getState();
    expect(state.selectedTypeId).toBe('t-1');
    expect(state.selectedFamilyId).toBe('fam-1');
    expect(state.selectedIncidentCode).toBe('DW-WC-01');
    expect(state.expandedFamilyIds).toContain('fam-1');
  });

  it('updates filters and resets filters to defaults', () => {
    useIncidentCategoriesStore.getState().setFilter('severity', 'warn');
    expect(useIncidentCategoriesStore.getState().filters.severity).toBe('warn');

    useIncidentCategoriesStore.getState().resetFilters();
    expect(useIncidentCategoriesStore.getState().filters.severity).toBe('all');
  });

  it('acknowledges an incident code', () => {
    useIncidentCategoriesStore.getState().acknowledgeIncident('DW-WC-01');
    expect(useIncidentCategoriesStore.getState().acknowledgedCodes).toContain('DW-WC-01');
  });
});
