import test from "node:test";
import assert from "node:assert/strict";
import { validateDisplayName, validateEmail, validatePassword, validateUsername } from "../lib/validation.ts";

test("username rules", () => {
  assert.equal(validateUsername("ada_99"), null);
  for (const bad of ["", "ab", "Ada", "has space", "a".repeat(25)]) assert.notEqual(validateUsername(bad), null);
});
test("email and password rules", () => {
  assert.equal(validateEmail("a@b.co"), null);
  assert.notEqual(validateEmail("nope"), null);
  assert.equal(validatePassword("12345678"), null);
  assert.notEqual(validatePassword("1234567"), null);
});
test("display name rules", () => {
  assert.equal(validateDisplayName(" Ada "), null);
  assert.notEqual(validateDisplayName("   "), null);
  assert.notEqual(validateDisplayName("x".repeat(61)), null);
});
