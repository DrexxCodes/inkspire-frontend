import { test } from "node:test";
import assert from "node:assert/strict";
import { formatBytes, formatCount, formatDate, humanizeAction, initials, readingMinutes, timeAgo } from "../utils/format";
import { diffLines, diffStats, diffText, toSideBySide } from "../utils/diff";
import { mergePage, removeById, updateById } from "../utils/list";
import { countWords, splitBlocks, utf8Length } from "../utils/content";
import { shareIntentUrl } from "../utils/share";
import { SERIES_COLORS, TINTS, tintFor } from "../utils/colors";

test("formatCount", () => {
  assert.equal(formatCount(0), "0");
  assert.equal(formatCount(999), "999");
  assert.equal(formatCount(1000), "1k");
  assert.equal(formatCount(1234), "1.2k");
  assert.equal(formatCount(15_300), "15k");
  assert.equal(formatCount(2_400_000), "2.4M");
  assert.equal(formatCount(-5), "0");
  assert.equal(formatCount(Number.NaN), "0");
});

test("formatDate matches the revision history style and handles bad input", () => {
  assert.equal(formatDate("2026-11-16T10:00:00Z", "UTC"), "Nov 16, 2026");
  assert.equal(formatDate("2026-11-08T10:00:00Z", "UTC"), "Nov 08, 2026");
  assert.equal(formatDate(null), "");
  assert.equal(formatDate("not a date"), "");
});

test("timeAgo", () => {
  const now = Date.parse("2026-11-16T12:00:00Z");
  assert.equal(timeAgo("2026-11-16T11:59:50Z", now), "just now");
  assert.equal(timeAgo("2026-11-16T11:30:00Z", now), "30m ago");
  assert.equal(timeAgo("2026-11-16T09:00:00Z", now), "3h ago");
  assert.equal(timeAgo("2026-11-14T12:00:00Z", now), "2d ago");
  assert.equal(timeAgo("2026-10-01T12:00:00Z", now, "UTC"), "Oct 01, 2026");
});

test("reading time, bytes and initials", () => {
  assert.equal(readingMinutes(10), 1);
  assert.equal(readingMinutes(1311 * 10), 10);
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(2048), "2.0 KB");
  assert.equal(formatBytes(5 * 1024 * 1024), "5.0 MB");
  assert.equal(initials("Ada Lovelace King"), "AK");
  assert.equal(initials("  "), "?");
  assert.equal(humanizeAction("USER_ROLE_CHANGED"), "User role changed");
});

test("diffLines finds additions, removals and keeps unchanged lines", () => {
  const ops = diffLines(["a", "b", "c", "d"], ["a", "x", "c", "d", "e"]);
  assert.deepEqual(diffStats(ops), { added: 2, removed: 1 });
  assert.deepEqual(
    ops.filter((o) => o.type === "equal").map((o) => o.text),
    ["a", "c", "d"],
  );
});

test("diff of identical text has no changes, and of empty text is all additions", () => {
  assert.deepEqual(diffStats(diffText("same\nlines", "same\nlines")), { added: 0, removed: 0 });
  assert.deepEqual(diffStats(diffText("", "one\ntwo")), { added: 2, removed: 1 }); // "" counts as one empty line
});

test("applying the diff to the old text reproduces the new text", () => {
  const before = "one\ntwo\nthree\nfour\nfive";
  const after = "one\nTWO\nthree\nfive\nsix\nseven";
  const rebuilt = diffText(before, after)
    .filter((o) => o.type !== "remove")
    .map((o) => o.text)
    .join("\n");
  assert.equal(rebuilt, after);
  const restored = diffText(before, after)
    .filter((o) => o.type !== "add")
    .map((o) => o.text)
    .join("\n");
  assert.equal(restored, before);
});

test("side by side pairs a replaced line as one changed row", () => {
  const rows = toSideBySide(diffText("a\nold\nc", "a\nnew\nc"));
  assert.deepEqual(
    rows.map((r) => r.kind),
    ["equal", "changed", "equal"],
  );
  assert.equal(rows[1]!.left, "old");
  assert.equal(rows[1]!.right, "new");
  const extra = toSideBySide(diffText("a", "a\nb"));
  assert.equal(extra[1]!.kind, "added");
  assert.equal(extra[1]!.left, null);
});

test("diff stays fast on a long work with a small edit", () => {
  const lines = Array.from({ length: 50_000 }, (_, i) => `line ${i}`);
  const edited = lines.slice();
  edited[25_000] = "changed";
  const t = Date.now();
  const stats = diffStats(diffLines(lines, edited));
  assert.deepEqual(stats, { added: 1, removed: 1 });
  assert.ok(Date.now() - t < 1000);
});

test("mergePage dedupes overlapping pages and keeps order", () => {
  const merged = mergePage([{ id: "a" }, { id: "b" }], [{ id: "b" }, { id: "c" }]);
  assert.deepEqual(merged.map((i) => i.id), ["a", "b", "c"]);
  assert.deepEqual(removeById(merged, "b").map((i) => i.id), ["a", "c"]);
  const updated = updateById([{ id: "a", n: 1 }], "a", (i) => ({ ...i, n: i.n + 1 }));
  assert.equal(updated[0]!.n, 2);
});

test("splitBlocks keeps stanza line breaks and drops empty blocks", () => {
  const blocks = splitBlocks("Roses are red\nViolets are blue\n\n\n\nSecond stanza\r\n\r\n   \n\nThird");
  assert.deepEqual(blocks, ["Roses are red\nViolets are blue", "Second stanza", "Third"]);
  assert.deepEqual(splitBlocks(""), []);
});

test("word count and UTF-8 length mirror the backend's byte measure", () => {
  assert.equal(countWords("  hello   brave new\nworld "), 4);
  assert.equal(countWords(""), 0);
  assert.equal(utf8Length("abc"), 3);
  assert.equal(utf8Length("é"), 2);
  assert.equal(utf8Length("😀"), 4);
  assert.equal(utf8Length("你好"), 6);
});

test("share intents encode the title and url, and non web targets return null", () => {
  const url = "https://inkspire.app/works/abc?x=1&y=2";
  assert.ok(shareIntentUrl("x", url, "A & B")!.includes("text=A%20%26%20B"));
  assert.ok(shareIntentUrl("whatsapp", url, "T")!.startsWith("https://wa.me/?text="));
  assert.ok(shareIntentUrl("telegram", url, "T")!.includes(encodeURIComponent(url)));
  assert.ok(shareIntentUrl("facebook", url, "T")!.includes(encodeURIComponent(url)));
  assert.equal(shareIntentUrl("copy_link", url, "T"), null);
  assert.equal(shareIntentUrl("native_share", url, "T"), null);
});

test("tints are stable per key and chart colours keep their validated order", () => {
  assert.equal(tintFor("work-1"), tintFor("work-1"));
  assert.ok(TINTS.includes(tintFor("anything")));
  assert.deepEqual([...SERIES_COLORS], ["#1f5fe0", "#c4700d", "#13917f", "#a64ac9"]);
});

import { looksLikePoem } from "../utils/content.ts";

test("looksLikePoem tells verse from prose", () => {
  assert.equal(looksLikePoem(["Roses are red\nViolets are blue", "Sugar is sweet\nAnd so are you"]), true);
  assert.equal(looksLikePoem(["A long paragraph of prose that goes on and on without any line breaks at all, which is typical."]), false);
  assert.equal(looksLikePoem([]), false);
});
