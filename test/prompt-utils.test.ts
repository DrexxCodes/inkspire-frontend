import { test } from "node:test";
import assert from "node:assert/strict";
import { timeLeft, weekWindow, fromLocalInput, toLocalInput } from "../utils/prompt";

const now = Date.parse("2026-11-23T12:00:00Z");

test("timeLeft counts down in sensible units", () => {
  assert.equal(timeLeft("2026-11-23T12:30:00Z", now), "30 min left");
  assert.equal(timeLeft("2026-11-23T15:00:00Z", now), "3 hours left");
  assert.equal(timeLeft("2026-11-23T13:00:00Z", now), "1 hour left");
  assert.equal(timeLeft("2026-11-28T12:00:00Z", now), "5 days left");
  assert.equal(timeLeft("2026-11-23T11:00:00Z", now), "Closed");
});

test("weekWindow runs Monday to Sunday", () => {
  const w = weekWindow(new Date(2026, 10, 25, 10, 0)); // Wednesday 25 Nov 2026
  assert.equal(w.start, "2026-11-23T00:00");
  assert.equal(w.end, "2026-11-29T23:59");
});

test("local input values round trip", () => {
  const v = "2026-11-23T08:15";
  assert.equal(toLocalInput(fromLocalInput(v)), v);
});
