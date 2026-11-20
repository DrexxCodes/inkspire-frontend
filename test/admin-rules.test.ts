import test from "node:test";
import assert from "node:assert/strict";
import { assignableRoles, canManageUser } from "../lib/admin-rules.ts";

test("nobody manages themselves", () => {
  assert.equal(canManageUser({ uid: "a", role: "super_admin" }, { id: "a", role: "user" }), false);
});
test("admins manage only lower ranks", () => {
  assert.equal(canManageUser({ uid: "a", role: "admin" }, { id: "b", role: "moderator" }), true);
  assert.equal(canManageUser({ uid: "a", role: "admin" }, { id: "b", role: "admin" }), false);
  assert.equal(canManageUser({ uid: "a", role: "admin" }, { id: "b", role: "super_admin" }), false);
});
test("super admin manages anyone else", () => {
  assert.equal(canManageUser({ uid: "a", role: "super_admin" }, { id: "b", role: "super_admin" }), true);
});
test("assignable roles", () => {
  assert.deepEqual(assignableRoles("moderator"), ["user"]);
  assert.deepEqual(assignableRoles("admin"), ["user", "moderator"]);
  assert.deepEqual(assignableRoles("super_admin"), ["user", "moderator", "admin", "super_admin"]);
});
