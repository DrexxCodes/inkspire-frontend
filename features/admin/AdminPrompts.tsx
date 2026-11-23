"use client";

import { useState } from "react";
import { adminPromptsService, type WinnerPick } from "@/services/prompts.service";
import { categoriesService } from "@/services/categories.service";
import { errorMessage } from "@/lib/api/errors";
import { useApi } from "@/hooks/useApi";
import { useCursorList } from "@/hooks/useCursorList";
import { useToast } from "@/stores/toast-store";
import { formatDateTime } from "@/utils/format";
import { PHASE_LABEL, PLACEMENT_LABEL, fromLocalInput, toLocalInput, weekWindow } from "@/utils/prompt";
import type { PromptDto, WorkDto } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, LoadMore, Spinner } from "@/components/ui/feedback";
import { SelectField, TextAreaField, TextField } from "@/components/ui/fields";
import { ResponsiveSheet } from "@/components/ui/Overlay";

interface Draft {
  id?: string;
  title: string;
  description: string;
  categoryId: string;
  startsAt: string;
  endsAt: string;
  max: string;
  entriesLocked: boolean;
}

const blank = (): Draft => {
  const w = weekWindow();
  return { title: "", description: "", categoryId: "", startsAt: w.start, endsAt: w.end, max: "1", entriesLocked: false };
};

