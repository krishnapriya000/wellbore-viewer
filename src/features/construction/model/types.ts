import { z } from 'zod';

export const HOLE_SIZES_IN = [
  36, 26, 24, 17.5, 16, 14.75, 12.25, 10.625, 9.875, 8.75, 8.5, 6.125, 6,
] as const;
export const CASING_SIZES_IN = [
  30, 20, 18.625, 16, 13.375, 11.75, 10.75, 9.625, 7.625, 7, 5.5, 5, 4.5,
] as const;

/** Hole section, casing/liner string or cement job. Depths are MD in feet; sizes in inches. */
export const ConstructionItemSchema = z
  .object({
    id: z.string(),
    kind: z.enum(['hole', 'casing', 'cement']),
    well: z.string(), // 'All' = shared motherbore
    from: z.number().nonnegative(),
    to: z.number().positive(),
    size: z.number().min(1).max(60),
    note: z.string().max(240).default(''),
  })
  .refine((k) => k.to > k.from, { message: 'To must be deeper than From', path: ['to'] });

export type ConstructionItem = z.infer<typeof ConstructionItemSchema>;
