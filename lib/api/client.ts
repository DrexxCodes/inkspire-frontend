import { API_BASE_URL } from "../config";
import { ApiError } from "./errors";

export type TokenProvider = (forceRefresh?: boolean) => Promise<string | null>;
type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Query;
  body?: unknown;
  form?: FormData;
  /** "required" fails without a session, "optional" sends a token if there is one. */
  auth?: "required" | "optional" | "none";
  signal?: AbortSignal;
}

export interface ApiClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  getToken?: TokenProvider;
}

export function buildQuery(query?: Query): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

/**
 * Thin client for the Fastify backend. Unwraps the { success, data } envelope and converts
 * failures into ApiError so the UI can branch on `error.code`.
 */
export function createApiClient(opts: ApiClientOptions) {
  let tokenProvider = opts.getToken;
  const doFetch = (...args: Parameters<typeof fetch>) => (opts.fetchImpl ?? fetch)(...args);

  async function send(path: string, o: RequestOptions, token: string | null): Promise<Response> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    let body: BodyInit | undefined;
    if (o.form) body = o.form;
    else if (o.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(o.body);
    }
    try {
      return await doFetch(`${opts.baseUrl}${path}${buildQuery(o.query)}`, {
        method: o.method ?? "GET",
        headers,
        body,
        signal: o.signal,
        cache: "no-store",
      });
    } catch (e) {
      if ((e as Error)?.name === "AbortError") throw e;
      throw new ApiError("NETWORK_ERROR", "We could not reach Inkspire. Check your connection and try again.", 0);
    }
  }

  async function request<T>(path: string, o: RequestOptions = {}): Promise<T> {
    const mode = o.auth ?? "none";
    let token: string | null = null;
    if (mode !== "none" && tokenProvider) token = await tokenProvider();
    if (mode === "required" && !token) throw new ApiError("UNAUTHENTICATED", "Sign in to continue.", 401);

    let res = await send(path, o, token);

    // An expired token is refreshed once. A second failure is reported to the caller.
    if (res.status === 401 && token && tokenProvider) {
      const fresh = await tokenProvider(true);
      if (fresh && fresh !== token) res = await send(path, o, fresh);
    }

    let json: { success?: boolean; data?: T; error?: { code?: string; message?: string; details?: unknown } } | null = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (!res.ok || !json || json.success === false) {
      const err = json?.error;
      throw new ApiError(
        err?.code ?? (res.status === 429 ? "RATE_LIMITED" : "REQUEST_FAILED"),
        err?.message ?? "The request could not be completed.",
        res.status,
        err?.details,
      );
    }
    return json.data as T;
  }

  return {
    request,
    get: <T>(path: string, o: Omit<RequestOptions, "method" | "body" | "form"> = {}) => request<T>(path, { ...o, method: "GET" }),
    post: <T>(path: string, body?: unknown, o: Omit<RequestOptions, "method" | "body"> = {}) => request<T>(path, { ...o, method: "POST", body }),
    put: <T>(path: string, body?: unknown, o: Omit<RequestOptions, "method" | "body"> = {}) => request<T>(path, { ...o, method: "PUT", body }),
    patch: <T>(path: string, body?: unknown, o: Omit<RequestOptions, "method" | "body"> = {}) => request<T>(path, { ...o, method: "PATCH", body }),
    delete: <T>(path: string, o: Omit<RequestOptions, "method" | "body" | "form"> = {}) => request<T>(path, { ...o, method: "DELETE" }),
    upload: <T>(path: string, form: FormData, o: Omit<RequestOptions, "method" | "body" | "form"> = {}) => request<T>(path, { ...o, method: "POST", form }),
    setTokenProvider(fn: TokenProvider | undefined) {
      tokenProvider = fn;
    },
  };
}

export const api = createApiClient({ baseUrl: API_BASE_URL });
