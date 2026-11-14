export interface WellPlanRecord {
  id: string;
  wellId: string;
  wellName?: string;
  targetDepthMd: number; // in internal feet
  targetDepthTvd: number; // in internal feet
  targetInclination: number; // degrees (0 - 180)
  targetAzimuth: number; // degrees (0 - 360)
  plannedKickoffDepth: number; // in internal feet
  targetObjective: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type WellPlanInput = Omit<WellPlanRecord, 'id' | 'createdAt' | 'updatedAt'>;

export interface WellPlanValidationResult {
  valid: boolean;
  error?: string;
}

export function validateWellPlanInput(input: WellPlanInput): WellPlanValidationResult {
  if (!input.wellId || !input.wellId.trim()) {
    return { valid: false, error: 'A well must be selected.' };
  }
  if (!input.targetObjective || !input.targetObjective.trim()) {
    return { valid: false, error: 'Target objective is required.' };
  }
  if (isNaN(input.targetDepthMd) || input.targetDepthMd <= 0) {
    return { valid: false, error: 'Target Depth MD must be a positive number.' };
  }
  if (isNaN(input.targetDepthTvd) || input.targetDepthTvd <= 0) {
    return { valid: false, error: 'Target Depth TVD must be a positive number.' };
  }
  if (input.targetDepthTvd > input.targetDepthMd) {
    return { valid: false, error: 'Target Depth TVD cannot exceed Target Depth MD.' };
  }
  if (isNaN(input.plannedKickoffDepth) || input.plannedKickoffDepth < 0) {
    return { valid: false, error: 'Planned Kickoff Depth cannot be negative.' };
  }
  if (input.plannedKickoffDepth > input.targetDepthMd) {
    return { valid: false, error: 'Planned Kickoff Depth cannot exceed Target Depth MD.' };
  }
  if (
    isNaN(input.targetInclination) ||
    input.targetInclination < 0 ||
    input.targetInclination > 180
  ) {
    return { valid: false, error: 'Target Inclination must be between 0° and 180°.' };
  }
  if (isNaN(input.targetAzimuth) || input.targetAzimuth < 0 || input.targetAzimuth > 360) {
    return { valid: false, error: 'Target Azimuth must be between 0° and 360°.' };
  }
  return { valid: true };
}

