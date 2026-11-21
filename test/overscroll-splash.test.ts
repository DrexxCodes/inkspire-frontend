import test from "node:test";
import assert from "node:assert/strict";
import { atEdge, isVerticalMove, shouldBlockDrag } from "../lib/overscroll.ts";
import { SPLASH, nextProgress, splashLeaveDelay } from "../lib/splash.ts";

const page = (scrollTop: number, scrollHeight = 2000, clientHeight = 800) => ({ scrollTop, scrollHeight, clientHeight });

test("at the top, a downward drag is blocked but an upward one is not", () => {
  assert.equal(atEdge(page(0), 12), true);
  assert.equal(atEdge(page(0), -12), false);
  assert.equal(atEdge(page(-40), 12), true); // already bounced above the top
});

test("at the very bottom, an upward drag is blocked but a downward one is not", () => {
  assert.equal(atEdge(page(1200), -12), true);
  assert.equal(atEdge(page(1200), 12), false);
  assert.equal(atEdge(page(600), -12), false);
  assert.equal(atEdge(page(600), 12), false);
});

test("a page too short to scroll is blocked in both directions", () => {
  assert.equal(atEdge(page(0, 700, 800), 12), true);
  assert.equal(atEdge(page(0, 700, 800), -12), true);
});

test("only vertical movement counts", () => {
  assert.equal(isVerticalMove(2, 14), true);
  assert.equal(isVerticalMove(20, 5), false);
  assert.equal(isVerticalMove(0, 0), false);
});

test("a list that can still scroll keeps the drag, even when the page is at its edge", () => {
  const list = page(300, 1500, 400);
  assert.equal(shouldBlockDrag([list, page(0)], 12), false);
  assert.equal(shouldBlockDrag([page(0, 1500, 400), page(0)], 12), true);
  assert.equal(shouldBlockDrag([], 12), false);
});

test("the splash waits for the sign in check, then for the minimum time", () => {
  assert.equal(splashLeaveDelay(false, 500), null);
  assert.equal(splashLeaveDelay(true, 200), SPLASH.minMs - 200);
  assert.equal(splashLeaveDelay(true, SPLASH.minMs + 500), 0);
});

test("the splash never traps the person, even if the check hangs", () => {
  assert.equal(splashLeaveDelay(false, SPLASH.maxMs), 0);
  assert.equal(splashLeaveDelay(false, SPLASH.maxMs + 1000), 0);
});

test("the progress bar creeps towards 90 and never past it", () => {
  let p = 8;
  for (let i = 0; i < 500; i++) {
    const n = nextProgress(p);
    assert.ok(n >= p && n <= SPLASH.creepTo);
    p = n;
  }
  assert.ok(p > 85);
});
