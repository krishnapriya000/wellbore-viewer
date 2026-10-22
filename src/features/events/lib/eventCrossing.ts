import { passedBetween, type FeedItem } from '@/features/drilling';
import type { SurveyPoint } from '@/features/survey';
import { formatNumber, toDisplay, type DepthUnit } from '@/shared/units/units';
import { EVENT_TYPE_LABELS } from '../model/eventsStore';
import type { DrillEvent } from '../model/types';

/** Formats the standard survey station message matching existing BitLayer format. */
export function formatSurveyFeedText(
  wellName: string,
  point: SurveyPoint,
  unit: DepthUnit,
): string {
  const f = (v: number) => formatNumber(toDisplay(v, unit), 1);
  return `${wellName}  ${f(point.md)} MD  ${f(point.tvd)} TVD ${unit}  Inc ${formatNumber(point.inc, 2)}°  Azi ${formatNumber(point.azi, 2)}°`;
}

/** Formats an engineering event notification for the live drilling feed. */
export function formatEventFeedText(event: DrillEvent, unit: DepthUnit): string {
  const label = EVENT_TYPE_LABELS[event.type] ?? event.type;
  const depthStr = `${formatNumber(toDisplay(event.md, unit), 1)} ${unit} MD`;
  const noteSuffix = event.note?.trim() ? ` — ${event.note.trim()}` : '';
  return `Event: ${label} (${event.well}) at ${depthStr}${noteSuffix}`;
}

/** Finds all events on the active wellbore crossed between fromMd and toMd (fromMd < md <= toMd). */
export function findPassedEvents(
  events: readonly DrillEvent[],
  activeWell: string,
  fromMd: number,
  toMd: number,
): DrillEvent[] {
  if (toMd <= fromMd) return [];
  const wellEvents = events.filter((e) => e.well === activeWell);
  return passedBetween(wellEvents, (e) => e.md, fromMd, toMd);
}

export interface CrossingCandidate {
  md: number;
  item: Omit<FeedItem, 'id'>;
}

/**
 * Detects all survey stations and engineering events crossed in a depth increment.
 *
 * Rules:
 * - Only announces events belonging to the active well currently drilling.
 * - If fromMd >= toMd (stationary or paused), returns an empty array.
 * - Interleaves survey stations and events sorted by MD.
 * - Coexists seamlessly with existing survey feed items.
 */
export function detectCrossings(
  stations: readonly SurveyPoint[],
  events: readonly DrillEvent[],
  activeWell: string,
  fromMd: number,
  toMd: number,
  unit: DepthUnit,
): Omit<FeedItem, 'id'>[] {
  if (toMd <= fromMd) return [];

  const candidates: CrossingCandidate[] = [];

  // 1. Survey stations crossed
  const passedStations = passedBetween(stations, (p) => p.md, fromMd, toMd);
  for (const p of passedStations) {
    candidates.push({
      md: p.md,
      item: {
        kind: 'survey',
        text: formatSurveyFeedText(activeWell, p, unit),
      },
    });
  }

  // 2. Events crossed
  const passedEvents = findPassedEvents(events, activeWell, fromMd, toMd);
  for (const ev of passedEvents) {
    candidates.push({
      md: ev.md,
      item: {
        kind: 'event',
        text: formatEventFeedText(ev, unit),
      },
    });
  }

  // 3. Sort chronologically by depth encountered
  candidates.sort((a, b) => a.md - b.md);

  return candidates.map((c) => c.item);
}
