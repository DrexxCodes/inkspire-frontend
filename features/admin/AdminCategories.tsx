"use client";

import { useState } from "react";
import { categoriesService } from "@/services/categories.service";
import { errorMessage } from "@/lib/api/errors";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/stores/toast-store";
import type { CategoryDto } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/feedback";
import { Switch, TextAreaField, TextField } from "@/components/ui/fields";
import { ResponsiveSheet } from "@/components/ui/Overlay";

interface Draft {
  id?: string;
  name: string;
  description: string;
  isActive: boolean;
}
const BLANK: Draft = { name: "", description: "", isActive: true };

export function AdminCategories() {
  const toast = useToast();
  const cats = useApi((s) => categoriesService.listAll(s), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<CategoryDto | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.name.trim()) return setError("Enter a name.");
    setBusy(true);
    setError(null);
    try {
      const body = { name: draft.name.trim(), description: draft.description.trim(), isActive: draft.isActive };
      if (draft.id) await categoriesService.update(draft.id, body);
      else await categoriesService.create(body);
      toast.success(draft.id ? "Category updated" : "Category created");
      setDraft(null);
      cats.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (c: CategoryDto, isActive: boolean) => {
    try {
      await categoriesService.update(c.id, { isActive });
      cats.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (cats.loading) return <Spinner label="Loading categories" />;
  if (cats.error != null) return <ErrorState error={cats.error} onRetry={cats.reload} />;
  const items = cats.data?.items ?? [];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <Button icon="plus" onClick={() => { setError(null); setDraft(BLANK); }}>
          New category
        </Button>
      </div>
      {items.length === 0 && <EmptyState icon="tag" title="No categories yet">Writers need at least one category to publish.</EmptyState>}
      <div className="table-wrap">
        <table className="table table--stack">
          <thead>
            <tr>
              <th>Name</th>
              <th>Published</th>
              <th>Visible</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  <div className="small muted">{c.description}</div>
                </td>
                <td>{c.publishedCount ?? 0}</td>
                <td>
                  <Switch label={`${c.name} visible`} checked={c.isActive !== false} onChange={(v) => toggle(c, v)} />
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button size="sm" variant="secondary" onClick={() => { setError(null); setDraft({ id: c.id, name: c.name, description: c.description, isActive: c.isActive !== false }); }}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRemoving(c)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ResponsiveSheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? "Edit category" : "New category"}>
        {draft && (
          <form onSubmit={save} noValidate style={{ display: "grid", gap: 16 }}>
            <TextField label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={40} error={error} />
            <TextAreaField label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={200} />
            <Switch label="Visible to writers and readers" checked={draft.isActive} onChange={(v) => setDraft({ ...draft, isActive: v })} />
            <Button type="submit" block loading={busy}>
              Save category
            </Button>
          </form>
        )}
      </ResponsiveSheet>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Delete ${removing?.name ?? "category"}?`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={async () => {
          if (!removing) return;
          await categoriesService.remove(removing.id);
          toast.success("Category deleted");
          cats.reload();
        }}
      >
        Categories that still contain works cannot be deleted. Hide them instead.
      </ConfirmDialog>
    </div>
  );
}
