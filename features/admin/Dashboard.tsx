"use client";

import Link from "next/link";
import { useState } from "react";
import { analyticsService } from "@/services/analytics.service";
import { useApi } from "@/hooks/useApi";
import { formatCount } from "@/utils/format";
import type { Granularity } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { ErrorState, Skeleton } from "@/components/ui/feedback";
import { AnalyticsChart } from "@/components/admin/AnalyticsChart";
import { MetricCard } from "@/components/admin/MetricCard";

export function Dashboard() {
  const [granularity, setGranularity] = useState<Granularity>("daily");
  const summary = useApi((s) => analyticsService.summary(s), []);
  const series = useApi((s) => analyticsService.timeseries(granularity, s), [granularity]);
  const cats = useApi((s) => analyticsService.categories(s), []);
  const top = useApi((s) => analyticsService.topWorks("views", s), []);
  const authors = useApi((s) => analyticsService.topAuthors(s), []);

  const s = summary.data;
  const rows = series.data?.series ?? [];

  return (
    <div>
      {summary.error != null && <ErrorState error={summary.error} onRetry={summary.reload} />}
      <div className="metrics">
        {summary.loading || !s ? (
          [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={96} radius={24} />)
        ) : (
          <>
            <MetricCard label="Users" value={s.totalUsers} href="/admin/users" />
            <MetricCard label="Works" value={s.totalWorks} href="/admin/works" />
            <MetricCard label="Published" value={s.publishedWorks} />
            <MetricCard label="Flagged" value={s.flaggedWorks} href="/admin/works?moderation=flagged" attention />
            <MetricCard label="Reviews waiting" value={s.pendingReviews} href="/admin/moderation" attention />
          </>
        )}
      </div>

      {series.error != null && <ErrorState error={series.error} onRetry={series.reload} title="Could not load charts" />}
      <div className="charts">
        <AnalyticsChart title="Sign ups and new works" metrics={["signups", "works_created", "works_published"]} rows={rows} granularity={granularity} onGranularityChange={setGranularity} />
        <AnalyticsChart title="Engagement" metrics={["views", "likes", "comments", "shares"]} rows={rows} granularity={granularity} onGranularityChange={setGranularity} />

        <section className="chart-card" aria-labelledby="top-works">
          <h2 id="top-works" className="chart-card__title">Most read works</h2>
          <ul className="top-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {top.data?.items.map((w) => (
              <li key={w.id} className="top-list__row">
                <div className="top-list__main">
                  <Link href={`/works/${w.id}`} className="top-list__title" style={{ display: "block" }}>
                    {w.title}
                  </Link>
                  <span className="small muted">{w.author.displayName}</span>
                </div>
                <span className="top-list__value">{formatCount(w.viewCount)}</span>
              </li>
            ))}
            {top.loading && <Skeleton height={80} />}
            {!top.loading && top.data?.items.length === 0 && <li className="muted">No published works yet.</li>}
          </ul>
        </section>

        <section className="chart-card" aria-labelledby="top-authors">
          <h2 id="top-authors" className="chart-card__title">Top authors</h2>
          <ul className="top-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {authors.data?.items.map((a) => (
              <li key={a.username} className="top-list__row">
                <Avatar name={a.displayName} seed={a.username} src={a.profilePhotoUrl} size={36} squircle />
                <div className="top-list__main">
                  <Link href={`/profile/${a.username}`} className="top-list__title" style={{ display: "block" }}>
                    {a.displayName}
                  </Link>
                  <span className="small muted">{formatCount(a.publishedWorks)} works</span>
                </div>
                <span className="top-list__value">{formatCount(a.likesReceived)} likes</span>
              </li>
            ))}
            {authors.loading && <Skeleton height={80} />}
          </ul>
        </section>

        <section className="chart-card chart-card--full" aria-labelledby="cats">
          <h2 id="cats" className="chart-card__title">Published works by category</h2>
          <ul className="top-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {cats.data?.items.map((c) => (
              <li key={c.id} className="top-list__row">
                <span className="top-list__main top-list__title">{c.name}</span>
                <span className="top-list__value">{formatCount(c.publishedCount)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
