export const STANDARD_MUD_TYPES = [
  'Water-Based Mud (WBM)',
  'Oil-Based Mud (OBM)',
  'Synthetic-Based Mud (SBM)',
  'High-Performance WBM',
  'Polymer Drilling Fluid',
  'Saturated Salt / Brine',
  'Air / Foam System',
  'Low-Solids Non-Dispersed (LSND)',
] as const;

export type StandardMudType = typeof STANDARD_MUD_TYPES[number];

export interface MudPlanRecord {
  id: string;
  wellId: string;
  wellName?: string;
  mudType: string;
  mudWeight: number; // in ppg (lb/gal)
  plasticViscosity: number; // in cP
  yieldPoint: number; // in lb/100ft²
  fluidLoss: number; // in mL/30min (API)
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type MudPlanInput = Omit<MudPlanRecord, 'id' | 'createdAt' | 'updatedAt'>;

export interface MudPlanValidationResult {
  valid: boolean;
  error?: string;
}

export function validateMudPlanInput(input: MudPlanInput): MudPlanValidationResult {
  if (!input.wellId || !input.wellId.trim()) {
    return { valid: false, error: 'A well must be selected.' };
  }
  if (!input.mudType || !input.mudType.trim()) {
    return { valid: false, error: 'Mud Type is required.' };
  }
  if (isNaN(input.mudWeight) || input.mudWeight <= 0) {
    return { valid: false, error: 'Mud Weight must be a positive number (ppg).' };
  }
  if (input.mudWeight > 25) {
    return { valid: false, error: 'Mud Weight cannot exceed 25.0 ppg.' };
  }
  if (isNaN(input.plasticViscosity) || input.plasticViscosity < 0) {
    return { valid: false, error: 'Plastic Viscosity (PV) must be 0 or greater (cP).' };
  }
  if (input.plasticViscosity > 150) {
    return { valid: false, error: 'Plastic Viscosity (PV) cannot exceed 150 cP.' };
  }
  if (isNaN(input.yieldPoint) || input.yieldPoint < 0) {
    return { valid: false, error: 'Yield Point (YP) must be 0 or greater (lb/100ft²).' };
  }
  if (input.yieldPoint > 120) {
    return { valid: false, error: 'Yield Point (YP) cannot exceed 120 lb/100ft².' };
  }
  if (isNaN(input.fluidLoss) || input.fluidLoss < 0) {
    return { valid: false, error: 'Fluid Loss must be 0 or greater (mL/30min).' };
  }
  if (input.fluidLoss > 100) {
    return { valid: false, error: 'Fluid Loss cannot exceed 100 mL/30min.' };
  }
  return { valid: true };
}

