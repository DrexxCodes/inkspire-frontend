/** Only allow same site relative paths after sign in, so a crafted link cannot redirect elsewhere. */
export function safeNext(value: string | null | undefined, fallback = "/discover"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.startsWith("/auth")) return fallback;
  return value;
}
