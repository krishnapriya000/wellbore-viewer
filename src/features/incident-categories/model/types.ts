export type IncidentSeverity = 'crit' | 'warn' | 'adv' | 'info';

export interface IncidentCause {
  t: string;
  p: number;
}

export interface IncidentRecord {
  id: string;
  familyId: string;
  code: string;
  name: string;
  state: string;
  severity: IncidentSeverity;
  confidence: number;
  evidence: string[];
  causes: IncidentCause[];
  recommendedAction: string;
  constraints: string;
  escalation: string;
  sop: string;
  owner: string;
  status: 'Open' | 'Acknowledged' | 'Escalated' | 'Resolved';
}

export interface IncidentTypeItem {
  id: string;
  familyId: string;
  name: string;
  code?: string;
  description?: string;
  record?: IncidentRecord;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentFamilyItem {
  id: string;
  no?: number;
  slug?: string;
  name: string;
  description?: string;
  typesCount: number;
  activeCount?: number;
  criticalCount?: number;
  warningCount?: number;
  advisoryCount?: number;
  incidentTypes: IncidentTypeItem[];
  createdAt: string;
  updatedAt: string;
}

export interface IncidentFilters {
  severity: string;
  status: string;
  confidence: string;
  section: string;
  formation: string;
  activity: string;
  timeRange: string;
  dataQuality: string;
  environment: string;
  wellType: string;
}
