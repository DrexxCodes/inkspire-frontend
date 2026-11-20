import test from "node:test";
import assert from "node:assert/strict";
import { changedSettings, validateSettings } from "../lib/settings-rules.ts";
import type { PlatformSettings } from "../types/api.ts";

const base: PlatformSettings = {
  contentChunkThresholdBytes: 768000, maxWorkSizeBytes: 5_000_000, maxCommentLength: 2000, maxBioLength: 500,
  allowComments: true, allowLikes: true, allowSharing: true, allowRegistration: true, maintenanceMode: false, defaultCategoryPostingAllowed: true,
};

test("valid settings pass", () => assert.deepEqual(validateSettings(base), {}));

test("out of range and non integer values are reported", () => {
  const r = validateSettings({ ...base, contentChunkThresholdBytes: 1_000_000, maxCommentLength: 0, maxBioLength: 1.5 });
  assert.ok(r.contentChunkThresholdBytes && r.maxCommentLength && r.maxBioLength);
  assert.equal(r.maxWorkSizeBytes, undefined);
});

test("changedSettings returns only differences", () => {
  assert.deepEqual(changedSettings(base, { ...base, maintenanceMode: true, maxBioLength: 800 }), { maintenanceMode: true, maxBioLength: 800 });
  assert.deepEqual(changedSettings(base, base), {});
});
