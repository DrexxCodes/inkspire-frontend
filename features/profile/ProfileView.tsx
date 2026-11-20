"use client";

import { useState } from "react";
import { usersService } from "@/services/users.service";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/stores/auth-store";
import { useCursorList } from "@/hooks/useCursorList";
import { useInfiniteTrigger } from "@/hooks/useInfiniteTrigger";
import { formatCount, formatDate } from "@/utils/format";
import type { WorkDto } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState, ErrorState, Skeleton, Spinner } from "@/components/ui/feedback";
import { WorkCard } from "@/components/work/WorkCard";

type Tab = "works" | "about";

export function ProfileView({ username }: { username: string }) {
  const { profile: me } = useAuth();
  const prof = useApi((s) => usersService.profile(username, s), [username]);
  const [tab, setTab] = useState<Tab>("works");
  const works = useCursorList<WorkDto>((cursor, signal) => usersService.works(username, cursor, signal), [username]);
  const sentinel = useInfiniteTrigger(works.loadMore, works.hasMore && !works.loadingMore && !works.loading && tab === "works");

  if (prof.loading) return <Skeleton height={260} radius={32} />;
  if (prof.error || !prof.data) return <ErrorState error={prof.error ?? new Error("Profile not found.")} onRetry={prof.reload} title="We could not find this profile" />;

  const p = prof.data.profile;
  const mine = me?.username === p.username;

  return (
    <div className="profile">
      <div className="profile__banner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.coverPhotoUrl && <img src={p.coverPhotoUrl} alt="" />}
      </div>
      <div className="profile__top">
        <Avatar name={p.displayName} seed={p.username} src={p.profilePhotoUrl} size={152} squircle className="profile__avatar" />
        <div>
          <h1 className="profile__name">{p.displayName}</h1>
          <div className="profile__handle">@{p.username}</div>
          {p.bio && <p className="profile__bio">{p.bio}</p>}
        </div>
        <div className="profile__actions">
          {mine && (
            <ButtonLink href="/settings" variant="secondary" icon="pen">
              Edit profile
            </ButtonLink>
          )}
        </div>
      </div>

      <div className="profile__stats">
        <div>
          <div className="profile__stat-num">{formatCount(p.stats.publishedWorks)}</div>
          <div className="profile__stat-label">Works</div>
        </div>
        <div>
          <div className="profile__stat-num">{formatCount(p.stats.likesReceived)}</div>
          <div className="profile__stat-label">Likes received</div>
        </div>
      </div>

      <Tabs
        label="Profile sections"
        value={tab}
        onChange={setTab}
        items={[
          { id: "works", label: "Works" },
          { id: "about", label: "About" },
        ]}
      />

      {tab === "works" && (
        <>
          <div className="feed">
            {works.items.map((w) => (
              <WorkCard key={w.id} work={w} variant="tile" showStatus={mine} />
            ))}
          </div>
          {works.loading && <Spinner label="Loading works" />}
          {works.error != null && <ErrorState error={works.error} onRetry={works.reload} />}
          {!works.loading && !works.error && works.items.length === 0 && (
            <EmptyState icon="book" title={mine ? "You have not published anything yet" : "No published works yet"}>
              {mine ? "Your first piece is a few minutes away." : "Check back later."}
            </EmptyState>
          )}
          <div ref={sentinel} aria-hidden="true" />
        </>
      )}

      {tab === "about" && (
        <div style={{ display: "grid", gap: 8 }}>
          <p>{p.bio || "This writer has not added a bio yet."}</p>
          <p className="muted small">Joined {formatDate(p.createdAt)}</p>
        </div>
      )}
    </div>
  );
}
