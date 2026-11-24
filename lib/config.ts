/**
 * Public configuration only. NEXT_PUBLIC_* values are bundled into the browser, so nothing
 * secret may ever be read here. Each variable is referenced statically so Next can inline it.
 */
const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export const API_BASE_URL = `${base}/api/v1`;

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const SITE_NAME = "Inkspire";
export const AUTOSAVE_DELAY_MS = 2500;
/** How long someone must stop typing before we ask the API whether a username is free. */
export const USERNAME_CHECK_DELAY_MS = 5000;

/**
 * The public address of this site, used to build absolute links for link previews (Open Graph).
 * Set NEXT_PUBLIC_SITE_URL in production (for example https://inkspire.example). Without it we fall
 * back to the Vercel address, then to localhost.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/+$/, "");
