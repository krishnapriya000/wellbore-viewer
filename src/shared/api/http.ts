import type { z } from 'zod';
import type { AuthService } from '@/shared/auth';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClient {
  get<T>(path: string, schema: z.ZodType<T>): Promise<T>;
  send<T>(
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body: unknown,
    schema: z.ZodType<T>,
  ): Promise<T>;
}

/**
 * Every API call goes through here: it attaches the Entra access token, sets a correlation id,
 * and validates the response with a zod schema before any feature sees it.
 */
export function createApiClient(
  auth: AuthService,
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
): ApiClient {
  async function request<T>(method: string, path: string, schema: z.ZodType<T>, body?: unknown): Promise<T> {
    if (!baseUrl)
      throw new ApiError(0, 'VITE_API_BASE_URL is not set; the app is running on sample data only.');
    const token = await auth.getAccessToken();
    const res = await fetchImpl(new URL(path, baseUrl), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'X-Correlation-Id': crypto.randomUUID(),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    const json: unknown = text ? JSON.parse(text) : undefined;
    if (!res.ok) {
      // 401 = token missing/invalid, 403 = signed in but lacks the role. Both are enforced by the API.
      throw new ApiError(res.status, `${method} ${path} failed with ${res.status}`, json);
    }
    return schema.parse(json);
  }

  return {
    get: (path, schema) => request('GET', path, schema),
    send: (method, path, body, schema) => request(method, path, schema, body),
  };
}
