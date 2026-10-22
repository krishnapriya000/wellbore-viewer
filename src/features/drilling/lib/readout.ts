import { itemsFor, type ConstructionItem } from '@/features/construction';
import { EVENT_TYPE_LABELS, type DrillEvent } from '@/features/events';
import { formationAt, type Formation } from '@/features/geology';
import { atMd, type SurveyPoint, type Well } from '@/features/survey';
import { deviationFromPlan, type Deviation } from '../model/deviation';

export type DrillingReadoutMode = 'actual' | 'plan';

export interface CasingShoeReadout {
  item: ConstructionItem;
  sizeInches: number;
  shoeMd: number;
  isInside: boolean;
}

export interface LatestEventReadout {
  event: DrillEvent;
  label: string;
  md: number;
  note?: string;
}

export interface DrillingReadoutData {
  tip: SurveyPoint | null;
  formation: Formation | null;
  casingShoe: CasingShoeReadout | null;
  latestEvent: LatestEventReadout | null;
  deviation: Deviation | null;
}

/** Interpolates the survey position along either actual or plan trajectory at the given MD. */
export function getBitTip(
  well: Well | undefined,
  md: number,
  mode: DrillingReadoutMode = 'actual',
): SurveyPoint | null {
  if (!well) return null;
  const points = mode === 'plan' ? well.plan : well.actual;
  if (!points || points.length === 0) return null;
  return atMd(points, md);
}

/** Returns the stratigraphic formation at the current drill bit (MD override takes precedence over TVD layer). */
export function getFormationAtBit(
  formations: readonly Formation[],
  wellName: string,
  tip: SurveyPoint | null,
): Formation | null {
  if (!tip) return null;
  return formationAt(formations, wellName, tip.md, tip.tvd);
}

/**
 * Finds the relevant casing shoe and size for the bit at the current MD:
 * 1. If bit is inside a casing string (from <= md <= to), returns that string and its shoe depth.
 * 2. If bit has passed through casing shoes (open hole below a shoe), returns the last shoe passed.
 * 3. If bit is above the shallowest shoe, returns the upcoming casing shoe.
 */
export function getRelevantCasingShoe(
  items: readonly ConstructionItem[],
  wellName: string,
  bitMd: number,
): CasingShoeReadout | null {
  const casings = itemsFor(items, wellName)
    .filter((k) => k.kind === 'casing')
    .slice()
    .sort((a, b) => a.to - b.to);

  if (casings.length === 0) return null;

  // 1. Bit inside an active casing string
  const containing = casings.find((c) => bitMd >= c.from && bitMd <= c.to);
  if (containing) {
    return {
      item: containing,
      sizeInches: containing.size,
      shoeMd: containing.to,
      isInside: true,
    };
  }

  // 2. Open hole below shoe: pick the deepest passed shoe (c.to <= bitMd)
  const passed = casings.filter((c) => c.to <= bitMd);
  if (passed.length > 0) {
    const last = passed[passed.length - 1]!;
    return {
      item: last,
      sizeInches: last.size,
      shoeMd: last.to,
      isInside: false,
    };
  }

  // 3. Above the first shoe: upcoming casing shoe
  const upcoming = casings[0]!;
  return {
    item: upcoming,
    sizeInches: upcoming.size,
    shoeMd: upcoming.to,
    isInside: false,
  };
}

/** Finds the most recent engineering event encountered at or above the current bit MD. */
export function getLatestEventAtBit(
  events: readonly DrillEvent[],
  wellName: string,
  bitMd: number,
): LatestEventReadout | null {
  const applicable = events.filter(
    (e) => (e.well === 'All' || e.well === wellName) && e.md <= bitMd,
  );
  if (applicable.length === 0) return null;

  // Sort by MD descending to get the latest encountered event
  const sorted = applicable.slice().sort((a, b) => b.md - a.md);
  const latest = sorted[0]!;
  const label = EVENT_TYPE_LABELS[latest.type] ?? latest.type;

  return {
    event: latest,
    label,
    md: latest.md,
    note: latest.note?.trim() || undefined,
  };
}

/** Computes deviation from plan when in actual mode; in plan mode deviation is zero. */
export function getDeviationAtBit(
  tip: SurveyPoint | null,
  plan: readonly SurveyPoint[],
  mode: DrillingReadoutMode,
): Deviation | null {
  if (!tip || plan.length === 0) return null;
  if (mode === 'plan') {
    return { below: 0, right: 0, ctc: 0 };
  }
  return deviationFromPlan(tip, plan);
}

/** Aggregates all drilling readouts for the active well at the given MD and mode. */
export function computeDrillingReadout(
  well: Well | undefined,
  md: number,
  mode: DrillingReadoutMode,
  formations: readonly Formation[],
  constructionItems: readonly ConstructionItem[],
  events: readonly DrillEvent[],
): DrillingReadoutData {
  const tip = getBitTip(well, md, mode);
  const wellName = well?.name ?? '';

  return {
    tip,
    formation: getFormationAtBit(formations, wellName, tip),
    casingShoe: tip ? getRelevantCasingShoe(constructionItems, wellName, tip.md) : null,
    latestEvent: tip ? getLatestEventAtBit(events, wellName, tip.md) : null,
    deviation: getDeviationAtBit(tip, well?.plan ?? [], mode),
  };
}
