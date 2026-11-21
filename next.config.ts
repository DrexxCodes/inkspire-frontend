import type { NextConfig } from "next";

/**
 * Next.js is used for presentation only. There are deliberately NO route handlers and NO
 * rewrites to /api: the browser talks to the Fastify backend directly (see lib/config.ts).
 * `scripts/check-no-api-routes.mjs` fails the build if an API route is ever added.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Profile and cover images are served from Supabase Storage (or your object storage host).
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      // The service worker script must never be served from a cache, or browsers keep running an old copy.
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
