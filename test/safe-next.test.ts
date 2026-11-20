import test from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "../lib/safe-next.ts";

test("keeps same site paths", () => {
  assert.equal(safeNext("/works/abc?x=1"), "/works/abc?x=1");
});
test("rejects external and protocol relative targets", () => {
  for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "", null, undefined]) {
    assert.equal(safeNext(bad as string | null), "/discover");
  }
});
test("does not loop back into auth pages", () => {
  assert.equal(safeNext("/auth/login"), "/discover");
});
