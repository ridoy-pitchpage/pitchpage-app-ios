# PitchPage for iOS

The native iPhone app for [pitchpage.co](https://pitchpage.co). Expo SDK 57,
React Native, TypeScript, Expo Router.

The full plan — every screen, the backend work it needs, App Store
requirements, milestones — is in [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md).

[`docs/PAGE_AUDIT.md`](docs/PAGE_AUDIT.md) is the shorter question: every one
of the website's 61 routes, and what this app does about it. Read that first if
you are wondering whether something was missed or decided against.

## Running it on your own computer

**The only thing you have to install is Node.js.** Visual Studio, VS Code and
Git are not needed — you do not have to edit anything to run the app.

1. Go to [nodejs.org](https://nodejs.org) and install the **LTS** version (the
   big green button). Accept the defaults. Node 20 or newer; 22 is what this is
   tested on.
2. Get this folder onto your computer: on the repository page, click the green
   **Code** button, then **Download ZIP**, and unzip it somewhere you can find
   again — the Desktop is fine. (`git clone` works too if you already have Git.)
3. Open the unzipped folder and double-click:
   - **`start-windows.bat`** on Windows
   - **`start-mac.command`** on a Mac

   The first run installs the app and takes a few minutes. After that it takes
   seconds.
4. Your browser opens at **<http://localhost:8081>**. If it does not open by
   itself, type that address in yourself.

**Leave the black window open while you use the app.** It *is* the app's
server: `http://localhost:8081` only exists while it is running, so closing the
window gives you "This site can't be reached".

Windows may warn that the file is from an unknown publisher — that is because
nobody has paid to code-sign it. Choose **More info → Run anyway**.

### Doing it by hand instead

```bash
npm install
npm run web
```

### Signing in

The app talks to the **live pitchpage.co backend**, so sign in with a real
account — and use a test one, because anything you publish is really published.
There is no `.env` to set up; the defaults already point at production.

### On your iPhone, still from the PC

Install **Expo Go** from the App Store, run `npm start`, and scan the QR code
with the camera. Both devices need to be on the same Wi-Fi.

Expo Go covers everything up to M1. From M2 the app needs a development build
(native Sign in with Apple and the video module contain native code Expo Go
does not ship), which is built in the cloud with EAS and still needs no Mac.

### On a Mac

```bash
npx expo run:ios
```

You need Xcode. The Simulator is where the Maestro end-to-end flows run. It
has no camera, so recording is tested on a real iPhone.

## What works today

The app signs in against the live Supabase project and works with real data:

- Welcome, sign in, create account, forgot password. Google and Apple go
  through the website's sign-in bridge (`/app-auth/start` and `/app-auth/finish`)
- **Your pages** — the list, create a draft, delete
- **Review and publish** — what's on the page, the pre-publish health check,
  and publishing, free from the app for up to 3 live pages (the server counts,
  in `publish_pitch_page_from_app`)
- **Share** — copy link, the iOS share sheet, LinkedIn, X, WhatsApp, Facebook,
  email, and a QR code you can show someone in person
- **Tracked links** — one per recipient, created, copied and removed
- **See it live** — the real published page
- **Account** — appearance (system/light/dark), profile, password, help and
  legal links, sign out
- **The builder** — the page IS the screen: tap any region to edit it. Details,
  sections (add, reorder, edit, remove), all nine block types, photo and intro
  video, and thirty style families. Drafts autosave, and a save that collides
  with another device is detected rather than silently overwritten.
- **Choose a type and intake** — the eight page types and their guided
  questions, which seed the sections
- **Build my page** — tell us about yourself and add a CV, and the website's
  own AI (`POST /api/app/v1/ai/compose-sections`) writes a first draft into the
  sections that are still empty, after a one-time AI consent
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

Paige and the other AI steps (rewriting a section, the guided questions),
push notifications, outreach sends, and the company dashboard.

The first three need server code the app must not hold. The company dashboard
is different: its functions ARE callable by a signed-in admin, so it is not
blocked, just not built yet.

Nothing is sold in the app, by decision (9 Oct 2026): publishing from it is
free, and credits are bought and spent only on the website. That is what lets
the app go on every storefront without In-App Purchase.

The website has three pieces that exist for the app: `/app-render`, the
sign-in bridge, and the compose endpoint. Everything else works because the
website already grants a signed-in user row-level access to their own pages,
profile and view events, and because publishing is a database function any
signed-in user may call. Website changes follow that repo's
`CLAUDE.md`, and none of them is live until it is published in Lovable.

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
