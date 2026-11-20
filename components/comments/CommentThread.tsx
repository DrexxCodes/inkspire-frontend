"use client";

import { useState } from "react";
import { engagementService } from "@/services/engagement.service";
import { errorMessage } from "@/lib/api/errors";
import { useAuth } from "@/stores/auth-store";
import { useToast } from "@/stores/toast-store";
import { useCursorList } from "@/hooks/useCursorList";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { useRequireSignIn } from "@/hooks/useRequireSignIn";
import { timeAgo } from "@/utils/format";
import type { CommentDto } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadMore, Spinner } from "@/components/ui/feedback";
import { updateById } from "@/utils/list";
import { TextAreaField } from "@/components/ui/fields";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface FormProps {
  placeholder: string;
  submitLabel: string;
  maxLength: number;
  autoFocus?: boolean;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
}

function CommentForm({ placeholder, submitLabel, maxLength, autoFocus, onSubmit, onCancel }: FormProps) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const trimmed = value.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onSubmit(trimmed);
      setValue("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={submit}>
      <TextAreaField label={placeholder} hideLabel value={value} onChange={(e) => setValue(e.target.value)} maxLength={maxLength} autoFocus={autoFocus} placeholder={placeholder} />
      <div className="comment-form__foot">
        <span className="small muted">
          {value.length}/{maxLength}
        </span>
        <span style={{ display: "flex", gap: 8 }}>
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" loading={busy} disabled={!trimmed}>
            {submitLabel}
          </Button>
        </span>
      </div>
    </form>
  );
}

interface ItemProps {
  workId: string;
  comment: CommentDto;
  maxLength: number;
  canModerate: boolean;
  onDeleted: (c: CommentDto) => void;
  onReplied: () => void;
}

function CommentItem({ workId, comment, maxLength, canModerate, onDeleted, onReplied }: ItemProps) {
  const { user } = useAuth();
  const toast = useToast();
  const requireSignIn = useRequireSignIn();
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [extraReplies, setExtraReplies] = useState(0);

  const replies = useCursorList<CommentDto>((cursor, signal) => engagementService.comments(workId, { cursor, parent: comment.id }, signal), [workId, comment.id], showReplies);

  const removed = comment.status === "deleted";
  const mine = !!user && user.uid === comment.authorId;
  const isTop = comment.parentCommentId === null;
  const replyTotal = comment.replyCount + extraReplies;

  const reply = async (content: string) => {
    try {
      const { comment: created } = await engagementService.addComment(workId, content, comment.id);
      setExtraReplies((n) => n + 1);
      setReplying(false);
      setShowReplies(true);
      replies.mutate((items) => [...items, created]);
      onReplied();
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    }
  };

  const remove = async () => {
    await engagementService.deleteComment(workId, comment.id);
    onDeleted(comment);
    toast.success("Comment deleted");
  };

  return (
    <li className="comment">
      <Avatar name={comment.author.displayName} seed={comment.author.username} src={comment.author.profilePhotoUrl} size={36} />
      <div className="comment__main">
        <div className="comment__meta">
          <span className="comment__name">{removed ? "Removed" : comment.author.displayName}</span>
          <span className="comment__time">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className={removed ? "comment__body comment__body--removed" : "comment__body"}>{removed ? "This comment was deleted." : comment.content}</p>
        {!removed && (
          <div className="comment__actions">
            {isTop && (
              <Button variant="ghost" size="sm" onClick={() => requireSignIn() && setReplying((v) => !v)}>
                Reply
              </Button>
            )}
            {(mine || canModerate) && (
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
          </div>
        )}
        {replying && (
          <div style={{ marginTop: 10 }}>
            <CommentForm placeholder={`Reply to ${comment.author.displayName}`} submitLabel="Reply" maxLength={maxLength} autoFocus onSubmit={reply} onCancel={() => setReplying(false)} />
          </div>
        )}
        {isTop && replyTotal > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setShowReplies((v) => !v)} aria-expanded={showReplies}>
            {showReplies ? "Hide replies" : `View ${replyTotal} ${replyTotal === 1 ? "reply" : "replies"}`}
          </Button>
        )}
      </div>
      {showReplies && (
        <ul className="comment__replies" style={{ listStyle: "none", margin: 0 }}>
          {replies.items.map((r) => (
            <CommentItem
              key={r.id}
              workId={workId}
              comment={r}
              maxLength={maxLength}
              canModerate={canModerate}
              onReplied={onReplied}
              onDeleted={(c) => {
                replies.mutate((items) => updateById(items, c.id, { status: "deleted" }));
                onDeleted(c);
              }}
            />
          ))}
          {replies.loading && <Spinner label="Loading replies" />}
          {replies.error != null && <ErrorState error={replies.error} onRetry={replies.reload} title="Could not load replies" />}
          <LoadMore hasMore={replies.hasMore} loading={replies.loadingMore} onClick={replies.loadMore} />
        </ul>
      )}
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this comment?" confirmLabel="Delete comment" tone="danger" onConfirm={remove}>
        Replies stay in place and this comment will show as deleted.
      </ConfirmDialog>
    </li>
  );
}

interface ThreadProps {
  workId: string;
  /** Called when the visible total changes, so the engagement bar can stay in sync. */
  onCountChange?: (delta: number) => void;
  canModerate?: boolean;
}

export function CommentThread({ workId, onCountChange, canModerate = false }: ThreadProps) {
  const settings = usePublicSettings();
  const toast = useToast();
  const { status } = useAuth();
  const requireSignIn = useRequireSignIn();

  const list = useCursorList<CommentDto>((cursor, signal) => engagementService.comments(workId, { cursor }, signal), [workId]);

  if (!settings.allowComments) return <p className="muted">Comments are turned off right now.</p>;

  const add = async (content: string) => {
    try {
      const { comment } = await engagementService.addComment(workId, content);
      list.mutate((items) => [comment, ...items]);
      onCountChange?.(1);
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    }
  };

  return (
    <section className="comments" aria-labelledby="comments-title">
      <h2 id="comments-title" className="h3">
        Comments
      </h2>
      {status === "ready" ? (
        <CommentForm placeholder="Add a comment" submitLabel="Post comment" maxLength={settings.maxCommentLength} onSubmit={add} />
      ) : (
        <Button variant="secondary" onClick={() => requireSignIn()}>
          Sign in to comment
        </Button>
      )}
      {list.error != null && <ErrorState error={list.error} onRetry={list.reload} title="Could not load comments" />}
      {!list.error && !list.loading && list.items.length === 0 && <EmptyState icon="comment" title="No comments yet">Be the first to share what this piece meant to you.</EmptyState>}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 22 }}>
        {list.items.map((c) => (
          <CommentItem
            key={c.id}
            workId={workId}
            comment={c}
            maxLength={settings.maxCommentLength}
            canModerate={canModerate}
            onReplied={() => onCountChange?.(1)}
            onDeleted={(d) => {
              list.mutate((items) => updateById(items, d.id, { status: "deleted" }));
              onCountChange?.(-1);
            }}
          />
        ))}
      </ul>
      {list.loading && <Spinner label="Loading comments" />}
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
    </section>
  );
}
