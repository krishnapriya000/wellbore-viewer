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
    id: z.string().min(1, { message: 'ID is required' }),
    ref: z.enum(['TVD', 'MD'], { message: 'Reference must be TVD or MD' }),
    well: z.string().min(1, { message: 'Well name is required' }), // 'All' for TVD layers
    from: z.number({ message: 'Top depth must be a number' }).nonnegative({ message: 'Top depth must be ≥ 0' }),
    to: z.number({ message: 'Bottom depth must be a number' }).positive({ message: 'Bottom depth must be > 0' }),
    name: z.string().trim().min(1, { message: 'Formation name is required' }).max(80, { message: 'Formation name must be ≤ 80 characters' }),
    comp: z.array(Component).min(1, { message: 'At least one lithology component is required' }).max(3, { message: 'Maximum 3 lithology components allowed' }),
    visible: z.boolean().optional(),
    color: z.string().optional(),
    order: z.number().optional(),
  })
  .refine((f) => f.to > f.from, {
    message: 'Bottom depth must be greater than top depth (To must be deeper than From)',
    path: ['to'],
  })
  .refine((f) => Math.abs(f.comp.reduce((a, c) => a + c.pct, 0) - 100) < 0.5, {
    message: 'Lithology composition percentages must total 100%',
    path: ['comp'],
  });

export type Formation = z.infer<typeof FormationSchema>;
