import { z } from 'zod';

/**
 * Typed, validated runtime configuration. Read once at start-up; a bad value fails fast
 * with a readable message instead of a confusing MSAL error later.
 */
const guid = z.uuid({ message: 'must be a GUID from the Entra app registration' });

const EnvSchema = z
  .object({
    VITE_AUTH_MODE: z.enum(['entra', 'mock']).default('entra'),
    VITE_ENTRA_TENANT_ID: z.string().optional(),
    VITE_ENTRA_SPA_CLIENT_ID: z.string().optional(),
    VITE_ENTRA_AUTHORITY: z.url().optional(),
    VITE_ENTRA_REDIRECT_URI: z.url().optional(),
    VITE_API_SCOPE: z.string().optional(),
    VITE_API_BASE_URL: z.union([z.url(), z.literal('')]).default(''),
    VITE_MOCK_ROLE: z
      .enum(['Wellbore.Viewer', 'Wellbore.Engineer', 'Wellbore.Admin'])
      .default('Wellbore.Engineer'),
  })
  .superRefine((env, ctx) => {
    if (env.VITE_AUTH_MODE !== 'entra') return;
    for (const key of ['VITE_ENTRA_TENANT_ID', 'VITE_ENTRA_SPA_CLIENT_ID'] as const) {
      const r = guid.safeParse(env[key]);
      if (!r.success)
        ctx.addIssue({ code: 'custom', path: [key], message: r.error.issues[0]?.message ?? 'invalid' });
    }
    for (const key of ['VITE_ENTRA_AUTHORITY', 'VITE_ENTRA_REDIRECT_URI', 'VITE_API_SCOPE'] as const) {
      if (!env[key])
        ctx.addIssue({ code: 'custom', path: [key], message: 'is required when VITE_AUTH_MODE=entra' });
    }
  });

export type AppEnv = z.infer<typeof EnvSchema>;

export function parseEnv(raw: Record<string, unknown>, isProd: boolean): AppEnv {
  const result = EnvSchema.safeParse(raw);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration (see .env.example):\n${lines}`);
  }
  if (isProd && result.data.VITE_AUTH_MODE === 'mock') {
    throw new Error('VITE_AUTH_MODE=mock is not allowed in a production build.');
  }
  return result.data;
}

export const env: AppEnv = parseEnv(import.meta.env, import.meta.env.PROD);
