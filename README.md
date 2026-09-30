# PitchPage for iOS

The native iPhone app for [pitchpage.co](https://pitchpage.co). Expo SDK 57,
React Native, TypeScript, Expo Router.

The full plan — every screen, the backend work it needs, App Store
requirements, milestones — is in [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md).

[`docs/PAGE_AUDIT.md`](docs/PAGE_AUDIT.md) is the shorter question: every one
of the website's 61 routes, and what this app does about it. Read that first if
you are wondering whether something was missed or decided against.

## Getting it running on Windows

You do not need a Mac for this part.

1. Install [Node.js LTS](https://nodejs.org), [Git](https://git-scm.com) and
   [VS Code](https://code.visualstudio.com).
2. Clone and install:
   ```bash
   git clone https://github.com/ridoy-pitchpage/pitchpage-app-ios
   cd pitchpage-app-ios
   npm install
   ```
3. Open it in a browser:
   ```bash
   npm run web
   ```
   It serves at <http://localhost:8081>. Sign in with a real PitchPage account —
   the app talks to the live backend.

### On your iPhone, still from the PC

Install **Expo Go** from the App Store, run `npm start`, and scan the QR code
with the camera. Both devices need to be on the same Wi-Fi.

Expo Go covers everything up to M1. From M2 the app needs a development build
(In-App Purchase, native Sign in with Apple and the video module all contain
native code Expo Go does not ship), which is built in the cloud with EAS and
still needs no Mac.

### On a Mac

```bash
npx expo run:ios
```

You need Xcode. The Simulator is where In-App Purchase gets tested against a
StoreKit configuration file, and where the Maestro end-to-end flows run. The
Simulator has no camera, so recording is tested on a real iPhone.

## What works today

The app signs in against the live Supabase project and works with real data:

- Welcome, sign in, create account, forgot password
- **Your pages** — the list, create a draft, delete
- **Review and publish** — what's on the page, the pre-publish health check,
  and publishing, including the company-sponsored and awaiting-a-credit cases
- **Share** — copy link, the iOS share sheet, LinkedIn, X, WhatsApp, Facebook,
  email, and a QR code you can show someone in person
- **Tracked links** — one per recipient, created, copied and removed
- **See it live** — the real published page
- **Credits** — balance and ledger
- **Account** — appearance (system/light/dark), profile, password, help and
  legal links, sign out
- **The builder** — the page IS the screen: tap any region to edit it. Details,
  sections (add, reorder, edit, remove), all nine block types, photo and intro
  video, and thirty style families. Drafts autosave, and a save that collides
  with another device is detected rather than silently overwritten.
- **Choose a type and intake** — the eight page types and their guided
  questions, which seed the sections
- **Guides** — all fifteen articles, in the app and readable offline
- **Analytics** — views, people, a day-by-day chart, video watch-through,
  where visitors came from and how each tracked link is doing, over four
  periods. Counted by the website's own aggregation code, copied across.
- **What we measure** — the tracking disclosure, in the app
- **Delete your account** — really deletes it, once the one SQL script in
  `sql/` has been run against the database

Everything runs against **production**. There is no staging backend (master
plan §24), so use a test account.

## What is not in yet

Paige and the AI steps, buying credits in the app, push notifications,
outreach sends, and the company dashboard.

The first four need server code the app must not hold — `grant_credits`, for
instance, is `service_role` only, and rightly so: a client that could grant
itself credits would be a hole. The company dashboard is different: its
functions ARE callable by a signed-in admin, so it is not blocked, just not
built yet.

The website repo is read-only by instruction and stays untouched. What works
does so because the website already grants a signed-in user row-level access
to their own pages, credits, profile and view events, and because publishing is
a database function any signed-in user may call.

**Before submitting:** run `sql/001_delete_my_account.sql` against the
database. Until it is applied, deleting an account falls back to emailing a
request, and App Store Guideline 5.1.1(v) requires deletion to finish inside
the app. The file explains what it does and how to verify it.

The master plan's "Standing constraint" section has the full list, including
which items were checked against the database's own grants rather than assumed.

## Commands

| Command | What it does |
|---|---|
| `npm run web` | Browser preview |
| `npm start` | Dev server, for Expo Go or a development build |
| `npm run typecheck` | `tsc --noEmit` — must be clean before every commit |
| `npm run lint` | ESLint. Must be clean before every commit |
| `npm test` | Jest. The colour maths, the page-health rules, the guide copy |
| `npm run e2e` | Drives the app in a real browser against stubbed data |
| `npm run doctor` | Checks the dependency set against the Expo SDK |

CI runs the typecheck, the lint, the tests, a web bundle and the end-to-end
suite on every push.

`npm run e2e` needs no account and no network — it bundles the app, serves it,
and drives it against stubbed Supabase responses. Three suites: every page type
renders, the whole build flow works (choose a type → intake → builder → review →
share → analytics), and no control is under 44pt or unlabelled. It fails on any
console error.

## Layout

```
app/        screens, one file per route (Expo Router)
src/
  api/      Supabase access, query hooks, generated schema types
  auth/     client, encrypted session storage, sign-in actions
  components/  the design system
  content/  guide copy, copied verbatim from the website
  features/ the builder's sheets, media upload
  page/     the page model, seeds and style families, ported from the website
  render/   how a page is drawn: archetypes, blocks, colour maths
  state/    the draft store and its autosave
  theme/    colour tokens, fonts, light/dark
  lib/      config, formatters, error translation
__tests__/  unit tests
docs/       the master plan and the page audit
e2e/        browser tests: the build flow, every page type, accessibility
sql/        SQL this app needs that the website does not have. Apply by hand.
```

Files under `src/page/` and `src/content/` are copied from the website rather
than rewritten, so the app and the site cannot drift on what a page IS or on
the words of a published article. Each says so at the top. Re-copy them whole
rather than editing them here.

## Conventions

See [`CLAUDE.md`](CLAUDE.md).
