import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import type { AuthorSummary } from "@/types/api";

export function AuthorCard({ author, bio }: { author: AuthorSummary; bio?: string }) {
  return (
    <div className="author-card">
      <Avatar name={author.displayName} seed={author.username} src={author.profilePhotoUrl} size={64} squircle />
      <div className="author-card__text">
        <Link href={`/profile/${author.username}`} className="author-card__name">
          {author.displayName}
        </Link>
        <div className="muted small">@{author.username}</div>
        {bio && <p className="author-card__bio">{bio}</p>}
      </div>
      <ButtonLink href={`/profile/${author.username}`} variant="secondary" size="sm">
        View profile
      </ButtonLink>
    </div>
  );
}
