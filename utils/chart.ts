import type { Granularity, MetricName, SeriesRow } from "@/types/api";
import { SERIES_COLORS } from "./colors";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Axis and tooltip label for a bucket key from the backend (UTC). */
export function formatBucket(bucket: string, granularity: Granularity, long = false): string {
  if (granularity === "yearly") return bucket;
  const [y, m, d] = bucket.split("-").map(Number);
  if (!y || !m) return bucket;
  const month = MONTHS[m - 1] ?? "";
  if (granularity === "monthly") return long ? `${month} ${y}` : `${month} ${String(y).slice(2)}`;
  return long ? `${d} ${month} ${y}` : `${d} ${month}`;
}

export const METRIC_LABELS: Record<MetricName, string> = {
  signups: "Sign ups",
  works_created: "Works created",
  works_published: "Works published",
  likes: "Likes",
  comments: "Comments",
  shares: "Shares",
  views: "Views",
};

export interface ChartSeries {
  key: MetricName;
  label: string;
  color: string;
}

/** Colors follow the entity in fixed order, never its rank, so toggling a series does not repaint others. */
export function seriesFor(metrics: MetricName[]): ChartSeries[] {
  if (metrics.length > SERIES_COLORS.length) throw new Error(`A chart supports at most ${SERIES_COLORS.length} series.`);
  return metrics.map((key, i) => ({ key, label: METRIC_LABELS[key], color: SERIES_COLORS[i]! }));
}

export interface ChartPoint {
  bucket: string;
  label: string;
  longLabel: string;
  [metric: string]: number | string;
}

export function toChartData(rows: SeriesRow[], granularity: Granularity): ChartPoint[] {
  return rows.map((r) => ({ ...r, label: formatBucket(r.bucket, granularity), longLabel: formatBucket(r.bucket, granularity, true) }));
}

export function totalFor(rows: SeriesRow[], metric: MetricName): number {
  return rows.reduce((sum, r) => sum + (r[metric] ?? 0), 0);
}
