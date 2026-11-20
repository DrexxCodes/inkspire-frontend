# Inkspire frontend

Next.js (App Router, latest stable at the time of writing, `^16.4.5`), React 19, plain CSS with design tokens, Recharts for the admin dashboard, Firebase Authentication only.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Fastify base URL, without `/api/v1` |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`, `..._APP_ID` | Firebase web config, used for sign in only |

These values are public by design. Never add Firebase Admin credentials, Supabase keys or database URLs here.

3. `npm run dev` then open http://localhost:3000

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Standard Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests |
| `npm run check:no-api` | Fails if an `app/api` or `pages/api` folder or a `route.ts` handler exists (also runs before `build`) |

## Layout

```
app/          routes only (thin): discover, works/[id], write, write/[id], write/[id]/history,
              profile/[username], settings, auth/*, admin/*
features/     screen level logic: discover, reader, editor, revisions, profile, admin
components/   reusable UI: ui/ (primitives), layout/, work/, comments/, admin/
hooks/        useApi, useCursorList, useOverlay, useMediaQuery, ...
services/     one typed module per backend area, all through lib/api/client.ts
stores/       auth and toast providers
lib/          api client, config, firebase, pure rules (gate, validation, admin rules, settings rules)
utils/        pure helpers (format, diff, chart, content, colors, list)
styles/       tokens + one stylesheet per area
test/         unit tests for pure logic
```

## Behavior worth knowing

- **Responsive dialogs.** One overlay implementation, three presentations chosen by breakpoint: bottom sheet on mobile, side drawer on tablet, centered modal on laptop and up. Large panels use a drawer except on mobile. Focus is trapped, Esc closes, background is inert.
- **Reader.** Content loads a few chunks at a time while scrolling. If the author saves a new version mid read, the server answers `CONTENT_CHANGED` and the reader offers to reload the latest version.
- **Editor.** Autosave writes to the draft state (no revision). "Save version" creates a revision. Editing an older version shows a notice and asks whether the new version should become current. Flagged works show the moderator's reason and offer "Request review" after a new version is saved.
- **Admin.** Menu items are hidden when the role lacks the permission. This is only convenience, the backend enforces every call.
- **Charts.** Four series colors in a fixed order (validated for color blindness), one axis, a legend whenever there are two or more series, hover tooltip, and a table view.

## Tests

`npm test` covers the API client (envelope, errors, token refresh), the no-API-routes guard, breakpoint and overlay mapping, list, format, diff and content utilities, route gating, redirect safety, validation, editor rules, admin rank rules, settings rules and chart helpers.
