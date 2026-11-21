import test from "node:test";
import assert from "node:assert/strict";
import { canRequestReview, categoryNotice, categoryOptionLabel, fieldsEqual, hasProblems, isEditingCheckpoint, planSave, statusLabel, validateFields } from "../features/editor/editor.logic.ts";

const ok = { title: "T", description: "", categoryId: "c1", content: "Body" };

test("validateFields flags the missing pieces", () => {
  assert.equal(hasProblems(validateFields(ok)), false);
  const p = validateFields({ title: " ", description: "", categoryId: "", content: "  " });
  assert.ok(p.title && p.categoryId && p.content);
  assert.ok(validateFields({ ...ok, title: "x".repeat(151) }).title);
});

test("fieldsEqual compares every field", () => {
  assert.equal(fieldsEqual(ok, { ...ok }), true);
  assert.equal(fieldsEqual(ok, { ...ok, content: "Body!" }), false);
});

test("editing a non current checkpoint asks first", () => {
  assert.equal(isEditingCheckpoint("r1", "r3"), true);
  assert.equal(isEditingCheckpoint("r3", "r3"), false);
  assert.equal(isEditingCheckpoint(null, "r3"), false);
  assert.equal(planSave("r1", "r3"), "ask-checkpoint");
  assert.equal(planSave("r3", "r3"), "save");
});

test("review can be requested only for a clean, flagged work", () => {
  assert.equal(canRequestReview({ status: "flagged", moderationStatus: "flagged" }, false), true);
  assert.equal(canRequestReview({ status: "flagged", moderationStatus: "rejected" }, false), true);
  assert.equal(canRequestReview({ status: "flagged", moderationStatus: "flagged" }, true), false);
  assert.equal(canRequestReview({ status: "flagged", moderationStatus: "underReview" }, false), false);
  assert.equal(canRequestReview({ status: "published", moderationStatus: "clean" }, false), false);
});

test("statusLabel", () => {
  assert.equal(statusLabel("idle", null), "");
  assert.equal(statusLabel("dirty", null), "Unsaved changes");
  assert.match(statusLabel("saved", new Date()), /Draft saved at/);
});

const cat = (id: string, canPost: boolean) => ({ id, name: id.toUpperCase(), slug: id, description: "", imageUrl: null, isActive: true, canPost });

test("categories the writer cannot post in stay listed and are labelled", () => {
  assert.equal(categoryOptionLabel(cat("poetry", true)), "POETRY");
  assert.equal(categoryOptionLabel(cat("drama", false)), "DRAMA (no access)");
});

test("the category notice explains why nothing can be chosen", () => {
  assert.equal(categoryNotice({ loading: true, error: false, items: [] }), undefined);
  assert.match(categoryNotice({ loading: false, error: true, items: [] }) ?? "", /Could not load/);
  assert.match(categoryNotice({ loading: false, error: false, items: [] }) ?? "", /No categories/);
  assert.match(categoryNotice({ loading: false, error: false, items: [cat("a", false), cat("b", false)] }) ?? "", /cannot post in any category/);
  assert.equal(categoryNotice({ loading: false, error: false, items: [cat("a", false), cat("b", true)] }), undefined);
});
