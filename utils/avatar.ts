import { createAvatar } from "@dicebear/core";
import * as lorelei from "@dicebear/lorelei";

/**
 * Same style and options as the backend (src/services/avatar.service.ts), so a seed gives the
 * same face on the server and in the browser. Generated locally: no network request, and it
 * works even if object storage is down or the avatar was never uploaded.
 */
const BACKGROUNDS = ["dbe7ff", "e9defa", "ffe9c7", "d6f5e3", "fde0e0"];
const MAX_CACHED = 400;
const cache = new Map<string, string>();

export function avatarDataUri(seed: string): string | null {
  const key = seed.trim();
  if (!key) return null;
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const uri = createAvatar(lorelei, { seed: key, radius: 50, backgroundColor: BACKGROUNDS }).toDataUri();
    if (cache.size >= MAX_CACHED) cache.clear();
    cache.set(key, uri);
    return uri;
  } catch {
    return null;
  }
}
