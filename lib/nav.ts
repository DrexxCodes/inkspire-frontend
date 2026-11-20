/**
 * True only when `pathname` is the profile page of the signed in user (`username`).
 * Viewing someone else's profile must not light up the "Profile" menu item.
 */
export function isOwnProfilePath(pathname: string, username: string | null | undefined): boolean {
  if (!username) return false;
  const match = /^\/profile\/([^/]+)\/?$/.exec(pathname);
  if (!match) return false;
  try {
    return decodeURIComponent(match[1]!).toLowerCase() === username.toLowerCase();
  } catch {
    return false;
  }
}
