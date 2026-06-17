/**
 * local.ts
 *
 * Shared low-level fetch helper for local SvelteKit API routes (/api/...).
 * Do NOT use this for external API calls — use $lib/api/client.ts for those.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Extract the server's error message from a non-ok response. */
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const json = await response.json();
    return json?.data?.error ?? json?.error ?? json?.message ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

async function localRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const localApi = {
  get: <T>(path: string) => localRequest<T>('GET', path),
  post: <T>(path: string, body: unknown) => localRequest<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => localRequest<T>('PUT', path, body),
  patch: <T>(path: string) => localRequest<T>('PATCH', path),
  delete: <T>(path: string) => localRequest<T>('DELETE', path),
};
