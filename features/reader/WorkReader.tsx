"use client";

import { PromptTag } from "@/components/work/PromptTag";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { worksService } from "@/services/works.service";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/stores/auth-store";
import { useInfiniteTrigger } from "@/hooks/useInfiniteTrigger";
import { cn } from "@/utils/cn";
import { looksLikePoem, splitBlocks } from "@/utils/content";
import { formatDate, readingMinutes } from "@/utils/format";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { ButtonLink } from "@/components/ui/Button";
import { Banner, ErrorState, Skeleton, Spinner } from "@/components/ui/feedback";
import { AuthorCard } from "@/components/work/AuthorCard";
import { EngagementBar } from "@/components/work/EngagementBar";
import { ModerationBanner } from "@/components/work/ModerationBanner";
import { CommentThread } from "@/components/comments/CommentThread";
import { useViewTracking } from "./useViewTracking";
import { useWorkContent } from "./useWorkContent";
import { Button } from "@/components/ui/Button";

export function WorkReader({ workId }: { workId: string }) {
  const { permissions } = useAuth();
  const meta = useApi((s) => worksService.get(workId, s), [workId]);
  const work = meta.data?.work;
  const readable = !!work && (work.status === "published" || work.viewer.isAuthor);
  const content = useWorkContent(workId, readable);
  const sentinel = useInfiniteTrigger(content.loadMore, readable && !content.done && !content.loading && !content.error && !content.changed);
  const commentsRef = useRef<HTMLDivElement>(null);
  const [commentDelta, setCommentDelta] = useState(0);

  useViewTracking(workId, !!work && work.status === "published" && !work.viewer.isAuthor);

  const blocks = useMemo(() => splitBlocks(content.chunks.join("")), [content.chunks]);
  const poem = useMemo(() => looksLikePoem(blocks), [blocks]);

  if (meta.loading) {
    return (
      <div className="reader" aria-busy="true" style={{ display: "grid", gap: 16 }}>
        <Skeleton width="80%" height={44} />
        <Skeleton width="50%" height={20} />
        <Skeleton height={200} />
      </div>
    );
  }
  if (meta.error || !work) return <ErrorState error={meta.error ?? new Error("This work is not available.")} onRetry={meta.reload} title="We could not open this work" />;

  return (
    <article className="reader">
      <header className="reader__head">
        <div className="reader__crumbs">
          <span className="chip chip--static">{work.category.name}</span>
          <PromptTag prompt={work.prompt} />
          {work.visibility === "private" && <span className="chip chip--static">Private</span>}
          {work.status === "draft" && <span className="chip chip--warn chip--static">Draft</span>}
        </div>
        <h1 className="reader__title">{work.title}</h1>
        {work.description && <p className="reader__desc">{work.description}</p>}
        <div className="reader__byline">
          <Avatar name={work.author.displayName} seed={work.author.username} src={work.author.profilePhotoUrl} size={44} />
          <div className="reader__byline-text">
            <div className="name-line">
              <Link href={`/profile/${work.author.username}`} className="reader__byline-name">
                {work.author.displayName}
              </Link>
              {work.author.verified && <VerifiedBadge name={work.author.displayName} />}
            </div>
            <div className="reader__byline-meta">
              {formatDate(work.publishedAt ?? work.createdAt)} · {readingMinutes(work.totalBytes)} min read
            </div>
          </div>
          <span className="spacer" />
          {work.viewer.isAuthor && (
            <ButtonLink href={`/write/${work.id}`} variant="secondary" size="sm" icon="pen">
              Edit
            </ButtonLink>
          )}
        </div>
        {work.coverImageUrl && (
          <div className="reader__cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={work.coverImageUrl} alt="" />
          </div>
        )}
      </header>

      {work.viewer.isAuthor && <ModerationBanner work={work} actions={<ButtonLink href={`/write/${work.id}`} size="sm">Revise this work</ButtonLink>} />}

      {content.changed && (
        <Banner tone="info" icon="refresh" title="This work was just updated" actions={<Button size="sm" onClick={content.restart}>Reload the latest version</Button>}>
          The author saved a new version while you were reading.
        </Banner>
      )}

      <div className={cn("prose", poem && "prose--poem")}>
        {blocks.map((b, i) => (
          <p key={i}>{b}</p>
        ))}
      </div>

      {content.error != null && <ErrorState error={content.error} onRetry={content.loadMore} title="Could not load the rest" />}
      <div ref={sentinel} aria-hidden="true" />
      {content.loading && (
        <div style={{ display: "grid", placeItems: "center", padding: 16 }}>
          <Spinner label="Loading more" />
        </div>
      )}

      {content.done && (
        <div className="reader__end">
          <div className="reader__end-mark" aria-hidden="true" />
          <EngagementBar work={work} commentCount={work.commentCount + commentDelta} onJumpToComments={() => commentsRef.current?.scrollIntoView({ behavior: "smooth" })} />
          <AuthorCard author={work.author} />
        </div>
      )}
      {!content.done && <EngagementBar work={work} commentCount={work.commentCount + commentDelta} sticky onJumpToComments={() => commentsRef.current?.scrollIntoView({ behavior: "smooth" })} />}

      {work.status === "published" && (
        <div ref={commentsRef} style={{ marginTop: 40 }}>
          <CommentThread workId={work.id} authorName={work.author.displayName} canModerate={!!permissions?.moderateWorks} onCountChange={(d) => setCommentDelta((n) => n + d)} />
        </div>
      )}
    </article>
  );
}
