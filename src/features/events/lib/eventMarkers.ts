import { Vector3 } from 'three';
import { atMd, type SurveyPoint, type Well } from '@/features/survey';
import { toDisplay, type DepthUnit } from '@/shared/units/units';
import { EVENT_TYPE_LABELS } from '../model/eventsStore';
import type { DrillEvent, EventType } from '../model/types';
import { getEventCategoryFromType, getEventColors, type EventCategory } from './eventIcons';

export const SCALE = 0.01;

export interface PlacedEventMarker {
  id: string;
  well: string;
  mdFt: number;
  mdDisplay: number;
  unit: DepthUnit;
  type: EventType;
  category: EventCategory;
  label: string;
  note: string;
  /** Three.js coordinates in the scene */
  position: Vector3;
  color: { fg: string; bg: string; border: string };
  /** Trajectory point in world survey units (feet) */
  surveyPoint: SurveyPoint;
}

export interface UnplacedEventDiagnostic {
  event: DrillEvent;
  reason: 'unknown_well' | 'insufficient_stations' | 'negative_md' | 'out_of_range_md';
  message: string;
}

/** Converts a SurveyPoint in survey units (feet) into 3D scene units. */
export function surveyPointToScene(pt: Pick<SurveyPoint, 'n' | 'e' | 'tvd'>, out = new Vector3()): Vector3 {
  return out.set(pt.e * SCALE, -pt.tvd * SCALE, -pt.n * SCALE);
}

/**
 * Computes 3D positions and marker metadata for engineering events across all wells.
 *
 * @param events List of engineering events
 * @param wells Map of wells keyed by well name
 * @param unit Active unit system ('ft' or 'm')
 * @returns PlacedEventMarker[] Array of valid placed event markers
 */
export function computeEventMarkers(
  events: readonly DrillEvent[],
  wells: Record<string, Well>,
  unit: DepthUnit,
): PlacedEventMarker[] {
  const placed: PlacedEventMarker[] = [];

  for (const event of events) {
    if (event.md < 0) continue;

    const well = wells[event.well];
    if (!well) continue;

    const points = well.actual.length >= 2 ? well.actual : well.plan;
    if (points.length < 2) continue;

    const firstPt = points[0]!;
    const lastPt = points.at(-1)!;

    if (event.md < firstPt.md - 1e-3 || event.md > lastPt.md + 1e-3) {
      continue; // out of range of trajectory
    }

    const pt = atMd(points, event.md);
    if (!pt) continue;

    const position = surveyPointToScene(pt);
    const colors = getEventColors(event.type);
    const label = EVENT_TYPE_LABELS[event.type] ?? event.type;
    const category = getEventCategoryFromType(event.type);
    const mdDisplay = toDisplay(event.md, unit);

    placed.push({
      id: event.id,
      well: event.well,
      mdFt: event.md,
      mdDisplay,
      unit,
      type: event.type,
      category,
      label,
      note: event.note ?? '',
      position,
      color: colors,
      surveyPoint: pt,
    });
  }

  return placed;
}

/**
 * Provides diagnostic reporting on any events that could not be mapped to 3D trajectory points.
 */
export function getUnplacedEventDiagnostics(
  events: readonly DrillEvent[],
  wells: Record<string, Well>,
): UnplacedEventDiagnostic[] {
  const diagnostics: UnplacedEventDiagnostic[] = [];

  for (const event of events) {
    if (event.md < 0) {
      diagnostics.push({
        event,
        reason: 'negative_md',
        message: `Event "${event.id}" on well "${event.well}" has negative MD (${event.md}).`,
      });
      continue;
    }

    const well = wells[event.well];
    if (!well) {
      diagnostics.push({
        event,
        reason: 'unknown_well',
        message: `Event "${event.id}" references unknown well "${event.well}".`,
      });
      continue;
    }

    const points = well.actual.length >= 2 ? well.actual : well.plan;
    if (points.length < 2) {
      diagnostics.push({
        event,
        reason: 'insufficient_stations',
        message: `Well "${event.well}" has fewer than 2 survey stations.`,
      });
      continue;
    }

    const lastMd = points.at(-1)!.md;
    if (event.md > lastMd + 1e-3) {
      diagnostics.push({
        event,
        reason: 'out_of_range_md',
        message: `Event MD (${event.md} ft) exceeds total depth (${lastMd.toFixed(1)} ft) of well "${event.well}".`,
      });
    }
  }

  return diagnostics;
}
