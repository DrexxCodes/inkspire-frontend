import { test } from "node:test";
import assert from "node:assert/strict";
import { buildQuery, createApiClient } from "../lib/api/client";
import { ApiError, errorMessage } from "../lib/api/errors";

type Call = { url: string; init: RequestInit };

function mockFetch(responses: Array<{ status?: number; body?: unknown; throws?: Error; text?: string }>) {
  const calls: Call[] = [];
  let i = 0;
  const fn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const r = responses[Math.min(i++, responses.length - 1)]!;
    if (r.throws) throw r.throws;
    const status = r.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (r.text !== undefined) throw new SyntaxError("not json");
        return r.body;
      },
    } as Response;
  }) as unknown as typeof fetch;
  return { fn, calls };
}

const headerOf = (c: Call, name: string) => (c.init.headers as Record<string, string>)[name];

test("buildQuery skips empty values and encodes the rest", () => {
  assert.equal(buildQuery({ a: 1, b: "x y", c: undefined, d: null, e: "", f: false }), "?a=1&b=x+y&f=false");
  assert.equal(buildQuery(), "");
  assert.equal(buildQuery({}), "");
});

test("unwraps the success envelope and sends JSON bodies", async () => {
  const { fn, calls } = mockFetch([{ body: { success: true, data: { work: { id: "w1" } } } }]);
  const api = createApiClient({ baseUrl: "http://api/v1", fetchImpl: fn });
  const data = await api.post<{ work: { id: string } }>("/works", { title: "T" });
  assert.equal(data.work.id, "w1");
  assert.equal(calls[0]!.url, "http://api/v1/works");
  assert.equal(calls[0]!.init.method, "POST");
  assert.equal(calls[0]!.init.body, JSON.stringify({ title: "T" }));
  assert.equal(headerOf(calls[0]!, "Content-Type"), "application/json");
});

test("attaches the bearer token only when asked", async () => {
  const { fn, calls } = mockFetch([{ body: { success: true, data: 1 } }]);
  const api = createApiClient({ baseUrl: "http://api", fetchImpl: fn, getToken: async () => "tok" });
  await api.get("/public");
  await api.get("/mine", { auth: "required" });
  await api.get("/maybe", { auth: "optional" });
  assert.equal(headerOf(calls[0]!, "Authorization"), undefined);
  assert.equal(headerOf(calls[1]!, "Authorization"), "Bearer tok");
  assert.equal(headerOf(calls[2]!, "Authorization"), "Bearer tok");
});

test("a required call without a session fails locally and never hits the network", async () => {
  const { fn, calls } = mockFetch([{ body: { success: true, data: 1 } }]);
  const api = createApiClient({ baseUrl: "http://api", fetchImpl: fn, getToken: async () => null });
  await assert.rejects(() => api.get("/mine", { auth: "required" }), (e: unknown) => e instanceof ApiError && e.code === "UNAUTHENTICATED");
  assert.equal(calls.length, 0);
});

test("an optional call without a session is sent anonymously", async () => {
  const { fn, calls } = mockFetch([{ body: { success: true, data: 1 } }]);
  const api = createApiClient({ baseUrl: "http://api", fetchImpl: fn, getToken: async () => null });
  await api.get("/works", { auth: "optional" });
  assert.equal(headerOf(calls[0]!, "Authorization"), undefined);
});

test("structured backend errors become ApiError with code, status and details", async () => {
  const body = { success: false, error: { code: "CATEGORY_PERMISSION_DENIED", message: "Not allowed here.", details: [{ path: "x" }] } };
  const { fn } = mockFetch([{ status: 403, body }]);
  const api = createApiClient({ baseUrl: "http://api", fetchImpl: fn });
  await assert.rejects(
    () => api.post("/works", {}),
    (e: unknown) => {
      assert.ok(e instanceof ApiError);
      assert.equal(e.code, "CATEGORY_PERMISSION_DENIED");
      assert.equal(e.status, 403);
      assert.equal(e.message, "Not allowed here.");
      assert.deepEqual(e.details, [{ path: "x" }]);
      assert.ok(e.is("FOO", "CATEGORY_PERMISSION_DENIED"));
      return true;
    },
  );
});

