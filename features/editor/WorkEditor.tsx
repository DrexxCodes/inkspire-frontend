"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { worksService } from "@/services/works.service";
import { categoriesService } from "@/services/categories.service";
import { revisionsService } from "@/services/revisions.service";
import { moderationService } from "@/services/moderation.service";
import { promptsService } from "@/services/prompts.service";
import { PLACEMENT_LABEL } from "@/utils/prompt";
import { errorMessage } from "@/lib/api/errors";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/stores/toast-store";
import { utf8Length } from "@/utils/content";
import { formatBytes } from "@/utils/format";
import type { WorkDto } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Banner, ErrorState, Spinner } from "@/components/ui/feedback";
import { SelectField, TextField } from "@/components/ui/fields";
import { ResponsiveSheet } from "@/components/ui/Overlay";
import { ModerationBanner } from "@/components/work/ModerationBanner";
import { EMPTY_FIELDS, canRequestReview, categoryNotice, categoryOptionLabel, fieldsEqual, hasProblems, planSave, statusLabel, validateFields, type EditorFields, type FieldProblems } from "./editor.logic";
import { useAutosave } from "./useAutosave";
import { useEditorLoad } from "./useEditorLoad";
import { usePublicSettings } from "@/hooks/usePublicSettings";

interface Props {
  workId?: string;
  /** Open an older revision for editing. */
  revisionId?: string | null;
  /** Start a new work for this prompt. */
  promptId?: string;
}

export function WorkEditor({ workId, revisionId = null, promptId }: Props) {
  const [tick, setTick] = useState(0);
  const load = useEditorLoad(workId, revisionId, tick);
  if (!workId) return <EditorBody key={`new:${promptId ?? ""}`} promptId={promptId} />;
  if (load.status === "loading") return <div style={{ display: "grid", placeItems: "center", minHeight: "40dvh" }}><Spinner label="Opening your work" /></div>;
  if (load.status === "error") return <ErrorState error={load.error} onRetry={() => setTick((t) => t + 1)} title="We could not open this work" />;
  const d = load.data;
  return <EditorBody key={`${d.work.id}:${d.revision.id}:${tick}`} work={d.work} editingRevisionId={d.revision.id} initial={d.fields} recovered={d.recovered} onReload={() => setTick((t) => t + 1)} />;
}

interface BodyProps {
  promptId?: string;
  work?: WorkDto;
  editingRevisionId?: string;
  initial?: EditorFields;
  recovered?: { fields: EditorFields; updatedAt: string } | null;
  onReload?: () => void;
}

