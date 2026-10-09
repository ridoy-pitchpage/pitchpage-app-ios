# CLAUDE.md — PitchPage for iOS

The native iPhone app for pitchpage.co. Expo SDK 57, React Native 0.86,
TypeScript, Expo Router, NativeWind.

The plan for the whole build is `docs/MASTER_PLAN.md`. Read the section a task
belongs to before starting it; the section numbers below point into it.

## The two repos

| | |
|---|---|
| This repo | the app |
| `gregadosmond-oss/profile-pride-app` | the website, the backend, and the database |

The app has no backend of its own. Every business rule — credits, publishing,
company permissions, AI limits — stays in the web repo's server code.

**Changes in the web repo follow that repo's `CLAUDE.md`,** which means a
plan-first spec in `agent-os/specs/`, one change per commit, and `tsc`, tests
and build green. Its protected areas (credits RPCs, Stripe, the publish flow,
Supabase schema and RLS, analytics, `PublicPitchView`, the template layouts,
`styles.css` globals) need the owner's sign-off before they are touched.

A push to the web repo does not deploy. Someone publishes it by hand in
Lovable, and migrations are pasted into Lovable's SQL editor separately. So a
merged backend change is not a live backend change, and the app must never
assume it is.

## Working rules

- **Plan first** for anything non-trivial, and show the plan before building.
- **One change per commit.** Do not bundle unrelated work.
- **`npm run typecheck` must be clean** before every commit.
- **Push only when asked.**
- The app talks to **production**. There is no staging backend (§24). Use test
  accounts; never run destructive tests against real users.

## Where things live

```
app/        one file per route; nothing but screens and layouts
src/api/    Supabase access, react-query hooks, generated schema types
src/auth/   client, session storage, sign-in actions
src/components/  the design system — no screen-specific components here
src/theme/  colour tokens, fonts, light/dark
src/lib/    config, formatters, error translation
```

## Rules that are easy to break

**Never invent a token value.** Colours come from `src/theme/tokens.ts`, copied
from the web's `app-theme.ts` and `site-theme.ts`. Prose in either repo that
describes a forest or teal palette is stale — the brand moved to blue on
2026-09-27. Take values from code.

**Never show a raw error.** Everything user-facing goes through
`userFacingErrorMessage` in `src/lib/errors.ts`. A Postgres policy violation or
a `Failed to fetch` is not a sentence for a customer.

**Every screen needs loading, empty and error states,** each with a way
forward. `src/components/States.tsx` has them.

**Limits come from the web's schema,** not from memory: 16 sections and 64 KB a
page, 8 MB a document, 15 MB an image, 50 MB and 120 seconds of video, 6
credentials, 300 gallery images, 100 film clips.

**Paige's approvals are tap-only,** and Accept and Undo carry the signed token
the server issued. The server writes the token's data, never the client's copy.
Do not add a way for anything else to approve an edit.

**The app sells nothing and names no price.** Publishing from it is free, for
up to 3 live pages per account (`src/lib/free-publishing.ts`), and the cap is
the server's: `publish_pitch_page_from_app` counts and refuses, and the app only
states it. Selling nothing is what puts the app on every storefront without
In-App Purchase (Guideline 3.1.3(f)), so no screen shows a credit, a price, a
refund or a way to buy, and the app opens no pitchpage.co marketing page,
because every one of them shows the price (`src/content/guide-links.ts`,
`src/render/page-links.ts`). The accessibility sweep fails on any of it. Never
add buying, or a link to the website's checkout or pricing, without In-App
Purchase first (§13).

**Do not reimplement server logic.** If a rule lives in a server function, the
app calls it. Slug collision retries, credit spending, company consent, staff
access and save conflicts are all server-side.

**A page a staff member edits is still the member's page.** Anything touching
company-owned pages has to keep the two-caller model the web uses.

## Accessibility

A VoiceOver label on every control, 44pt minimum targets, meaning never carried
by colour alone, and layouts that survive the largest Dynamic Type setting.
Never set `allowFontScaling={false}`.

## Style

Match the surrounding code. Comments explain why something is the way it is —
especially where it looks wrong but is deliberate — not what the line does.
