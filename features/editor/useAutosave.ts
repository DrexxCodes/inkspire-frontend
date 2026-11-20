"use client";

import { useEffect, useRef, useState } from "react";
import { AUTOSAVE_DELAY_MS } from "@/lib/config";
import { revisionsService } from "@/services/revisions.service";
import { fieldsEqual, type EditorFields, type SaveState } from "./editor.logic";

interface Options {
  workId: string | undefined;
  fields: EditorFields;
  /** What is already stored (last saved revision or last autosave). Autosave only runs when different. */
  stored: EditorFields;
  basedOnRevisionId: string | null;
  enabled: boolean;
  onSaved?: (fields: EditorFields) => void;
}

/**
 * Debounced autosave into the draft state. This never creates a revision, so history only
 * contains versions the author chose to save.
 */
export function useAutosave({ workId, fields, stored, basedOnRevisionId, enabled, onSaved }: Options) {
  const [state, setState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const latest = useRef({ fields, basedOnRevisionId, onSaved });
  latest.current = { fields, basedOnRevisionId, onSaved };
  const inflight = useRef(false);

  const dirty = !fieldsEqual(fields, stored);
  const ready = !!fields.title.trim() && !!fields.categoryId && !!fields.content.trim();

  useEffect(() => {
    if (!enabled || !workId) return;
    if (!dirty) {
      setState((s) => (s === "saving" ? s : savedAt ? "saved" : "idle"));
      return;
    }
    setState((s) => (s === "saving" ? s : "dirty"));
    if (!ready) return;
    const timer = setTimeout(async () => {
      if (inflight.current) return;
      inflight.current = true;
      const snapshot = latest.current.fields;
      setState("saving");
      try {
        await revisionsService.autosave(workId, { ...snapshot, basedOnRevisionId: latest.current.basedOnRevisionId ?? undefined });
        setSavedAt(new Date());
        setState("saved");
        latest.current.onSaved?.(snapshot);
      } catch {
        setState("error");
      } finally {
        inflight.current = false;
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, workId, dirty, ready, fields.title, fields.description, fields.categoryId, fields.content]);

  return { state, savedAt, dirty };
}
