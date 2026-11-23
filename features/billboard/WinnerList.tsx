import Link from "next/link";
import { formatCount } from "@/utils/format";
import { PLACEMENT_LABEL } from "@/utils/prompt";
import type { PromptWinner } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

/** Winners with the writer's profile. `compact` hides the bio and the work links for use inside cards. */
export function WinnerList({ winners, compact }: { winners: PromptWinner[]; compact?: boolean }) {
  const sorted = [...winners].sort((a, b) => a.placement - b.placement);
  return (
    <div className="winners">
      {sorted.map((w) => {
        const a = w.profile ?? { ...w.work.author, bio: "", stats: null };
        return (
          <div key={w.work.id} className={`winner winner--${w.placement}`}>
            <div className="winner__who">
              <Avatar name={a.displayName} seed={a.username} src={a.profilePhotoUrl} size={compact ? 40 : 52} />
              <div>
                <div className="winner__place">{PLACEMENT_LABEL[w.placement]}</div>
                <div className="name-line">
                  <Link href={`/profile/${a.username}`} className="winner__name">
                    {a.displayName}
                  </Link>
                  {a.verified && <VerifiedBadge name={a.displayName} />}
                </div>
                {a.stats && (
                  <div className="winner__stats">
                    {formatCount(a.stats.publishedWorks)} works · {formatCount(a.stats.likesReceived)} likes
                  </div>
                )}
              </div>
              <span className="spacer" />
              {!compact && (
                <ButtonLink href={`/profile/${a.username}`} variant="secondary" size="sm">
                  View profile
                </ButtonLink>
              )}
            </div>
            <Link href={`/works/${w.work.id}`} className="winner__title">
              {w.work.title}
            </Link>
            {!compact && a.bio && <p>{a.bio}</p>}
            {w.note && <p className="winner__note">“{w.note}”</p>}
          </div>
        );
      })}
    </div>
  );
}
