export type DiffOp = { type: "equal" | "add" | "remove"; text: string };

export interface DiffRow {
  kind: "equal" | "changed" | "added" | "removed";
  left: string | null;
  right: string | null;
}

/** Above this many cells the exact diff is skipped to keep the UI responsive. */
const MAX_CELLS = 4_000_000;

/**
 * Line level diff using a longest common subsequence. The shared head and tail are trimmed
 * first, which keeps typical edits (a few changed lines in a long work) very cheap.
 */
export function diffLines(a: string[], b: string[]): DiffOp[] {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const head: DiffOp[] = a.slice(0, start).map((text) => ({ type: "equal", text }));
  const tail: DiffOp[] = a.slice(endA).map((text) => ({ type: "equal", text }));
  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);

  let middle: DiffOp[];
  if (midA.length === 0) middle = midB.map((text) => ({ type: "add", text }));
  else if (midB.length === 0) middle = midA.map((text) => ({ type: "remove", text }));
  else if (midA.length * midB.length > MAX_CELLS) {
    middle = [...midA.map((text) => ({ type: "remove" as const, text })), ...midB.map((text) => ({ type: "add" as const, text }))];
  } else middle = lcsDiff(midA, midB);

  return [...head, ...middle, ...tail];
}

function lcsDiff(a: string[], b: string[]): DiffOp[] {
  const n = a.length;
  const m = b.length;
  const w = m + 1;
  const table = new Uint32Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * w + j] = a[i] === b[j] ? table[(i + 1) * w + j + 1]! + 1 : Math.max(table[(i + 1) * w + j]!, table[i * w + j + 1]!);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "equal", text: a[i]! });
      i++;
      j++;
    } else if (table[(i + 1) * w + j]! >= table[i * w + j + 1]!) {
      ops.push({ type: "remove", text: a[i++]! });
    } else {
      ops.push({ type: "add", text: b[j++]! });
    }
  }
  while (i < n) ops.push({ type: "remove", text: a[i++]! });
  while (j < m) ops.push({ type: "add", text: b[j++]! });
  return ops;
}

export const splitLines = (text: string) => text.replace(/\r\n/g, "\n").split("\n");

export function diffText(before: string, after: string): DiffOp[] {
  return diffLines(splitLines(before), splitLines(after));
}

/** Pairs removed and added runs so changes line up side by side. */
export function toSideBySide(ops: DiffOp[]): DiffRow[] {
  const rows: DiffRow[] = [];
  let i = 0;
  while (i < ops.length) {
    const op = ops[i]!;
    if (op.type === "equal") {
      rows.push({ kind: "equal", left: op.text, right: op.text });
      i++;
      continue;
    }
    const removed: string[] = [];
    const added: string[] = [];
    while (i < ops.length && ops[i]!.type !== "equal") {
      (ops[i]!.type === "remove" ? removed : added).push(ops[i]!.text);
      i++;
    }
    const len = Math.max(removed.length, added.length);
    for (let k = 0; k < len; k++) {
      const left = removed[k] ?? null;
      const right = added[k] ?? null;
      rows.push({ kind: left !== null && right !== null ? "changed" : left !== null ? "removed" : "added", left, right });
    }
  }
  return rows;
}

export function diffStats(ops: DiffOp[]) {
  return ops.reduce(
    (s, o) => {
      if (o.type === "add") s.added++;
      else if (o.type === "remove") s.removed++;
      return s;
    },
    { added: 0, removed: 0 },
  );
}
