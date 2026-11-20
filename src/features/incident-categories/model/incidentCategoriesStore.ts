import { create } from 'zustand';
import { backendClient, type BackendIncidentFamily, type BackendIncidentType } from '@/shared/api/backendClient';
import { DEFAULT_FAMILIES, isActiveState } from './defaultTaxonomy';
import type {
  IncidentFamilyItem,
  IncidentFilters,
  IncidentRecord,
  IncidentSeverity,
  IncidentTypeItem,
} from './types';

export interface IncidentCategoriesState {
  families: IncidentFamilyItem[];
  isLoading: boolean;
  error: string | null;
  expandedFamilyIds: string[];
  selectedFamilyId: string | null;
  selectedTypeId: string | null;
  selectedIncidentCode: string | null;
  acknowledgedCodes: string[];
  filters: IncidentFilters;

  fetchFamilies: () => Promise<IncidentFamilyItem[]>;
  toggleFamilyExpanded: (familyId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setFamilies: (families: IncidentFamilyItem[]) => void;
  selectFamily: (familyId: string) => void;
  selectType: (typeId: string | null, code?: string) => void;
  selectIncident: (codeOrKey: string | null) => void;
  setFilter: (key: keyof IncidentFilters, value: string) => void;
  resetFilters: () => void;
  acknowledgeIncident: (code: string) => void;
}

const DEFAULT_FILTERS: IncidentFilters = {
  severity: 'all',
  status: 'all',
  confidence: 'all',
  section: '8½" production hole',
  formation: 'Interbedded shale / sand',
  activity: 'Rotary drilling',
  timeRange: 'Last 24 hours',
  dataQuality: 'Any',
  environment: 'Offshore',
  wellType: 'Horizontal',
};

// Quick lookup from DEFAULT_FAMILIES for quick hydration
const fallbackRecordMap = new Map<string, IncidentRecord>();
const fallbackFamilyMap = new Map<string, IncidentFamilyItem>();
for (const f of DEFAULT_FAMILIES) {
  fallbackFamilyMap.set(f.id, f);
  fallbackFamilyMap.set(f.name.toLowerCase(), f);
  for (const t of f.incidentTypes) {
    if (t.record) {
      fallbackRecordMap.set(t.name.toLowerCase(), t.record);
      fallbackRecordMap.set(t.id.toLowerCase(), t.record);
      if (t.code) fallbackRecordMap.set(t.code.toLowerCase(), t.record);
    }
  }
}

function parseRecordFromType(
  bt: BackendIncidentType,
  familySlug: string,
  _familyNo: number,
  index: number,
): { code: string; record: IncidentRecord } {
  const code = `DW-${familySlug.toUpperCase()}-${String(index + 1).padStart(2, '0')}`;

  // Try parsing description as JSON metadata
  if (bt.description && bt.description.startsWith('{')) {
    try {
      const parsed = JSON.parse(bt.description) as Partial<IncidentRecord>;
      const state = parsed.state || 'Monitoring';
      const active = isActiveState(state);
      return {
        code: parsed.code || code,
        record: {
          id: bt.id,
          familyId: bt.familyId,
          code: parsed.code || code,
          name: bt.name,
          state,
          severity: (parsed.severity as IncidentSeverity) || 'info',
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
          evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [bt.description],
          causes: Array.isArray(parsed.causes) ? parsed.causes : [],
          recommendedAction: parsed.recommendedAction || 'Monitor wellbore parameters.',
          constraints: parsed.constraints || 'Standard operational limits apply.',
          escalation: parsed.escalation || 'Notify supervisor if readings deviate.',
          sop: parsed.sop || `SOP-${familySlug.toUpperCase()}-${String(index + 1).padStart(2, '0')}`,
          owner: parsed.owner || 'Supervisor',
          status: parsed.status || (active ? 'Open' : 'Resolved'),
        },
      };
    } catch {
      // Fall through to fallback map
    }
  }

  // Check fallback mapping by name
  const fallback = fallbackRecordMap.get(bt.name.toLowerCase());
  if (fallback) {
    return {
      code: fallback.code || code,
      record: {
        ...fallback,
        id: bt.id,
        familyId: bt.familyId,
      },
    };
  }

  // Default synthetic record
  return {
    code,
    record: {
      id: bt.id,
      familyId: bt.familyId,
      code,
      name: bt.name,
      state: 'Monitoring',
      severity: 'info',
      confidence: 0.65,
      evidence: [bt.description || 'Continuous monitoring active.'],
      causes: [{ t: 'Wellbore parameter fluctuation', p: 0.5 }],
      recommendedAction: 'Continue observation according to drilling program.',
      constraints: 'Follow established drilling envelope.',
      escalation: 'Report sustained anomalies to Drilling Superintendent.',
      sop: `DW-${familySlug.toUpperCase()}-${String(index + 1).padStart(2, '0')} Standard Advisory`,
      owner: 'Supervisor',
      status: 'Open',
    },
  };
}

function mapBackendFamily(bf: BackendIncidentFamily, index: number): IncidentFamilyItem {
  // Extract number from name if available (e.g. "1. Well-control")
  const match = bf.name.match(/^(\d+)\.\s*(.*)$/);
  const no = match ? parseInt(match[1] ?? '0', 10) : index + 1;

  // Find fallback slug if possible
  const fallbackFam = fallbackFamilyMap.get(bf.name.toLowerCase()) || DEFAULT_FAMILIES[index];
  const slug = fallbackFam?.slug || `f${no}`;

  const types: IncidentTypeItem[] = (bf.incidentTypes ?? []).map((t, tIdx) => {
    const { code, record } = parseRecordFromType(t, slug, no, tIdx);
    return {
      id: t.id,
      familyId: t.familyId,
      name: t.name,
      code,
      description: t.description ?? undefined,
      record,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  });

  const activeCount = types.filter((i) => i.record && isActiveState(i.record.state)).length;
  const criticalCount = types.filter((i) => i.record?.severity === 'crit' && isActiveState(i.record.state)).length;
  const warningCount = types.filter((i) => i.record?.severity === 'warn' && isActiveState(i.record.state)).length;
  const advisoryCount = types.filter((i) => i.record?.severity === 'adv' && isActiveState(i.record.state)).length;

  return {
    id: bf.id,
    no,
    slug,
    name: bf.name,
    description: bf.description ?? undefined,
    typesCount: bf.typesCount ?? types.length,
    activeCount,
    criticalCount,
    warningCount,
    advisoryCount,
    incidentTypes: types,
    createdAt: bf.createdAt,
    updatedAt: bf.updatedAt,
  };
}

export const useIncidentCategoriesStore = create<IncidentCategoriesState>()((set, get) => ({
  families: DEFAULT_FAMILIES,
  isLoading: false,
  error: null,
  expandedFamilyIds: [DEFAULT_FAMILIES[0]?.id || 'wc'],
  selectedFamilyId: DEFAULT_FAMILIES[0]?.id || 'wc',
  selectedTypeId: null,
  selectedIncidentCode: DEFAULT_FAMILIES[0]?.incidentTypes[0]?.code || 'DW-WC-01',
  acknowledgedCodes: [],
  filters: { ...DEFAULT_FILTERS },

  async fetchFamilies() {
    set({ isLoading: true, error: null });
    try {
      const data = await backendClient.getIncidentFamilies();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((bf, idx) => mapBackendFamily(bf, idx));
        // Sort in natural sequential order
        mapped.sort((a, b) => (a.no ?? 0) - (b.no ?? 0));
        set((state) => ({
          families: mapped,
          isLoading: false,
          selectedFamilyId: state.selectedFamilyId || mapped[0]?.id || null,
        }));
        return mapped;
      }
      set({ isLoading: false });
      return get().families;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Could not fetch incident categories from backend:', err);
      set({ error: errorMsg, isLoading: false });
      return get().families;
    }
  },

  toggleFamilyExpanded(familyId) {
    set((state) => {
      const exists = state.expandedFamilyIds.includes(familyId);
      return {
        expandedFamilyIds: exists
          ? state.expandedFamilyIds.filter((id) => id !== familyId)
          : [...state.expandedFamilyIds, familyId],
      };
    });
  },

  expandAll() {
    set((state) => ({
      expandedFamilyIds: state.families.map((f) => f.id),
    }));
  },

  collapseAll() {
    set({ expandedFamilyIds: [] });
  },

  setFamilies(families) {
    set({ families, error: null });
  },

  selectFamily(familyId) {
    set((state) => {
      const fam = state.families.find((f) => f.id === familyId);
      const firstType = fam?.incidentTypes[0];
      return {
        selectedFamilyId: familyId,
        selectedTypeId: null,
        selectedIncidentCode: firstType?.code || null,
        expandedFamilyIds: state.expandedFamilyIds.includes(familyId)
          ? state.expandedFamilyIds
          : [...state.expandedFamilyIds, familyId],
      };
    });
  },

  selectType(typeId, code) {
    set((state) => {
      if (!typeId) {
        return { selectedTypeId: null };
      }
      // Locate family that owns this type
      let foundFamilyId = state.selectedFamilyId;
      let incidentCode = code || null;

      for (const f of state.families) {
        const found = f.incidentTypes.find((t) => t.id === typeId || t.code === code);
        if (found) {
          foundFamilyId = f.id;
          incidentCode = found.code || incidentCode;
          break;
        }
      }

      return {
        selectedTypeId: typeId,
        selectedFamilyId: foundFamilyId,
        selectedIncidentCode: incidentCode,
        expandedFamilyIds:
          foundFamilyId && !state.expandedFamilyIds.includes(foundFamilyId)
            ? [...state.expandedFamilyIds, foundFamilyId]
            : state.expandedFamilyIds,
      };
    });
  },

  selectIncident(codeOrKey) {
    if (!codeOrKey) return;
    const target = codeOrKey.toLowerCase();
    const families = get().families;

    for (const f of families) {
      const matchedType = f.incidentTypes.find(
        (t) =>
          t.code?.toLowerCase() === target ||
          t.id.toLowerCase() === target ||
          t.name.toLowerCase() === target,
      );
      if (matchedType) {
        get().selectType(matchedType.id, matchedType.code);
        return;
      }
    }
  },

  setFilter(key, value) {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    }));
  },

  resetFilters() {
    set({ filters: { ...DEFAULT_FILTERS } });
  },

  acknowledgeIncident(code) {
    set((state) => ({
      acknowledgedCodes: state.acknowledgedCodes.includes(code)
        ? state.acknowledgedCodes
        : [...state.acknowledgedCodes, code],
    }));
  },
}));