test("an expired token is refreshed once and the request retried", async () => {
  const { fn, calls } = mockFetch([
    { status: 401, body: { success: false, error: { code: "INVALID_TOKEN", message: "expired" } } },
    { body: { success: true, data: "ok" } },
  ]);
  const tokens: Array<boolean | undefined> = [];
  const api = createApiClient({
    baseUrl: "http://api",
    fetchImpl: fn,
    getToken: async (force) => {
      tokens.push(force);
      return force ? "fresh" : "stale";
    },
  });
  assert.equal(await api.get("/me", { auth: "required" }), "ok");
  assert.equal(calls.length, 2);
  assert.equal(headerOf(calls[1]!, "Authorization"), "Bearer fresh");
  assert.deepEqual(tokens, [undefined, true]);
});

test("a second 401 after refresh is reported, not retried forever", async () => {
  const unauth = { status: 401, body: { success: false, error: { code: "INVALID_TOKEN", message: "no" } } };
  const { fn, calls } = mockFetch([unauth, unauth, unauth]);
  const api = createApiClient({ baseUrl: "http://api", fetchImpl: fn, getToken: async (f) => (f ? "b" : "a") });
  await assert.rejects(() => api.get("/me", { auth: "required" }), (e: unknown) => e instanceof ApiError && e.status === 401);
  assert.equal(calls.length, 2);
});

test("network failures and non JSON responses give friendly errors", async () => {
  const net = createApiClient({ baseUrl: "http://api", fetchImpl: mockFetch([{ throws: new TypeError("failed") }]).fn });
  await assert.rejects(() => net.get("/x"), (e: unknown) => e instanceof ApiError && e.code === "NETWORK_ERROR" && e.status === 0);

  const html = createApiClient({ baseUrl: "http://api", fetchImpl: mockFetch([{ status: 502, text: "<html>" }]).fn });
  await assert.rejects(() => html.get("/x"), (e: unknown) => e instanceof ApiError && e.code === "REQUEST_FAILED" && e.status === 502);

  const limited = createApiClient({ baseUrl: "http://api", fetchImpl: mockFetch([{ status: 429, text: "slow down" }]).fn });
  await assert.rejects(() => limited.get("/x"), (e: unknown) => e instanceof ApiError && e.code === "RATE_LIMITED");
});

test("aborted requests surface as AbortError so callers can ignore them", async () => {
  const abort = Object.assign(new Error("aborted"), { name: "AbortError" });
  const api = createApiClient({ baseUrl: "http://api", fetchImpl: mockFetch([{ throws: abort }]).fn });
  await assert.rejects(() => api.get("/x"), (e: unknown) => (e as Error).name === "AbortError");
});

test("uploads send FormData without forcing a content type", async () => {
  const { fn, calls } = mockFetch([{ body: { success: true, data: { url: "u" } } }]);
  const api = createApiClient({ baseUrl: "http://api", fetchImpl: fn, getToken: async () => "t" });
  const form = new FormData();
  form.append("file", new Blob(["x"]), "a.png");
  await api.upload("/users/me/photo", form, { auth: "required", query: { kind: "profile" } });
  assert.equal(calls[0]!.url, "http://api/users/me/photo?kind=profile");
  assert.ok(calls[0]!.init.body instanceof FormData);
  assert.equal(headerOf(calls[0]!, "Content-Type"), undefined);
});

test("errorMessage never leaks non API errors", () => {
  assert.equal(errorMessage(new ApiError("X", "Readable.", 400)), "Readable.");
  assert.equal(errorMessage(new Error("TypeError at line 12 in secret.js"), "Fallback."), "Fallback.");
  assert.equal(errorMessage(null), "Something went wrong. Please try again.");
});
