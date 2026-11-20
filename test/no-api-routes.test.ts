import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error plain ESM script without types
import { findViolations } from "../scripts/check-no-api-routes.mjs";

function project(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "inkspire-"));
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}

test("a clean project passes", () => {
  const root = project({ "app/page.tsx": "export default 1", "next.config.ts": "export default {}" });
  assert.deepEqual(findViolations(root), []);
  rmSync(root, { recursive: true });
});

test("an app/api folder is rejected", () => {
  const root = project({ "app/api/hello/route.ts": "export const GET = 1" });
  const problems: string[] = findViolations(root);
  assert.ok(problems.some((p) => p.startsWith("API folder")));
  assert.ok(problems.some((p) => p.startsWith("Route handler")));
  rmSync(root, { recursive: true });
});

test("a route handler anywhere under app/ is rejected", () => {
  const root = project({ "app/feed/route.ts": "export const GET = 1" });
  assert.equal(findViolations(root).length, 1);
  rmSync(root, { recursive: true });
});

test("pages/api is rejected", () => {
  const root = project({ "pages/api/x.ts": "export default 1" });
  assert.ok(findViolations(root).length >= 1);
  rmSync(root, { recursive: true });
});

test("a rewrite to /api in next.config is rejected, but a comment mentioning it is fine", () => {
  const bad = project({ "next.config.ts": 'export default { async rewrites() { return [{ source: "/x", destination: "/api/y" }]; } }' });
  assert.equal(findViolations(bad).length, 1);
  rmSync(bad, { recursive: true });

  const fine = project({ "next.config.ts": "// there are no rewrites() to /api here\nexport default {}" });
  assert.deepEqual(findViolations(fine), []);
  rmSync(fine, { recursive: true });
});

test("the real project is free of API routes", () => {
  assert.deepEqual(findViolations(join(__dirname, "..")), []);
});
