import { z } from 'zod';

/** One survey station as it may arrive from a file, a form or the API. */
export const StationSchema = z.object({
  md: z.number().finite().nonnegative({ message: 'MD must be ≥ 0' }),
  inc: z
    .number()
    .finite()
    .min(0, { message: 'Inclination must be 0–180°' })
    .max(180, { message: 'Inclination must be 0–180°' }),
  azi: z
    .number()
    .finite()
    .transform((a) => ((a % 360) + 360) % 360),
});

export type StationInput = z.input<typeof StationSchema>;

export const WellNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[\w .\-/]+$/, { message: 'Well names may use letters, digits, space, . - / _' });
