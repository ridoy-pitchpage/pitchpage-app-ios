# PitchPage for iOS

The native iPhone app for [pitchpage.co](https://pitchpage.co). Expo SDK 57,
React Native, TypeScript, Expo Router.

The full plan — every screen, the backend work it needs, App Store
requirements, milestones — is in [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md).

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

Milestone 1 is partly in. The app signs in against the live Supabase project
and reads real data:

- Welcome, sign in, create account, forgot password
- Your pages: the list, create a draft, copy link, view, take offline, delete
- Credits: balance and ledger
- Account: appearance (system/light/dark), help and legal links, sign out

Everything here runs against **production**. There is no staging backend — see
the master plan §24 — so use a test account, not a real one.

## What is not in yet

The builder, Paige, media capture, publishing, analytics, In-App Purchase,
company and outreach. Each has a milestone in the plan.

Some of it is waiting on the app API in the web repo
(`gregadosmond-oss/profile-pride-app`, master plan Part C). Until that ships,
the screens here read through Supabase directly, which works because the
website already grants signed-in users row-level access to their own pages,
credits and profile, and because publishing is a database function anyone
signed in may call. Anything involving AI, Paige, analytics rollups, uploads or
company permissions lives in server code and waits for the API.

## Commands

| Command | What it does |
|---|---|
| `npm run web` | Browser preview |
| `npm start` | Dev server, for Expo Go or a development build |
| `npm run typecheck` | `tsc --noEmit` — must be clean before every commit |
| `npm run doctor` | Checks the dependency set against the Expo SDK |

## Layout

```
app/        screens, one file per route (Expo Router)
src/
  api/      Supabase access, query hooks, generated schema types
  auth/     client, encrypted session storage, sign-in actions
  components/  the design system
  theme/    colour tokens, fonts, light/dark
  lib/      config, formatters, error translation
docs/       the master plan
```

## Conventions

See [`CLAUDE.md`](CLAUDE.md).
