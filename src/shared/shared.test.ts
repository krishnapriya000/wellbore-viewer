import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError, createApiClient } from './api';
import { can, createMockAuthService, hasRole, toRoles } from './auth';
import { parseEnv } from './config/env';
import { dlsToDisplay, formatDepth, M_PER_FT, toDisplay, toFeet } from './units/units';

describe('units', () => {
  it('round-trips ft → m → ft', () => {
    for (const ft of [0, 1, 4000, 15000.5]) expect(toFeet(toDisplay(ft, 'm'), 'm')).toBeCloseTo(ft, 9);
  });
  it('formats depth and converts DLS to °/30 m', () => {
    expect(formatDepth(1000, 'm', 1)).toBe(`${(1000 * M_PER_FT).toFixed(1)} m`);
    expect(dlsToDisplay(3, 'm')).toBeCloseTo(2.9528, 4);
  });
});

describe('roles', () => {
  it('higher roles include lower ones', () => {
    expect(hasRole(['Wellbore.Admin'], 'Wellbore.Viewer')).toBe(true);
    expect(hasRole(['Wellbore.Viewer'], 'Wellbore.Engineer')).toBe(false);
    expect(can(['Wellbore.Engineer'], 'survey:upload')).toBe(true);
    expect(can(['Wellbore.Engineer'], 'well:configure')).toBe(false);
  });
  it('ignores unknown role claims', () => {
    expect(toRoles(['Wellbore.Viewer', 'Global.Admin', 42])).toEqual(['Wellbore.Viewer']);
    expect(toRoles(undefined)).toEqual([]);
  });
});

describe('env', () => {
  const entra = {
    VITE_AUTH_MODE: 'entra',
    VITE_ENTRA_TENANT_ID: '11111111-1111-4111-8111-111111111111',
    VITE_ENTRA_SPA_CLIENT_ID: '22222222-2222-4222-8222-222222222222',
    VITE_ENTRA_AUTHORITY: 'https://login.microsoftonline.com/11111111-1111-4111-8111-111111111111',
    VITE_ENTRA_REDIRECT_URI: 'http://localhost:5173/',
    VITE_API_SCOPE: 'api://33333333-3333-4333-8333-333333333333/Surveys.ReadWrite',
  };
  it('accepts a complete Entra configuration', () => {
    expect(parseEnv(entra, true).VITE_AUTH_MODE).toBe('entra');
  });
  it('names every missing Entra value', () => {
    expect(() => parseEnv({ VITE_AUTH_MODE: 'entra' }, false)).toThrow(
      /VITE_ENTRA_SPA_CLIENT_ID[\s\S]*VITE_API_SCOPE/,
    );
  });
  it('refuses mock auth in a production build', () => {
    expect(() => parseEnv({ VITE_AUTH_MODE: 'mock' }, true)).toThrow(/not allowed in a production build/);
  });
});

describe('api client', () => {
  const auth = createMockAuthService('Wellbore.Viewer');
  const Me = z.object({ name: z.string() });

  it('sends the bearer token and validates the response', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ name: 'A' }), { status: 200 }));
    const api = createApiClient(auth, 'https://api.example.com', fetchMock as unknown as typeof fetch);
    await expect(api.get('/me', Me)).resolves.toEqual({ name: 'A' });
    const init = (fetchMock.mock.calls[0] as unknown as [URL, RequestInit])[1];
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer mock-token');
  });

  it('turns 403 into an ApiError and rejects malformed bodies', async () => {
    const forbidden = createApiClient(
      auth,
      'https://api.example.com',
      (async () => new Response('', { status: 403 })) as unknown as typeof fetch,
    );
    await expect(forbidden.get('/x', Me)).rejects.toMatchObject({ status: 403 });
    const bad = createApiClient(
      auth,
      'https://api.example.com',
      (async () => new Response('{"nope":1}')) as unknown as typeof fetch,
    );
    await expect(bad.get('/x', Me)).rejects.toThrow();
  });

  it('refuses to call when no API base URL is configured', async () => {
    await expect(createApiClient(auth, '').get('/x', Me)).rejects.toBeInstanceOf(ApiError);
  });
});