export function AdminPrompts() {
  const toast = useToast();
  const list = useCursorList<PromptDto>((cursor, signal) => adminPromptsService.list({ cursor }, signal), []);
  const cats = useApi((s) => categoriesService.listAll(s), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<PromptDto | null>(null);
  const [judging, setJudging] = useState<PromptDto | null>(null);

  const edit = (p: PromptDto) => {
    setError(null);
    setDraft({
      id: p.id,
      title: p.title,
      description: p.description,
      categoryId: p.category.id,
      startsAt: toLocalInput(p.startsAt),
      endsAt: toLocalInput(p.endsAt),
      max: String(p.maxEntriesPerUser),
      entriesLocked: p.entryCount > 0,
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (draft.title.trim().length < 3) return setError("Give the prompt a title.");
    if (!draft.categoryId) return setError("Choose a category.");
    if (!draft.startsAt || !draft.endsAt) return setError("Set when it opens and closes.");
    if (new Date(draft.endsAt) <= new Date(draft.startsAt)) return setError("It has to close after it opens.");
    const max = Number(draft.max);
    if (!Number.isInteger(max) || max < 1 || max > 10) return setError("Entries per writer: 1 to 10.");
    setBusy(true);
    setError(null);
    try {
      const body = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        categoryId: draft.categoryId,
        startsAt: fromLocalInput(draft.startsAt),
        endsAt: fromLocalInput(draft.endsAt),
        maxEntriesPerUser: max,
      };
      if (draft.id) await adminPromptsService.update(draft.id, body);
      else await adminPromptsService.create(body);
      toast.success(draft.id ? "Prompt updated" : "Prompt created as a draft");
      setDraft(null);
      list.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const act = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      toast.success(done);
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (list.loading) return <Spinner label="Loading prompts" />;
  if (list.error != null && list.items.length === 0) return <ErrorState error={list.error} onRetry={list.reload} />;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <Button icon="plus" onClick={() => { setError(null); setDraft(blank()); }}>
          New prompt
        </Button>
      </div>
      {list.items.length === 0 && <EmptyState icon="trophy" title="No prompts yet">Create one for this week. It stays a draft until you publish it.</EmptyState>}

      <div className="table-wrap table-wrap--stack">
        <table className="table table--stack">
          <thead>
            <tr>
              <th>Prompt</th>
              <th>State</th>
              <th>Window</th>
              <th>Entries</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.items.map((p) => (
              <tr key={p.id}>
                <td data-label="">
                  <div style={{ fontWeight: 700 }}>{p.title}</div>
                  <div className="small muted">{p.category.name}</div>
                </td>
                <td data-label="State">
                  {p.status === "draft" ? "Draft" : PHASE_LABEL[p.phase]}
                </td>
                <td data-label="Window" className="small">
                  {formatDateTime(p.startsAt)} to {formatDateTime(p.endsAt)}
                </td>
                <td data-label="Entries">{p.entryCount}</td>
                <td data-label="" className="cell--actions">
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Button size="sm" variant="secondary" onClick={() => edit(p)}>Edit</Button>
                    {p.status === "draft" && <Button size="sm" onClick={() => act(() => adminPromptsService.publish(p.id), "Published")}>Publish</Button>}
                    {p.status === "published" && p.entryCount === 0 && p.phase !== "completed" && (
                      <Button size="sm" variant="ghost" onClick={() => act(() => adminPromptsService.unpublish(p.id), "Moved back to draft")}>Unpublish</Button>
                    )}
                    {(p.phase === "judging" || p.phase === "completed") && (
                      <Button size="sm" onClick={() => setJudging(p)}>{p.phase === "completed" ? "Winners" : "Pick winners"}</Button>
                    )}
                    {p.entryCount === 0 && <Button size="sm" variant="ghost" onClick={() => setRemoving(p)}>Delete</Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />

      <ResponsiveSheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? "Edit prompt" : "New prompt"}>
        {draft && (
          <form onSubmit={save} noValidate style={{ display: "grid", gap: 16 }}>
            <TextField label="Prompt" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={140} placeholder="Write about a door that should have stayed closed" />
            <TextAreaField label="Details (optional)" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={2000} />
            <SelectField
              label="Category"
              value={draft.categoryId}
              onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
              disabled={draft.entriesLocked}
              hint={draft.entriesLocked ? "Locked: writers already have entries." : "Entries have to be written in this category."}
            >
              <option value="">Choose a category</option>
              {(cats.data?.items ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
            <TextField label="Opens" type="datetime-local" value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} />
            <TextField label="Closes" type="datetime-local" value={draft.endsAt} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })} hint="Times are in your time zone." />
            <TextField label="Entries per writer" type="number" min={1} max={10} value={draft.max} onChange={(e) => setDraft({ ...draft, max: e.target.value })} error={error} />
            <Button type="submit" block loading={busy}>Save prompt</Button>
          </form>
        )}
      </ResponsiveSheet>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Delete "${removing?.title ?? "prompt"}"?`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={async () => {
          if (!removing) return;
          await adminPromptsService.remove(removing.id);
          toast.success("Prompt deleted");
          list.reload();
        }}
      >
        Prompts that already have entries cannot be deleted.
      </ConfirmDialog>

      <WinnerPicker prompt={judging} onClose={() => setJudging(null)} onSaved={() => { setJudging(null); list.reload(); }} />
    </div>
  );
}

/** Choose up to three winners from the published entries. Saving the first time announces them. */
function WinnerPicker({ prompt, onClose, onSaved }: { prompt: PromptDto | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [seeded, setSeeded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = prompt?.id;
  const list = useCursorList<WorkDto>((cursor, signal) => adminPromptsService.entries(id!, { cursor, sort: "popular" }, signal), [id], !!id);

  if (prompt && seeded !== prompt.id) {
    setSeeded(prompt.id);
    setPicks(Object.fromEntries(prompt.winners.map((w) => [w.work.id, w.placement])));
    setNotes(Object.fromEntries(prompt.winners.map((w) => [w.work.id, w.note ?? ""])));
  }

  const setPlace = (workId: string, place: string) =>
    setPicks((cur) => {
      const next = { ...cur };
      const n = Number(place);
      if (!n) delete next[workId];
      else {
        for (const k of Object.keys(next)) if (next[k] === n) delete next[k]; // a placement belongs to one work
        next[workId] = n;
      }
      return next;
    });

  const save = async () => {
    if (!prompt) return;
    const winners: WinnerPick[] = Object.entries(picks).map(([workId, placement]) => ({ workId, placement, note: notes[workId]?.trim() || undefined }));
    if (winners.length === 0) return toast.error("Pick at least one winner.");
    setBusy(true);
    try {
      await adminPromptsService.setWinners(prompt.id, winners);
      toast.success(prompt.winnersAnnouncedAt ? "Winners updated" : "Winners announced");
      onSaved();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResponsiveSheet open={!!prompt} onClose={onClose} title={prompt ? `Winners: ${prompt.title}` : "Winners"}>
      {prompt && (
        <div style={{ display: "grid", gap: 12 }}>
          <p className="small muted">
            {prompt.winnersAnnouncedAt ? "Winners are public. Saving replaces them." : "Saving announces the winners and notifies them."} Only published, public entries can win.
          </p>
          {list.loading && <Spinner label="Loading entries" />}
          {list.error != null && <ErrorState error={list.error} onRetry={list.reload} />}
          {!list.loading && list.items.length === 0 && <EmptyState icon="pen" title="No entries to judge" />}
          {list.items.map((w) => (
            <div key={w.id} className="pick">
              <div className="pick__row">
                <div className="grow">
                  <a href={`/works/${w.id}`} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>{w.title}</a>
                  <div className="small muted">by {w.author.displayName} · {w.likeCount} likes · {w.viewCount} reads</div>
                </div>
                <SelectField label="Place" hideLabel value={String(picks[w.id] ?? "")} onChange={(e) => setPlace(w.id, e.target.value)}>
                  <option value="">Not placed</option>
                  {[1, 2, 3].map((n) => <option key={n} value={n}>{PLACEMENT_LABEL[n]}</option>)}
                </SelectField>
              </div>
              {picks[w.id] && (
                <TextField label="Note (optional)" value={notes[w.id] ?? ""} onChange={(e) => setNotes({ ...notes, [w.id]: e.target.value })} maxLength={500} />
              )}
            </div>
          ))}
          <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
          <Button block loading={busy} onClick={save}>{prompt.winnersAnnouncedAt ? "Update winners" : "Announce winners"}</Button>
        </div>
      )}
    </ResponsiveSheet>
  );
}
