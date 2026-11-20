import Link from "next/link";
import { cn } from "@/utils/cn";
import { tintFor } from "@/utils/colors";
import { formatCount, readingMinutes, timeAgo } from "@/utils/format";
import type { WorkDto } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

interface Props {
  work: WorkDto;
  /** "feed" is the wide discovery card. "tile" is the compact grid card used on profiles. */
  variant?: "feed" | "tile";
  /** Show the status chip (for authors and moderators looking at non public works). */
  showStatus?: boolean;
  href?: string;
}

const STATUS_LABEL: Record<string, string> = { draft: "Draft", flagged: "Flagged", archived: "Unpublished", deleted: "Deleted" };

export function WorkCard({ work, variant = "feed", showStatus, href }: Props) {
  const tint = tintFor(work.category.id);
  const body = work.excerpt || work.description;
  const statusLabel = showStatus ? STATUS_LABEL[work.status] : undefined;

  const stats = (
    <>
      <span className="stat" title="Views">
        <Icon name="eye" size={16} />
        <span>{formatCount(work.viewCount)}</span>
        <span className="visually-hidden">views</span>
      </span>
      <span className="stat" title="Likes">
        <Icon name="heart" size={16} />
        <span>{formatCount(work.likeCount)}</span>
        <span className="visually-hidden">likes</span>
      </span>
      <span className="stat" title="Comments">
        <Icon name="comment" size={16} />
        <span>{formatCount(work.commentCount)}</span>
        <span className="visually-hidden">comments</span>
      </span>
    </>
  );

  const title = (
    <h3 className="work-card__title">
      <Link href={href ?? `/works/${work.id}`} className="work-card__link">
        {work.title}
      </Link>
    </h3>
  );

  const cover = work.coverImageUrl && (
    <div className="work-card__cover">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={work.coverImageUrl} alt="" loading="lazy" decoding="async" />
    </div>
  );

  if (variant === "tile") {
    return (
      <article className={cn("work-card work-card--tile", `tint-${tint}`)}>
        {statusLabel && (
          <span className="chip chip--warn chip--static work-card__flag">{statusLabel}</span>
        )}
        {cover}
        <div className="work-card__body">
          <span className="chip chip--static" style={{ justifySelf: "start", background: "rgba(255,255,255,0.7)", borderColor: "transparent" }}>
            {work.category.name}
          </span>
          {title}
          {body && <p className="work-card__excerpt">{body}</p>}
        </div>
        <div className="work-card__foot">{stats}</div>
      </article>
    );
  }

  return (
    <article className={cn("work-card", `tint-${tint}`)}>
      <div className="work-card__head">
        <Avatar name={work.author.displayName} seed={work.author.username} src={work.author.profilePhotoUrl} size={44} />
        <div className="work-card__who">
          <Link href={`/profile/${work.author.username}`} className="work-card__author work-card__author-link">
            {work.author.displayName}
          </Link>
          <div className="work-card__when">
            {work.publishedAt ? timeAgo(work.publishedAt) : timeAgo(work.updatedAt)} in {work.category.name}
          </div>
        </div>
        {statusLabel && <span className="chip chip--warn chip--static">{statusLabel}</span>}
      </div>
      {title}
      {body && <p className="work-card__excerpt">{body}</p>}
      {cover}
      <div className="work-card__foot">
        {stats}
        <span className="spacer" />
        <span>{readingMinutes(work.totalBytes)} min read</span>
      </div>
    </article>
  );
}
