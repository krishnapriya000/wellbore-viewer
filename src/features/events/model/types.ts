import { z } from 'zod';

/** The 21 event symbols of the reference viewer, grouped as there. */
export const EVENT_TYPES = {
  Shows: ['oil_good', 'oil_fair', 'oil_poor', 'fluor', 'gas', 'water'],
  Hazards: ['h2s', 'kick', 'lost', 'stuck', 'tight', 'washout'],
  Geology: ['fault', 'fracture'],
  Operations: ['casing', 'kop', 'bit', 'core', 'dst', 'mw', 'td'],
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES][number];
const ALL = Object.values(EVENT_TYPES).flat() as [EventType, ...EventType[]];

export const DrillEventSchema = z.object({
  id: z.string(),
  well: z.string().min(1),
  md: z.number().nonnegative(),
  type: z.enum(ALL),
  note: z.string().max(240).default(''),
});

export type DrillEvent = z.infer<typeof DrillEventSchema>;
