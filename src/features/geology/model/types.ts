import { z } from 'zod';

export const LITHOLOGIES = [
  'sandstone',
  'shale',
  'siltstone',
  'limestone',
  'dolomite',
  'marl',
  'coal',
  'anhydrite',
  'salt',
  'conglomerate',
  'chert',
  'basement',
] as const;
export type Lithology = (typeof LITHOLOGIES)[number];

const Component = z.object({ lith: z.enum(LITHOLOGIES), pct: z.number().positive().max(100) });

/**
 * A formation interval. TVD intervals are layers across the field; MD intervals apply to one
 * wellbore and override the layer at that depth (same rules as the reference viewer).
 */
export const FormationSchema = z
  .object({
    id: z.string(),
    ref: z.enum(['TVD', 'MD']),
    well: z.string(), // 'All' for TVD layers
    from: z.number().nonnegative(),
    to: z.number().positive(),
    name: z.string().trim().min(1).max(80),
    comp: z.array(Component).min(1).max(3),
  })
  .refine((f) => f.to > f.from, { message: 'To must be deeper than From', path: ['to'] })
  .refine((f) => Math.abs(f.comp.reduce((a, c) => a + c.pct, 0) - 100) < 0.5, {
    message: 'Lithology percents must total 100%',
    path: ['comp'],
  });

export type Formation = z.infer<typeof FormationSchema>;
