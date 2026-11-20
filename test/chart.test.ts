import test from "node:test";
import assert from "node:assert/strict";
import { formatBucket, seriesFor, toChartData, totalFor } from "../utils/chart.ts";
import { SERIES_COLORS } from "../utils/colors.ts";
import type { SeriesRow } from "../types/api.ts";

const row = (bucket: string, n: number): SeriesRow => ({ bucket, signups: n, works_created: 0, works_published: 0, likes: n * 2, comments: 0, shares: 0, views: 0 });

test("formatBucket per granularity", () => {
  assert.equal(formatBucket("2026-03-07", "daily"), "7 Mar");
  assert.equal(formatBucket("2026-03-07", "daily", true), "7 Mar 2026");
  assert.equal(formatBucket("2026-03-01", "monthly"), "Mar 26");
  assert.equal(formatBucket("2026-03-01", "monthly", true), "Mar 2026");
  assert.equal(formatBucket("2026", "yearly"), "2026");
});

test("series colors are assigned in fixed order", () => {
  assert.deepEqual(seriesFor(["likes", "views"]).map((s) => s.color), [SERIES_COLORS[0], SERIES_COLORS[1]]);
  assert.throws(() => seriesFor(["likes", "views", "shares", "comments", "signups"]));
});

test("toChartData adds labels and totalFor sums", () => {
  const rows = [row("2026-03-01", 1), row("2026-03-02", 4)];
  const data = toChartData(rows, "daily");
  assert.equal(data[1]!.label, "2 Mar");
  assert.equal(data[1]!.likes, 8);
  assert.equal(totalFor(rows, "signups"), 5);
});
