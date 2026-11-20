/**
 * Turns literary text into display blocks. Blank lines separate blocks (stanzas, paragraphs).
 * Single line breaks inside a block are kept, which is what poetry needs.
 */
export function splitBlocks(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.replace(/^\n+|\n+$/g, ""))
    .filter((b) => b.trim().length > 0);
}

export function countWords(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

/** UTF-8 size, matching how the backend measures content. */
export function utf8Length(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** Short lines inside most blocks mean verse. Used to pick poem spacing in the reader. */
export function looksLikePoem(blocks: string[]): boolean {
  if (blocks.length === 0) return false;
  const lined = blocks.filter((b) => b.includes("\n") && b.split("\n").every((l) => l.length <= 70));
  return lined.length / blocks.length >= 0.6;
}
