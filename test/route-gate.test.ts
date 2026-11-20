import test from "node:test";
import assert from "node:assert/strict";
import { decideGate } from "../lib/gate.ts";
import { visibleAdminNav } from "../lib/admin-nav.ts";
import type { Permissions } from "../types/api.ts";

const none: Permissions = { manageUsers: false, manageRoles: false, manageCategories: false, moderateWorks: false, deleteWorks: false, permanentlyDeleteWorks: false, viewAnalytics: false, managePlatform: false };

test("gate decisions by auth status", () => {
  assert.equal(decideGate("loading", null), "wait");
  assert.equal(decideGate("anonymous", null), "login");
  assert.equal(decideGate("needs-profile", null), "complete-profile");
  assert.equal(decideGate("restricted", none), "restricted");
  assert.equal(decideGate("error", null), "error");
  assert.equal(decideGate("ready", none), "allow");
});

test("gate enforces a required permission", () => {
  assert.equal(decideGate("ready", none, "moderateWorks"), "forbidden");
  assert.equal(decideGate("ready", { ...none, moderateWorks: true }, "moderateWorks"), "allow");
});

test("admin nav only shows entries the role can use", () => {
  assert.deepEqual(visibleAdminNav(null), []);
  const labels = visibleAdminNav({ ...none, moderateWorks: true, viewAnalytics: true }).map((e) => e.label);
  assert.deepEqual(labels, ["Dashboard", "Moderation", "Works"]);
});
