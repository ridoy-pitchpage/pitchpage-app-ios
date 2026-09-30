# Page audit: the website, route by route

Every route in `gregadosmond-oss/profile-pride-app`, and what the app does
about it. Written by walking the web repo's `src/routes/` tree rather than from
memory, so "not in the app" below always has a reason next to it.

Checked 30 Sep 2026 against the web repo at that date. The website is reference
only and is never modified.

**All 61 routes are accounted for below**, and that was checked mechanically
rather than by eye — every `.tsx`/`.ts` under the web repo's `src/routes/`
(excluding `__root` and the `_authenticated` layout itself) was matched against
this file:

```bash
for f in src/routes/*.tsx src/routes/_authenticated/*.tsx src/routes/*.ts; do
  n=${f#src/routes/}; n=${n%.tsx}; n=${n%.ts}
  case "$n" in __root|_authenticated) continue;; esac
  grep -qF "${n#_authenticated/}" .../docs/PAGE_AUDIT.md || echo "MISSING: $n"
done
```

Re-run it after pulling the web repo; anything it prints is a route nobody has
made a decision about yet.

Legend: **In the app** · **Out of scope** (deliberately not brought across) ·
**Blocked** (checked against the database's own grants) · **Not built**
(possible, and a decision, not an impossibility).

## What someone signs up and builds with

| Website | App | Notes |
|---|---|---|
| `index` | `(public)/welcome` | In the app |
| `auth` | `(public)/sign-in`, `(public)/sign-up`, `(public)/check-email` | In the app. Split into real screens rather than one tabbed form. |
| `forgot-password` | `(public)/forgot-password` | In the app |
| `reset-password` | — | **Out of scope.** The reset link in the email opens the website, which is where a password is set. The app reads the session that results. |
| `_authenticated/dashboard` | `(app)/(tabs)/pages` | In the app, as the Pages tab |
| `_authenticated/choose-type.$id` | `(app)/choose-type/[id]` | In the app. All 8 types; verified by `e2e/page-types.mjs`. |
| `_authenticated/wizard.$id` | `(app)/builder/[id]` | In the app. `job` and `other` ask nothing first, so they open the builder directly. |
| `_authenticated/wizard-athlete.$id` | `(app)/intake/athlete/[id]` | In the app |
| `_authenticated/wizard-contractor.$id` | `(app)/intake/contractor/[id]` | In the app |
| `_authenticated/wizard-listing.$id` | `(app)/intake/listing/[id]` | In the app |
| `_authenticated/wizard-real-estate.$id` | `(app)/intake/real-estate/[id]` | In the app |
| `_authenticated/wizard-sales.$id` | `(app)/intake/sales/[id]` | In the app |
| `_authenticated/wizard-university.$id` | `(app)/intake/university/[id]` | In the app |
| `_authenticated/builder.$id` | `(app)/builder/[id]` | In the app. Rebuilt for touch: the page IS the screen, and the four tools are sheets. |
| `_authenticated/preview.$id` | `(app)/preview/[id]` | In the app, as the review step |
| `p.$slug` | `(app)/live/[id]` | In the app. The real published page in a web view. |
| `r.$slug` | — | **Out of scope.** A tracked-link redirect, not a page. Opening one is a visitor's job, not an owner's. |
| `_authenticated/credits` | `(app)/(tabs)/credits` | In the app (balance and ledger). Buying is blocked — see below. |
| `_authenticated/analytics` | `(app)/(tabs)/analytics` | In the app |
| `_authenticated/analytics_.$pageId` | `(app)/(tabs)/analytics/[id]` | In the app for everything `getPageInsights` returns. The website's deeper per-section and video-funnel panels (`getPageDetail`) are **not built**. |

Screens the app adds, because a phone needs them and the website does not:
`share/[id]`, `share/[id]/qr`, `pages/[id]/links`, `account/*`.

## Content and marketing

| Website | App | Notes |
|---|---|---|
| `guides`, `guide.index`, `guide.$slug` | `account/guides`, `account/guides/[slug]` | In the app. All 15 articles, offline. |
| `tracking` | `account/tracking` | In the app |
| `faq` | `(public)/faq` | In the app |
| `how-it-works` | `(public)/how-it-works` | In the app |
| `pricing` | `(public)/pricing` | In the app, without a buy button (Guideline 3.1.1) |
| `examples` | `(public)/examples` | In the app |
| `contact` | `(public)/contact` | In the app |
| `about` | links out | **Out of scope.** One page of company copy. |
| `privacy`, `terms` | links out | **Out of scope.** Legal text that must match the website exactly and changes on its own schedule; linking is the normal and safer pattern. |
| `compare` | — | **Out of scope.** A comparison table aimed at someone deciding whether to sign up. Everyone reading it in the app already has. The same ground is covered by the five comparison guides, which ARE in the app. |
| `features` | — | **Out of scope**, same reason. |
| `for.index`, `for.$role` | — | **Out of scope.** Role landing pages for search traffic. |

## Organisation, outreach and admin

| Website | App | Notes |
|---|---|---|
| `_authenticated/business` | — | **Not built.** Callable: the org functions are SECURITY DEFINER granted to `authenticated` and check `_is_org_admin` themselves. A large surface for a small group of admins; a scope decision, not a blocker. |
| `_authenticated/business_.analytics` | — | **Not built**, as above |
| `_authenticated/business_.page.$id` | — | **Not built**, as above |
| `_authenticated/owner` | — | **Not built**, as above |
| `_authenticated/admin.orgs` | — | **Not built.** Platform administration does not belong in a consumer app. |
| `_authenticated/outreach`, `outreach_.sequence.$id`, `outreach_.suppressions` | — | **Blocked.** Sending email is server work. |
| `business.claim.$token`, `invite.$token`, `join.$code`, `unsubscribe.$token` | — | **Out of scope.** One-time token links that arrive by email and are opened in a browser. |

## Infrastructure, not pages

`__root`, `api`, `ingest.$`, `mcp`, `llms.txt`, `llms-full.txt`, `sitemap.xml`,
`[.]lovable.oauth.consent` — server routes and crawler files with no UI.

`builder-lab`, `preview-page`, `preview-page-2/3/4`, `sample.$family`, `v2` —
the website's own development and design-preview routes, not product.

## Blocked, each checked rather than assumed

| What | Why |
|---|---|
| Buying credits in the app | `grant_credits` is `service_role` only and explicitly revoked from `authenticated`. Apple's receipt has to be verified server-side first. A client that could grant itself credits would be a hole. |
| Paige, and every AI step | Server code behind an API key the app must not hold |
| Push notifications | Needs a device-token table and a sender |
| Outreach sends | Sending email is server work |

## How this is kept true

- `e2e/page-types.mjs` — all 8 page types render and offer their controls.
- `e2e/build-flow.mjs` — create → choose a type → intake → builder → the four
  tool sheets → edit → style → review → share → QR → tracked links → analytics,
  driven in a real browser at 390×844, failing on any console error.
- `e2e/accessibility.mjs` — every route swept for tap targets under 44pt and
  unlabelled controls.
- `npm test` — the colour maths, page health, guide copy, the analytics
  aggregation (the website's own tests, unchanged) and unknown colour classes.