function EditorBody({ promptId: newPromptId, work: initialWork, editingRevisionId = undefined, initial = EMPTY_FIELDS, recovered = null, onReload }: BodyProps) {
  const router = useRouter();
  const toast = useToast();
  const settings = usePublicSettings();
  const cats = useApi((s) => categoriesService.forEditor(s), []);

  const [work, setWork] = useState<WorkDto | undefined>(initialWork);
  // The prompt this work is written for. Its category is fixed, and only an open prompt takes new entries.
  const promptId = work ? work.prompt?.id : newPromptId;
  const promptQ = useApi((s) => promptsService.get(promptId!, s), [promptId], !!promptId);
  const prompt = promptQ.data?.prompt ?? null;
  const [fields, setFields] = useState<EditorFields>(initial);
  const [stored, setStored] = useState<EditorFields>(initial);
  const [problems, setProblems] = useState<FieldProblems>({});
  const [busy, setBusy] = useState<"save" | "publish" | "review" | null>(null);
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [recoverOpen, setRecoverOpen] = useState(!!recovered);
  const [cover, setCover] = useState<string | null>(initialWork?.coverImageUrl ?? null);
  const idempotencyKey = useRef(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));

  // A new work for a prompt starts in the prompt's category.
  useEffect(() => {
    if (prompt && !work) setFields((f) => (f.categoryId === prompt.category.id ? f : { ...f, categoryId: prompt.category.id }));
  }, [prompt, work]);

  const set = <K extends keyof EditorFields>(k: K, v: EditorFields[K]) => {
    setFields((f) => ({ ...f, [k]: v }));
    setProblems((p) => ({ ...p, [k]: undefined }));
  };

  // The autosave baseline is the draft state, so a fresh page load starts clean.
  const [autosaved, setAutosaved] = useState<EditorFields>(initial);
  const autosave = useAutosave({ workId: work?.id, fields, stored: autosaved, basedOnRevisionId: editingRevisionId ?? null, enabled: !!work, onSaved: setAutosaved });
  const unsavedRevision = !fieldsEqual(fields, stored);

  useEffect(() => {
    if (!unsavedRevision) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsavedRevision]);

  // Every active category is listed. The ones the writer cannot post in are shown but cannot be picked.
  const categories = cats.data?.items ?? [];
  const categoryHint = categoryNotice({ loading: cats.loading, error: cats.error != null, items: categories });
  const bytes = useMemo(() => utf8Length(fields.content), [fields.content]);
  const checkpoint = planSave(editingRevisionId ?? null, work?.currentRevisionId) === "ask-checkpoint";
  const reviewable = !!work && canRequestReview(work, unsavedRevision);

  const validate = () => {
    const p = validateFields(fields);
    setProblems(p);
    return !hasProblems(p);
  };

  const finishSave = (updated: WorkDto, message: string) => {
    setWork(updated);
    setStored(fields);
    setAutosaved(fields);
    toast.success(message);
  };

  /** Creates the work on first save, otherwise writes a new revision. */
  const persist = async (opts: { makeCurrent?: boolean; publish?: boolean }) => {
    if (!work) {
      const { work: created } = await worksService.create({ ...fields, promptId: newPromptId, publish: !!opts.publish, idempotencyKey: idempotencyKey.current });
      toast.success(opts.publish ? "Published" : "Draft saved");
      router.replace(`/write/${created.id}`);
      return;
    }
    const res = await revisionsService.save(work.id, {
      ...fields,
      changeReason: reason.trim() || undefined,
      makeCurrent: opts.makeCurrent ?? true,
      basedOnRevisionId: editingRevisionId,
      publish: opts.publish,
    });
    finishSave(res.work, res.revision.madeCurrent ? `Saved as version ${res.revision.revisionNumber}` : `Saved as version ${res.revision.revisionNumber}, not current`);
    setReason("");
    if (!res.revision.madeCurrent) router.replace(`/write/${work.id}`);
  };

  const run = async (kind: "save" | "publish", fn: () => Promise<void>) => {
    if (!validate()) return;
    setBusy(kind);
    try {
      await fn();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const onSave = () => {
    if (checkpoint) {
      if (validate()) setCheckpointOpen(true);
      return;
    }
    void run("save", () => persist({}));
  };

  const onPublish = () =>
    run("publish", async () => {
      if (!work || work.status === "published") return persist({ publish: true });
      if (unsavedRevision) await persist({ publish: true });
      else {
        const res = await worksService.publish(work.id);
        setWork(res.work);
        toast.success("Published");
      }
    });

  const onRequestReview = async () => {
    if (!work?.currentRevisionId) return;
    setBusy("review");
    try {
      await moderationService.requestReview(work.id, work.currentRevisionId);
      toast.success("Review requested");
      onReload?.();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const onCover = async (file: File | undefined) => {
    if (!file || !work) return;
    try {
      const { url } = await worksService.uploadCover(work.id, file);
      setCover(url);
      toast.success("Cover updated");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const onDetach = async () => {
    if (!work) return;
    try {
      const res = await worksService.detachPrompt(work.id);
      setWork(res.work);
      toast.success("Removed from the prompt");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const canPublish = !work || work.status === "draft";

  return (
    <div className="editor">
      {work && <ModerationBanner work={work} />}
      {promptId && (
        <Banner
          tone={prompt && prompt.phase !== "open" ? "warn" : "info"}
          icon="trophy"
          title={`Writing for the prompt: ${prompt?.title ?? work?.prompt?.title ?? "…"}`}
          actions={
            work?.prompt && !work.prompt.placement ? (
              <Button size="sm" variant="secondary" onClick={onDetach}>
                Remove from prompt
              </Button>
            ) : undefined
          }
        >
          {work?.prompt?.placement
            ? `This work won ${PLACEMENT_LABEL[work.prompt.placement]}.`
            : prompt && prompt.phase !== "open"
              ? "This prompt is not open for new entries, so this work cannot be published to it."
              : prompt
                ? `Stay in ${prompt.category.name}. Entries must be published before the prompt closes.`
                : "Loading the prompt."}
        </Banner>
      )}
      {checkpoint && (
        <Banner tone="info" icon="history" title="You are editing an older version">
          Saving creates a new version that will not become current unless you choose to make it current. Readers keep seeing the current version.
        </Banner>
      )}
      {recoverOpen && recovered && (
        <Banner
          tone="info"
          icon="refresh"
          title="We found unsaved changes"
          actions={
            <>
              <Button size="sm" onClick={() => { setFields(recovered.fields); setRecoverOpen(false); }}>
                Use them
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setRecoverOpen(false)}>
                Discard
              </Button>
            </>
          }
        >
          Your last session autosaved a draft that differs from the saved version.
        </Banner>
      )}

      <div className="editor__bar">
        <Link href={work ? `/works/${work.id}` : "/write"} className="btn btn--ghost btn--sm">
          Back
        </Link>
        <span className="editor__status" role="status">
          {work ? statusLabel(autosave.state, autosave.savedAt) : unsavedRevision ? "Not saved yet" : ""}
        </span>
        <span className="spacer" />
        {work && (
          <Link href={`/write/${work.id}/history`} className="btn btn--ghost btn--sm">
            History
          </Link>
        )}
        <Button variant="secondary" size="sm" loading={busy === "save"} onClick={onSave} disabled={!unsavedRevision && !!work}>
          {work ? "Save version" : "Save draft"}
        </Button>
        {canPublish && (
          <Button size="sm" loading={busy === "publish"} onClick={onPublish}>
            Publish
          </Button>
        )}
        {reviewable && (
          <Button size="sm" loading={busy === "review"} onClick={onRequestReview}>
            Request review
          </Button>
        )}
      </div>

      <label className="visually-hidden" htmlFor="ed-title">Title</label>
      <input id="ed-title" className="editor__title" placeholder="Title" value={fields.title} onChange={(e) => set("title", e.target.value)} maxLength={150} aria-invalid={!!problems.title} />
      {problems.title && <p className="field__error" role="alert">{problems.title}</p>}

      <label className="visually-hidden" htmlFor="ed-desc">Short description</label>
      <textarea id="ed-desc" className="editor__desc" placeholder="A line to introduce it (optional)" rows={2} value={fields.description} onChange={(e) => set("description", e.target.value)} maxLength={300} />

      <div className="editor__options">
        <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
          <SelectField label="Category" value={fields.categoryId} onChange={(e) => set("categoryId", e.target.value)} error={problems.categoryId} hint={prompt ? `Fixed by the prompt: ${prompt.category.name}` : categoryHint} disabled={!!prompt}>
            <option value="">{cats.loading ? "Loading categories…" : "Choose a category"}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} disabled={!c.canPost && c.id !== fields.categoryId}>
                {categoryOptionLabel(c)}
              </option>
            ))}
          </SelectField>
          {cats.error != null && (
            <Button size="sm" variant="secondary" icon="refresh" onClick={cats.reload}>
              Try again
            </Button>
          )}
        </div>
        <div className="field">
          <span className="field__label">Cover image</span>
          {work ? (
            <label className="btn btn--secondary" style={{ cursor: "pointer" }}>
              {cover ? "Replace cover" : "Add cover"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="visually-hidden" onChange={(e) => onCover(e.target.files?.[0])} />
            </label>
          ) : (
            <span className="field__hint">Save a draft first, then add a cover.</span>
          )}
        </div>
      </div>

      <label className="visually-hidden" htmlFor="ed-body">Your writing</label>
      <textarea id="ed-body" className="editor__body" placeholder="Start writing" value={fields.content} onChange={(e) => set("content", e.target.value)} aria-invalid={!!problems.content} spellCheck />
      {problems.content && <p className="field__error" role="alert">{problems.content}</p>}

      <div className="editor__meta">
        <span>{fields.content.trim() ? fields.content.trim().split(/\s+/).length : 0} words</span>
        <span>{formatBytes(bytes)} of {formatBytes(settings.maxWorkSizeBytes)}</span>
      </div>

      <ResponsiveSheet open={checkpointOpen} onClose={() => setCheckpointOpen(false)} title="Save from an older version">
        <div style={{ display: "grid", gap: 16 }}>
          <p>This edit starts from an older version, so it will not become the current version automatically. Readers will keep seeing what they see now.</p>
          <TextField label="What changed? (optional)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} />
          <Button
            variant="secondary"
            block
            loading={busy === "save"}
            onClick={() => run("save", async () => { await persist({ makeCurrent: false }); setCheckpointOpen(false); })}
          >
            Save without making it current
          </Button>
          <Button block loading={busy === "save"} onClick={() => run("save", async () => { await persist({ makeCurrent: true }); setCheckpointOpen(false); })}>
            Save and make it current
          </Button>
        </div>
      </ResponsiveSheet>
    </div>
  );
}
