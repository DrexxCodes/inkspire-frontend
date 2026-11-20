"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCount } from "@/utils/format";
import { seriesFor, toChartData, METRIC_LABELS } from "@/utils/chart";
import type { Granularity, MetricName, SeriesRow } from "@/types/api";
import { SegmentedControl } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";

interface Props {
  title: string;
  metrics: MetricName[];
  rows: SeriesRow[];
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  full?: boolean;
}

const GRANULARITIES: { id: Granularity; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

function TooltipBody({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number; color: string; payload: { longLabel: string } }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__title">{payload[0]?.payload.longLabel ?? label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="chart-tooltip__row">
          <span className="chart-tooltip__name">
            <span className="legend__swatch" style={{ background: p.color }} />
            {METRIC_LABELS[p.dataKey as MetricName]}
          </span>
          <span className="chart-tooltip__value">{formatCount(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/** One axis, thin lines, legend for two or more series, hover tooltip, and a table view for screen readers. */
export function AnalyticsChart({ title, metrics, rows, granularity, onGranularityChange, full }: Props) {
  const [showTable, setShowTable] = useState(false);
  const [hidden, setHidden] = useState<Set<MetricName>>(new Set());
  const series = useMemo(() => seriesFor(metrics), [metrics]);
  const data = useMemo(() => toChartData(rows, granularity), [rows, granularity]);
  const visible = series.filter((s) => !hidden.has(s.key));

  const toggle = (k: MetricName) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else if (series.length - next.size > 1) next.add(k);
      return next;
    });

  return (
    <section className={full ? "chart-card chart-card--full" : "chart-card"} aria-label={title}>
      <div className="chart-card__head">
        <h2 className="chart-card__title">{title}</h2>
        <SegmentedControl items={GRANULARITIES} value={granularity} onChange={onGranularityChange} label="Time range" />
      </div>

      {series.length > 1 && (
        <div className="legend" role="group" aria-label="Series">
          {series.map((s) => (
            <button key={s.key} type="button" className="legend__item" aria-pressed={!hidden.has(s.key)} onClick={() => toggle(s.key)}>
              <span className="legend__swatch" style={{ background: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      )}

      {showTable ? (
        <div style={{ overflowX: "auto", maxHeight: 320 }}>
          <table className="table">
            <caption className="visually-hidden">{title}</caption>
            <thead>
              <tr>
                <th scope="col">Period</th>
                {series.map((s) => (
                  <th key={s.key} scope="col">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.bucket}>
                  <th scope="row">{d.longLabel}</th>
                  {series.map((s) => (
                    <td key={s.key}>{formatCount(Number(d[s.key] ?? 0))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="chart-card__plot" role="img" aria-label={`${title}. Use the table view for exact values.`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} tickFormatter={(v: number) => formatCount(v)} width={48} />
              <Tooltip content={<TooltipBody />} cursor={{ stroke: "var(--line-strong)" }} />
              {visible.map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <Button variant="ghost" size="sm" className="data-table-toggle" onClick={() => setShowTable((v) => !v)} aria-pressed={showTable}>
          {showTable ? "Show chart" : "Show as table"}
        </Button>
      </div>
    </section>
  );
}
