import test from "node:test";
import assert from "node:assert/strict";
import { isOwnProfilePath } from "../lib/nav.ts";

test("own profile highlights the profile menu item", () => {
  assert.equal(isOwnProfilePath("/profile/bigtrrr", "bigtrrr"), true);
  assert.equal(isOwnProfilePath("/profile/bigtrrr/", "bigtrrr"), true);
  assert.equal(isOwnProfilePath("/profile/BigTrrr", "bigtrrr"), true);
});

test("another user's profile does not highlight it", () => {
  assert.equal(isOwnProfilePath("/profile/luckyfiction", "bigtrrr"), false);
});

test("other pages and signed out states never highlight it", () => {
  assert.equal(isOwnProfilePath("/discover", "bigtrrr"), false);
  assert.equal(isOwnProfilePath("/profile/bigtrrr", null), false);
  assert.equal(isOwnProfilePath("/profile/bigtrrr", undefined), false);
  assert.equal(isOwnProfilePath("/profile/%E0%A4%A", "bigtrrr"), false);
});
