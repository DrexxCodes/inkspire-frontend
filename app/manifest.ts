import type { MetadataRoute } from "next";

/**
 * Web app manifest, served by Next at /manifest.webmanifest and linked from every page.
 * This is what makes Inkspire installable ("Add to Home Screen" / "Install app").
 *
 * Colours match the app chrome (white top bar, see `viewport.themeColor` in app/layout.tsx) and the
 * white background of the icons, so the install splash screen does not flash another colour.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Inkspire",
    short_name: "Inkspire",
    description: "A home for stories, poems and essays, written and read by people who love words.",
    // "/" only redirects to /discover, so start there directly and skip the extra hop.
    start_url: "/discover",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "en",
    categories: ["books", "education", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Full bleed with the mark kept inside the 80% safe zone, so Android can crop it to any shape.
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Discover", short_name: "Discover", description: "Browse new stories, poems and essays", url: "/discover" },
      { name: "Write something", short_name: "Write", description: "Start a new work", url: "/write/new" },
    ],
  };
}
