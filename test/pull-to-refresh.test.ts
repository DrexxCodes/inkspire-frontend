import test from "node:test";
import assert from "node:assert/strict";
import { PULL, canPullOn, pullDistance, pullIntent, pullProgress, pullRotation, shouldRefresh } from "../lib/pull-to-refresh.ts";

test("a tiny movement is undecided, not a pull", () => {
  assert.equal(pullIntent(0, 4), "undecided");
  assert.equal(pullIntent(3, 5), "undecided");
});

test("a clear downward drag is a pull", () => {
  assert.equal(pullIntent(2, 30), "pull");
  assert.equal(pullIntent(10, 40), "pull");
});

test("scrolling the page (finger moving up) is never a pull", () => {
  assert.equal(pullIntent(0, -30), "scroll");
  assert.equal(pullIntent(5, -200), "scroll");
});

test("sideways and diagonal drags are left to the browser", () => {
  assert.equal(pullIntent(40, 10), "scroll");
  assert.equal(pullIntent(30, 30), "scroll");
});

test("nothing shows inside the dead zone", () => {
  assert.equal(pullDistance(0), 0);
  assert.equal(pullDistance(-50), 0);
  assert.equal(pullDistance(PULL.deadZone), 0);
  assert.ok(pullDistance(PULL.deadZone + 1) > 0);
});

test("the spinner follows the finger with resistance and stops at the maximum", () => {
  assert.equal(pullDistance(PULL.deadZone + 50), 50 * PULL.resistance);
  assert.equal(pullDistance(10_000), PULL.max);
});

test("a short pull does not refresh, a deliberate one does", () => {
  assert.equal(shouldRefresh(pullDistance(60)), false);
  assert.equal(shouldRefresh(pullDistance(100)), false);
  assert.equal(shouldRefresh(pullDistance(140)), true);
  assert.equal(shouldRefresh(pullDistance(10_000)), true);
});

test("progress and rotation grow with the pull", () => {
  assert.equal(pullProgress(0), 0);
  assert.equal(pullProgress(PULL.trigger / 2), 0.5);
  assert.equal(pullProgress(500), 1);
  assert.equal(pullRotation(0), 0);
  assert.equal(pullRotation(PULL.trigger), PULL.trigger * PULL.degPerPx);
});

test("pull to refresh is off where typing could be lost", () => {
  assert.equal(canPullOn("/auth/login"), false);
  assert.equal(canPullOn("/auth/register"), false);
  assert.equal(canPullOn("/write/new"), false);
  assert.equal(canPullOn("/write/abc123"), false);
  assert.equal(canPullOn("/write/abc123/"), false);
});

test("pull to refresh is on for the other pages", () => {
  for (const p of ["/discover", "/works/abc", "/write", "/write/abc/history", "/profile/bigtrrr", "/settings", "/admin", "/admin/users"]) {
    assert.equal(canPullOn(p), true, p);
  }
});
