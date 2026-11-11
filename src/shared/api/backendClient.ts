/**
 * Typed client for communicating with the Wellbore Viewer Express + PostgreSQL backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok || data.success === false) {
    const errorMsg = data?.message || `Request to ${path} failed with HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  return data.data as T;
}

export interface BackendWell {
  id: string;
  name: string;
  wellCode: string | null;
  fieldName: string | null;
  location: string | null;
  description: string | null;
  datumElevation?: number | null;
  kbElevation?: number | null;
  createdAt: string;
  updatedAt: string;
  laterals: {
    id: string;
    wellId: string;
    code: string;
    name: string | null;
    type: 'MAIN' | 'BRANCH';
    kickoffMd: number | null;
  }[];
}

export interface BackendLateralWithSurveys {
  id: string;
  wellId: string;
  code: string;
  name: string | null;
  type: 'MAIN' | 'BRANCH';
  surveys: {
    id: string;
    lateralId: string;
    type: 'PLAN' | 'ACTUAL';
    name: string | null;
    sourceFile: string | null;
    isActive: boolean;
    stations: {
      id: string;
      measuredDepth: number;
      inclination: number;
      azimuth: number;
      northing: number | null;
      easting: number | null;
      tvd: number | null;
      doglegSeverity: number | null;
    }[];
  }[];
}

export interface BackendFormation {
  id: string;
  wellId: string;
  lateralId: string | null;
  name: string;
  ref: 'TVD' | 'MD';
  topMd: number;
  baseMd: number;
  color: string | null;
  description: string | null;
  lateral?: { id: string; code: string } | null;
  lithologies: {
    id: string;
    formationId: string | null;
    name: string;
    topMd: number;
    baseMd: number;
    percentage: number | null;
    color: string | null;
    description: string | null;
  }[];
}

export interface BackendEvent {
  id: string;
  wellId: string;
  lateralId: string | null;
  eventName: string;
  eventType: string;
  measuredDepth: number | null;
  eventDate: string | null;
  description: string | null;
  lateral?: { id: string; code: string } | null;
}

export interface BackendConstructionItem {
  id: string;
  kind: 'hole' | 'casing' | 'cement';
  well: string;
  from: number;
  to: number;
  size: number;
  note: string | null;
}

export const backendClient = {
  // --- Health & Connection ---
  checkHealth: () => request<{ success: boolean; message: string }>('/api/health'),
  checkDb: () => request<{ success: boolean; message: string }>('/api/db-check'),

  // --- Wells ---
  getWells: () => request<BackendWell[]>('/api/wells'),
  getWell: (wellId: string) => request<BackendWell>(`/api/wells/${wellId}`),
  createWell: (data: { name: string; wellCode?: string; fieldName?: string; location?: string; description?: string }) =>
    request<BackendWell>('/api/wells', { method: 'POST', body: JSON.stringify(data) }),
  updateWell: (wellId: string, data: Partial<BackendWell>) =>
    request<BackendWell>(`/api/wells/${wellId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWell: (wellId: string) =>
    request<void>(`/api/wells/${wellId}`, { method: 'DELETE' }),

  // --- Laterals ---
  getLaterals: (wellId: string) => request<BackendWell['laterals']>(`/api/wells/${wellId}/laterals`),
  createLateral: (wellId: string, data: { code: string; name?: string; type?: 'MAIN' | 'BRANCH'; kickoffMd?: number }) =>
    request<BackendWell['laterals'][number]>(`/api/wells/${wellId}/laterals`, { method: 'POST', body: JSON.stringify(data) }),

  // --- Surveys ---
  getSurveys: (wellId: string) => request<BackendLateralWithSurveys[]>(`/api/wells/${wellId}/surveys`),
  uploadSurveys: (
    wellId: string,
    data: {
      type: 'PLAN' | 'ACTUAL';
      sourceFile?: string;
      surveys: Record<string, { md: number; inc: number; azi: number; n?: number; e?: number; tvd?: number; dls?: number }[]>;
    },
  ) => request<unknown>(`/api/wells/${wellId}/surveys/upload`, { method: 'POST', body: JSON.stringify(data) }),
  addLiveSurvey: (
    wellId: string,
    data: {
      lateralCode: string;
      measuredDepth: number;
      inclination: number;
      azimuth: number;
      northing?: number;
      easting?: number;
      tvd?: number;
      doglegSeverity?: number;
    },
  ) => request<unknown>(`/api/wells/${wellId}/surveys/live`, { method: 'POST', body: JSON.stringify(data) }),

  // --- Formations & Lithology ---
  getFormations: (wellId: string) => request<BackendFormation[]>(`/api/wells/${wellId}/formations`),
  createFormation: (
    wellId: string,
    data: {
      name: string;
      ref: 'TVD' | 'MD';
      well?: string;
      from: number;
      to: number;
      color?: string;
      description?: string;
      comp: { lith: string; pct: number }[];
    },
  ) => request<BackendFormation>(`/api/wells/${wellId}/formations`, { method: 'POST', body: JSON.stringify(data) }),
  updateFormation: (
    wellId: string,
    formationId: string,
    data: {
      name?: string;
      ref?: 'TVD' | 'MD';
      well?: string;
      from?: number;
      to?: number;
      color?: string;
      description?: string;
      comp?: { lith: string; pct: number }[];
    },
  ) => request<BackendFormation>(`/api/wells/${wellId}/formations/${formationId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFormation: (wellId: string, formationId: string) =>
    request<void>(`/api/wells/${wellId}/formations/${formationId}`, { method: 'DELETE' }),
  batchSaveFormations: (
    wellId: string,
    formations: {
      name: string;
      ref: 'TVD' | 'MD';
      well: string;
      from: number;
      to: number;
      color?: string;
      comp: { lith: string; pct: number }[];
    }[],
  ) => request<BackendFormation[]>(`/api/wells/${wellId}/formations/batch`, { method: 'POST', body: JSON.stringify({ formations }) }),

  // --- Engineering Events ---
  getEngineeringEvents: (wellId: string, lateralCode?: string) => {
    const q = lateralCode && lateralCode !== 'All' ? `?lateralCode=${encodeURIComponent(lateralCode)}` : '';
    return request<BackendEvent[]>(`/api/wells/${wellId}/engineering-events${q}`);
  },
  createEngineeringEvent: (
    wellId: string,
    data: {
      eventName?: string;
      eventType: string;
      measuredDepth: number;
      eventDate?: string;
      description?: string;
      lateralCode?: string;
    },
  ) => request<BackendEvent>(`/api/wells/${wellId}/engineering-events`, { method: 'POST', body: JSON.stringify(data) }),
  updateEngineeringEvent: (
    wellId: string,
    eventId: string,
    data: {
      eventName?: string;
      eventType?: string;
      measuredDepth?: number;
      eventDate?: string;
      description?: string;
      lateralCode?: string;
    },
  ) => request<BackendEvent>(`/api/wells/${wellId}/engineering-events/${eventId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEngineeringEvent: (wellId: string, eventId: string) =>
    request<void>(`/api/wells/${wellId}/engineering-events/${eventId}`, { method: 'DELETE' }),
  batchSaveEngineeringEvents: (
    wellId: string,
    events: { well: string; md: number; type: string; note?: string }[],
  ) => request<BackendEvent[]>(`/api/wells/${wellId}/engineering-events/batch`, { method: 'POST', body: JSON.stringify({ events }) }),

  // --- Well Construction ---
  getConstruction: (wellId: string) => request<BackendConstructionItem[]>(`/api/wells/${wellId}/construction`),
  createConstruction: (
    wellId: string,
    data: {
      kind: 'hole' | 'casing' | 'cement';
      well: string;
      from: number;
      to: number;
      size: number;
      note?: string;
    },
  ) => request<BackendConstructionItem>(`/api/wells/${wellId}/construction`, { method: 'POST', body: JSON.stringify(data) }),
  updateConstruction: (
    wellId: string,
    itemId: string,
    data: {
      kind: 'hole' | 'casing' | 'cement';
      well?: string;
      from?: number;
      to?: number;
      size?: number;
      note?: string;
    },
  ) => request<BackendConstructionItem>(`/api/wells/${wellId}/construction/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteConstruction: (wellId: string, itemId: string, kind?: 'hole' | 'casing' | 'cement') => {
    const q = kind ? `?kind=${kind}` : '';
    return request<void>(`/api/wells/${wellId}/construction/${itemId}${q}`, { method: 'DELETE' });
  },
  batchSaveConstruction: (
    wellId: string,
    items: { kind: 'hole' | 'casing' | 'cement'; well: string; from: number; to: number; size: number; note?: string }[],
  ) => request<void>(`/api/wells/${wellId}/construction/batch`, { method: 'POST', body: JSON.stringify({ items }) }),
};

