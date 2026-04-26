// ============================================
// ABC Express AIP — API Client
// Typed HTTP client wrapping fetch
// ============================================
// In the browser, always use the current origin (e.g. http://localhost:3000) so
// `next.config.js` rewrites can proxy `/api/*` to the Express app. This avoids
// `ERR_CONNECTION_REFUSED` when `NEXT_PUBLIC_API_URL` still points at :4000.
// On the server, call the API directly.

// ─── Types ──────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  status: number;
  body: ApiError;

  constructor(status: number, body: ApiError) {
    super(body.error || `Request failed with status ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

// ─── Query params builder ───────────────────────────────────

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

const buildQuery = (params?: QueryParams): string => {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  const qs = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `?${qs.toString()}`;
};

// ─── Client class ───────────────────────────────────────────

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private headers(extra?: HeadersInit): HeadersInit {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      h['Authorization'] = `Bearer ${this.token}`;
    }
    return { ...h, ...extra };
  }

  /** Browser: use relative `/api/...` only (Next.js rewrites → Express). Never call :4000 from the client. */
  private static isBrowser(): boolean {
    return typeof globalThis !== 'undefined' && typeof (globalThis as { document?: unknown }).document !== 'undefined';
  }

  private apiUrl(path: string, params?: QueryParams): string {
    const qs = buildQuery(params ?? {});
    const apiPath = path.startsWith('/') ? path : `/${path}`;
    if (ApiClient.isBrowser()) {
      return `/api${apiPath}${qs}`;
    }
    const origin = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
    return `${origin}/api${apiPath}${qs}`;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: QueryParams,
  ): Promise<ApiResponse<T>> {
    const url = this.apiUrl(path, params);
    const init: RequestInit = {
      method,
      headers: this.headers(),
      credentials: 'include',
    };
    if (body && method !== 'GET') {
      init.body = JSON.stringify(body);
    }

    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (e) {
      if (e instanceof TypeError) {
        throw new Error(
          'Cannot reach the API. Start the Express server (port 4000 by default), e.g. pnpm --filter @abc/api dev. If you use a different port, set API_URL for Next rewrites.',
        );
      }
      throw e;
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const text = (await res.text()).trim();
      if (!res.ok) {
        const hint =
          res.status >= 500
            ? ' (often means the API proxy could not reach the backend—ensure @abc/api is running and API_URL is correct).'
            : '';
        throw new ApiRequestError(res.status, {
          success: false,
          error:
            text.slice(0, 400) || `Request failed with HTTP ${res.status}${hint}`,
        } as ApiError);
      }
      throw new Error(`Expected JSON response, got ${contentType || 'unknown type'}`);
    }

    const json = await res.json().catch(() => ({ success: false, error: 'Invalid JSON response' }));

    if (!res.ok) {
      throw new ApiRequestError(res.status, json as ApiError);
    }

    return json as ApiResponse<T>;
  }

  get<T>(path: string, params?: QueryParams) {
    return this.request<T>('GET', path, undefined, params);
  }

  post<T>(path: string, body?: unknown, params?: QueryParams) {
    return this.request<T>('POST', path, body, params);
  }

  put<T>(path: string, body?: unknown, params?: QueryParams) {
    return this.request<T>('PUT', path, body, params);
  }

  patch<T>(path: string, body?: unknown, params?: QueryParams) {
    return this.request<T>('PATCH', path, body, params);
  }

  delete<T>(path: string, params?: QueryParams) {
    return this.request<T>('DELETE', path, undefined, params);
  }
}

// ─── Singleton ──────────────────────────────────────────────

export const api = new ApiClient();
