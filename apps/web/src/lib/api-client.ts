import type { ApiErrorResponse } from '@pms/shared';

/**
 * Browser API base. Requests go to the same-origin `/api` prefix, which Next
 * rewrites to the backend — so the httpOnly auth cookie is sent automatically
 * and there is no CORS to manage on the client.
 */
const API_BASE = '/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw toApiError(response.status, payload);
  }

  return payload as T;
}

function toApiError(status: number, payload: unknown): ApiError {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const body = payload as Partial<ApiErrorResponse>;
    const message = Array.isArray(body.message)
      ? body.message[0] ?? 'Request failed'
      : (body.message as string) ?? 'Request failed';
    const details = Array.isArray(body.message) ? body.message : undefined;
    return new ApiError(status, message, details);
  }
  return new ApiError(status, typeof payload === 'string' ? payload : 'Request failed');
}
