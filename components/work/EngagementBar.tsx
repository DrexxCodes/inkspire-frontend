"use client";

import { useEffect, useRef, useState } from "react";
import { engagementService } from "@/services/engagement.service";
import { errorMessage } from "@/lib/api/errors";
import { useRequireSignIn } from "@/hooks/useRequireSignIn";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { useToast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";
import { formatCount } from "@/utils/format";
import type { WorkDto } from "@/types/api";
import { Icon } from "@/components/ui/Icon";
import { ShareSheet } from "./ShareSheet";

interface Props {
  work: WorkDto;
  commentCount: number;
  onJumpToComments?: () => void;
  sticky?: boolean;
}

/** Like, comment and share controls. Likes update instantly and roll back if the server says no. */
export function EngagementBar({ work, commentCount, onJumpToComments, sticky }: Props) {
  const toast = useToast();
  const settings = usePublicSettings();
  const requireSignIn = useRequireSignIn();
  const [liked, setLiked] = useState(!!work.viewer.liked);
  const [likes, setLikes] = useState(work.likeCount);
  const [shares, setShares] = useState(work.shareCount);
  const [shareOpen, setShareOpen] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    setLiked(!!work.viewer.liked);
    setLikes(work.likeCount);
    setShares(work.shareCount);
  }, [work.id, work.viewer.liked, work.likeCount, work.shareCount]);

  const toggleLike = async () => {
    if (!requireSignIn() || pending.current) return;
    pending.current = true;
    const nextLiked = !liked;
    const previous = { liked, likes };
    setLiked(nextLiked);
    setLikes((n) => Math.max(0, n + (nextLiked ? 1 : -1)));
    try {
      const res = nextLiked ? await engagementService.like(work.id) : await engagementService.unlike(work.id);
      setLikes(res.likeCount);
    } catch (e) {
      setLiked(previous.liked);
      setLikes(previous.likes);
      toast.error(errorMessage(e));
    } finally {
      pending.current = false;
    }
  };

  const interactive = work.status === "published" && work.visibility === "public";

  return (
    <>
      <div className={cn("engage", sticky && "engage--sticky")} role="group" aria-label="Engagement">
        {settings.allowLikes && (
          <button type="button" className="engage__btn" aria-pressed={liked} onClick={toggleLike} disabled={!interactive}>
            <Icon name="heart" size={20} />
            <span>{formatCount(likes)}</span>
            <span className="visually-hidden">{liked ? "Unlike" : "Like"}</span>
          </button>
        )}
        {settings.allowComments && (
          <button type="button" className="engage__btn" onClick={onJumpToComments}>
            <Icon name="comment" size={20} />
            <span>{formatCount(commentCount)}</span>
            <span className="visually-hidden">Comments</span>
          </button>
        )}
        {settings.allowSharing && interactive && (
          <button type="button" className="engage__btn" onClick={() => setShareOpen(true)}>
            <Icon name="share" size={20} />
            <span>{shares > 0 ? formatCount(shares) : "Share"}</span>
          </button>
        )}
      </div>
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} workId={work.id} title={work.title} onShared={() => setShares((s) => s + 1)} />
    </>
  );
}
