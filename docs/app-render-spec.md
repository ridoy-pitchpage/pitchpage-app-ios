# Spec: `/app-render`, the render surface

**Repo this belongs in:** `gregadosmond-oss/profile-pride-app` (the website).
Copy this into that repo's `agent-os/specs/` and follow its `CLAUDE.md`:
plan-first, one change per commit, `tsc`, tests and build green.

**Needs the owner's sign-off before any code is written.** It touches
`PublicPitchView` and the template layouts, both protected areas.

**Status:** not built. `https://pitchpage.co/app-render` returns 404 today.

---

## Why

The app renders thirty template families through **five** archetypes
(`src/render/template-theme.ts`). The distribution is lopsided:

| Archetype | Families |
|---|---|
| `soft` | 13 |
| `editorial` | 9 |
| `bold` | 5 |
| `console` | 2 |
| `minimal` | 1 |

Twenty-two of thirty templates collapse into two looks. Corporate,
Letterhead, Momentum, Accent Ring and Hard Split are all `soft`, so the
builder draws them identically. Someone who picks a template and taps
"Build it myself" sees something that is not the template they picked, and
there is no way to tell from inside the app that anything is wrong.

MASTER_PLAN decision **D4 (§14)** already chose the answer, and chose it to
avoid exactly the alternative that keeps suggesting itself: *"Rebuilding the
40 page layouts natively"* is listed in the risk table as the thing this
design prevents. Duplicating the layouts in React Native would drift from the
website on every template change, forever, and there are more of them than
there are archetypes.

So the fix is not in the app. It is this route.

## What it is

A web route that draws a page **from data the caller sends in**, so the app
can show the website's own layouts instead of an approximation of them.

- It renders `PublicPitchView` **unchanged**, with the preview behaviour the
  website builder's `LivePreview` already uses: animations off, hints in
  empty sections, tap-to-edit.
- It **fetches no page data of its own**. Everything arrives in a message.
  That means no sign-in, no Supabase call, no secrets, and no RLS surface.
- It is **inert**: added to the root layout's exclusion lists the same way
  `/p/` is — no PostHog, no GA, no service worker, no voice root, no robot
  dock, no install prompt — and `noindex`.
  The existing `posthog-not-on-published-pages` test is extended to cover it.

### Modes

| Mode | Draws | Used by |
|---|---|---|
| `page` | A whole page | Preview (S74), Live page (S78), review rows (S68), the builder's live preview (S69) |
| `section` | One section | The section editor (S45) |
| `thumb` | One style with sample data | The selected style card (S35) |
| `shareCard` | The 1200×630 share image, via the website's existing canvas code | Share-card upload |

## Protocol

`postMessage` both ways. Every inbound message is validated with **zod** and
rejected unless it is well formed and comes from an allowed origin.

```ts
// app -> page
type Inbound =
  | { type: "render"; page: PageModel; mode: "page" | "section" | "thumb"; device?: "phone" | "tablet"; sectionId?: string }
  | { type: "scrollTo"; sectionId: string }
  | { type: "highlight"; sectionId: string | null }
  | { type: "makeShareCard"; page: PageModel };

// page -> app
type Outbound =
  | { type: "ready" }
  | { type: "rendered"; height: number }
  | { type: "sectionTap"; sectionId: string }
  | { type: "shareCard"; pngBase64: string }
  | { type: "error"; message: string };
```

Notes that matter:

- **`ready` comes first.** The app must not send `render` before it, or the
  first paint is dropped and the surface looks blank.
- **`rendered { height }`** lets the app size a non-scrolling container. The
  page should emit it on every layout change, not only the first.
- **`sectionTap`** is what makes tap-to-edit work: the app opens its own
  section sheet. The page never edits anything itself.
- **`error`** must be a sentence the app can show a customer. The app puts
  everything through `userFacingErrorMessage`, so a stack trace is useless
  here.

### Origin allowlist

Accept messages only from the app's WebView bridge and from the dev
preview's origin. Reject everything else silently — this route renders
whatever it is handed, so an unchecked sender is a way to draw arbitrary
content under the pitchpage.co origin.

## Performance

From §14, and they are requirements rather than suggestions:

- **One warm WebView** is reused across the builder. Creating one per section
  is what makes this feel slow on a phone.
- **Renders are debounced**, about 150 ms. Every keystroke in the builder
  would otherwise be a full re-render.
- **Style lists use static thumbnails** — `/examples/thumb/style-<id>.webp`,
  which already exists and returns 200. Only the *selected* card renders
  live, as on the website.

## App-side work (this repo, after the route ships)

1. A `RenderSurface` component wrapping the transport split that already
   exists: `react-native-webview` on device, a raw `<iframe>` on web.
   `react-native-webview` has **no web build** — it renders a red "does not
   support this platform" notice — so the two really are separate paths.
2. `EXPO_PUBLIC_RENDER_URL` is already wired in `src/lib/config.ts` as
   `RENDER_URL` and currently unused. It becomes the surface's base URL.
3. Replace `PageRender` as the *preview* renderer in the builder, Preview and
   review rows. Keep `PageRender` as the offline fallback: the surface needs
   the network, and a builder that shows nothing on a train is worse than one
   showing an approximation.
4. Once `thumb` mode exists, the generated thumbnails in `assets/templates`
   (from `scripts/build-template-thumbnails.mjs`) can be dropped or kept as
   offline placeholders. They are screenshots and go stale; the official
   `/examples/thumb/` files do not.

## Acceptance criteria

- [ ] `/app-render` returns 200 and renders nothing until it receives a `render`.
- [ ] A page sent as `page` is **pixel-identical** to the same page at `/p/<slug>`, minus animations.
- [ ] Tapping a section emits `sectionTap` with the right id, and emits nothing else.
- [ ] Malformed, unvalidated or wrong-origin messages are ignored, and the route logs nothing sensitive.
- [ ] The route is absent from PostHog, GA, the service worker, the voice root, the robot dock and the install prompt, and is `noindex`.
- [ ] `posthog-not-on-published-pages` covers `/app-render`.
- [ ] `shareCard` returns a 1200×630 PNG matching what the website already produces.
- [ ] The route works with no session, in a private window.

## Out of scope

- Any change to how pages are stored, published, or paid for.
- Any change to the template layouts themselves.
- The app's offline fallback renderer, which stays as it is.

## Open questions for the owner

1. **Page data shape.** The app's `PageModel` is its own type. Does the route
   take that, the raw `pitch_pages` row, or the website's internal page type?
   Whichever it is, it needs a version field — the app ships on the App
   Store's schedule and old versions will keep sending old shapes for months
   after the website moves on.
2. **Unpublished pages.** Preview of a draft is the main use. Confirm the
   route may draw a page that has never been published, given it holds no
   secrets and fetches nothing.
3. **Rollout.** A push to the web repo is not a deploy — someone publishes by
   hand in Lovable. The app must therefore treat the surface as optional and
   fall back to `PageRender` until it answers, rather than assuming it exists.
