import { API_BASE_URL } from "@/lib/config";
import { avatarDataUri } from "@/utils/avatar";
import type { PublicProfile, WorkDto } from "@/types/api";

/**
 * Server side helpers for link previews (Open Graph). They only ever read public API endpoints,
 * with no cookies or tokens, so a private or unpublished work looks exactly like a missing one.
 */

async function fetchPublic<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const body = (await res.json()) as { success: boolean; data?: T };
    return body.success ? (body.data ?? null) : null;
  } catch {
    return null; // The page still works, it just gets the generic preview.
  }
}

export const fetchWork = async (id: string): Promise<WorkDto | null> => (await fetchPublic<{ work: WorkDto }>(`/works/${encodeURIComponent(id)}`))?.work ?? null;

export const fetchProfile = async (username: string): Promise<PublicProfile | null> =>
  (await fetchPublic<{ profile: PublicProfile }>(`/users/${encodeURIComponent(username)}`))?.profile ?? null;

/** Collapses whitespace and cuts at a word boundary, adding an ellipsis when something was left out. */
export function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.\-–—]+$/, "")}…`;
}

export const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "I";

/** Fetches a remote picture as a base64 data URI, but only in a format the image renderer reads (PNG, JPEG, GIF). */
async function fetchImageDataUri(url: string, maxBytes: number): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000), next: { revalidate: 3600 } });
    const type = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (res.ok && /^image\/(png|jpeg|gif)$/.test(type)) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length <= maxBytes) return `data:${type};base64,${buf.toString("base64")}`;
    }
  } catch {
    /* unreachable or unreadable: the caller falls back */
  }
  return null;
}

/**
 * Picture of a person for the preview image. Their uploaded photo when it can be fetched in a format the
 * image renderer understands (PNG, JPEG or GIF), otherwise the same Dicebear face they get everywhere in the app.
 */
export async function avatarForCard(photoUrl: string | null, seed: string): Promise<string | null> {
  const photo = photoUrl ? await fetchImageDataUri(photoUrl, 2_000_000) : null;
  return photo ?? toBase64Uri(avatarDataUri(seed));
}

/** Cover photo for the preview image, or null when there is none or it is in a format the renderer cannot read (such as WebP). */
export const coverForCard = async (coverUrl: string | null): Promise<string | null> =>
  coverUrl ? fetchImageDataUri(coverUrl, 4_000_000) : null;

/** The image renderer only reads base64 data URIs. Dicebear's are URL encoded, so convert them. */
function toBase64Uri(uri: string | null): string | null {
  if (!uri || uri.includes(";base64,")) return uri;
  const m = /^data:([^,;]+)(?:;[^,]*)?,(.*)$/s.exec(uri);
  if (!m) return null;
  try {
    let body = decodeURIComponent(m[2]!);
    // The renderer needs an explicit size on the root <svg>; Dicebear only gives a viewBox.
    if (m[1] === "image/svg+xml" && !/<svg[^>]*\swidth=/.test(body)) body = body.replace(/<svg\b/, '<svg width="256" height="256"');
    return `data:${m[1]};base64,${Buffer.from(body, "utf8").toString("base64")}`;
  } catch {
    return null;
  }
}

/** Safe to place inside a <script type="application/ld+json"> tag. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
