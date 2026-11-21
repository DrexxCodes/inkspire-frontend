import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

type Listener = (event: Record<string, unknown>) => void;

/** Loads public/sw.js in a fake worker so the offline behaviour can be checked without a browser. */
function loadWorker(opts: { online: boolean; cached?: string[] }) {
  const listeners: Record<string, Listener> = {};
  const store = new Map<string, Response>();
  for (const url of opts.cached ?? []) store.set(url, new Response(`cached ${url}`));
  const added: string[] = [];
  const deleted: string[] = [];
  const cache = {
    add: async (url: string) => {
      added.push(url);
      store.set(url, new Response(`cached ${url}`));
    },
  };
  const sandbox = {
    self: {
      addEventListener: (type: string, fn: Listener) => (listeners[type] = fn),
      skipWaiting: () => Promise.resolve(),
      clients: { claim: () => Promise.resolve() },
    },
    caches: {
      open: async () => cache,
      keys: async () => ["inkspire-offline-v0", "inkspire-offline-v1"],
      delete: async (k: string) => void deleted.push(k),
      match: async (url: string) => store.get(url),
    },
    fetch: async () => {
      if (!opts.online) throw new TypeError("Failed to fetch");
      return new Response("network page");
    },
    Response,
    Promise,
  };
  vm.runInNewContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), sandbox);
  return { listeners, added, deleted };
}

const navigate = (mode: string) => {
  let answer: Promise<Response> | undefined;
  const event = { request: { mode }, respondWith: (p: Promise<Response>) => void (answer = p) };
  return { event, answered: () => answer };
};

test("installing keeps the offline page", async () => {
  const sw = loadWorker({ online: true });
  let ready: Promise<unknown> | undefined;
  sw.listeners.install!({ waitUntil: (p: Promise<unknown>) => void (ready = p) });
  await ready;
  assert.ok(sw.added.includes("/offline.html"));
});

test("activating removes old caches", async () => {
  const sw = loadWorker({ online: true });
  let ready: Promise<unknown> | undefined;
  sw.listeners.activate!({ waitUntil: (p: Promise<unknown>) => void (ready = p) });
  await ready;
  assert.deepEqual(sw.deleted, ["inkspire-offline-v0"]);
});

test("a page load with internet comes from the network", async () => {
  const sw = loadWorker({ online: true, cached: ["/offline.html"] });
  const nav = navigate("navigate");
  sw.listeners.fetch!(nav.event);
  assert.equal(await (await nav.answered())!.text(), "network page");
});

test("a page load with no internet shows the offline page", async () => {
  const sw = loadWorker({ online: false, cached: ["/offline.html"] });
  const nav = navigate("navigate");
  sw.listeners.fetch!(nav.event);
  assert.equal(await (await nav.answered())!.text(), "cached /offline.html");
});

test("scripts, images and API calls are never answered by the worker", () => {
  const sw = loadWorker({ online: false, cached: ["/offline.html"] });
  for (const mode of ["cors", "no-cors", "same-origin"]) {
    const req = navigate(mode);
    sw.listeners.fetch!(req.event);
    assert.equal(req.answered(), undefined, mode);
  }
});
