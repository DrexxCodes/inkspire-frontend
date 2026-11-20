import { test } from "node:test";
import assert from "node:assert/strict";
import { BREAKPOINTS, breakpointForWidth, overlayFor } from "../lib/breakpoints";

test("widths map to the intended breakpoint at every boundary", () => {
  assert.equal(breakpointForWidth(320), "mobile");
  assert.equal(breakpointForWidth(BREAKPOINTS.tablet - 1), "mobile");
  assert.equal(breakpointForWidth(BREAKPOINTS.tablet), "tablet");
  assert.equal(breakpointForWidth(BREAKPOINTS.laptop - 1), "tablet");
  assert.equal(breakpointForWidth(BREAKPOINTS.laptop), "laptop");
  assert.equal(breakpointForWidth(BREAKPOINTS.desktop), "desktop");
  assert.equal(breakpointForWidth(BREAKPOINTS.wide), "wide");
  assert.equal(breakpointForWidth(3840), "wide");
});

test("dialogs become sheets on mobile, drawers on tablet and modals on larger screens", () => {
  assert.equal(overlayFor("mobile"), "sheet");
  assert.equal(overlayFor("tablet"), "drawer");
  for (const bp of ["laptop", "desktop", "wide"] as const) assert.equal(overlayFor(bp), "modal");
});

test("contextual panels use a side drawer everywhere except mobile", () => {
  assert.equal(overlayFor("mobile", "panel"), "sheet");
  for (const bp of ["tablet", "laptop", "desktop", "wide"] as const) assert.equal(overlayFor(bp, "panel"), "drawer");
});
