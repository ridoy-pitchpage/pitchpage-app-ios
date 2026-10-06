# App Store submission pack — PitchPage 1.0

Everything App Store Connect asks for, ready to paste. Credits are bought on
pitchpage.co through a link in the app, which Apple allows on the United
States storefront only — so the app is offered in the US only, and the
listing and review notes below say so.

Character limits were counted, not estimated.

---

## 1. App information

| Field | Value |
|---|---|
| Name (30) | `PitchPage` |
| Subtitle (30) | `Your story, one shareable link` (30) |
| — alternatives | `Build a page that gets replies` (30) · `Pitch pages for every big ask` (29) |
| Primary category | Business |
| Secondary category | Productivity |
| Support URL | `https://pitchpage.co/contact` (live) |
| Marketing URL | `https://pitchpage.co` |
| Privacy Policy URL | `https://pitchpage.co/privacy` (live) |
| Copyright | `2026 <the legal entity that owns PitchPage>` |
| Price | Free |
| Availability | **United States only.** The app links to the website to buy credits, which no other storefront allows. Adding a country needs In-App Purchase first |

**Keywords** (99 of 100 — words already in the name and subtitle are left out,
because Apple indexes those anyway):

```
resume,cv,portfolio,job application,personal website,career,hiring,athlete,realtor,bid,qr code,link
```

**Promotional text** (156 of 170 — can be changed later without a new build):

```
Build a pitch page on your iPhone: your story, your numbers, an intro video and a design to match. Share one link or a QR code, and see when people open it.
```

**Description** (no prices, no mention of buying anywhere else, no AI — the
app has none of it):

```
PitchPage turns what you would normally attach — a résumé, a stat sheet, a bid — into one page people actually read. Build it on your iPhone, publish it at your own link, and see when it is opened.

PICK WHAT YOU'RE PITCHING
Job application, university application, athlete pitch, real estate pitch, property listing, contractor bid, sales pitch — or something else entirely. Each starts with the sections that kind of pitch needs, ready for you to fill in.

CHOOSE A LOOK
Thirty visual styles and twenty colours, from editorial to bold. Preview any of them with sample content, and switch whenever you like — your words come with you.

BUILD IT YOUR WAY
• Tap any section on the page to edit it, move it or remove it
• Lead with your numbers: results, stats and milestones as clear figures and charts
• Add your portrait, an intro video of up to two minutes, photo galleries and film clips
• Attach your résumé so people can download it
• A short checklist shows what is still missing before you publish

SHARE IT ANYWHERE
Publishing gives you one link that works everywhere. Share it to LinkedIn, X, WhatsApp, Facebook or email, show a QR code at a fair or an open house, and make a tracked link for each place you send it.

SEE WHAT HAPPENS NEXT
Analytics show when people came, where they came from, whether they watched your intro video, and which tracked link brought them.

FREE TO BUILD
Building and editing are free, with every style. Publishing a page uses one credit, credits are bought on pitchpage.co, and they never expire.

YOURS TO CONTROL
Sign in with Apple, Google or email. Drafts are not public until you publish, and you can delete your account and everything on it from inside the app.

Questions? support@pitchpage.co
```

If Sign in with Apple or Google is hidden for launch, change the "Sign in
with…" line to match.

---

## 2. App Privacy (the "nutrition label")

**Do you or your third-party partners collect data from this app?** Yes.

Tick these, and for **every one** answer: used for **App Functionality** only ·
**linked to the user's identity** · **not used for tracking**.

| Category | Data type | Why it is collected |
|---|---|---|
| Contact Info | Name | Account name and the name on the page |
| Contact Info | Email Address | Sign-in, and the page's contact button |
| Contact Info | Phone Number | Only if typed into a page — the Contact sections invite it. Ticking it is the conservative answer |
| User Content | Photos or Videos | Portrait, intro video, gallery, film clips |
| User Content | Other User Content | Page text, the résumé and other documents |
| Identifiers | User ID | The account id every row is stored under |

Leave everything else unticked. The app has no analytics or crash-reporting
SDK, no advertising, sells nothing in the app, and reads no location,
contacts, browsing or search history. The page analytics it shows are about
the visitors to a person's published page, collected by the website, not data
collected from the app's user.

**Tracking:** No. (That is also why there is no App Tracking Transparency prompt.)

---

## 3. App Review information

**Sign-in required:** Yes. The demo account must have **at least 3 credits and
one published page**, so the reviewer can publish without buying anything.

```
Username: <demo account email>
Password: <demo account password>
```

**Contact:** the owner's name, phone number and email.

**Notes** — paste this:

```
DEMO ACCOUNT
The demo account has credits and one published page, so every feature can be tried, including publishing. To test account deletion, please create a new account instead (email, Sign in with Apple or Google) — deleting the demo account would lock review out.

HOW TO TRY IT
1. Pages → New page. Choose what the page is for, pick a look, then "Continue to builder".
2. Tap any section on the page to edit it. Add a photo or a short video from the media buttons.
3. Preview → Publish. This uses one of the account's credits.
4. Share: copy the link, show the QR code, or make a tracked link.
5. Analytics: open the published page to see its visits.
6. Account → Delete your account removes the account and all of its data at once (Guideline 5.1.1(v)).

CREDITS
PitchPage is free to download and free to build with. Publishing a page uses one credit from the person's PitchPage account. Credits are sold on the PitchPage website: Credits → "Buy credits on pitchpage.co" opens pitchpage.co in Safari, as Guideline 3.1.1(a) permits for apps on the United States storefront, and this app is offered on the United States storefront only. Nothing is sold inside the app. PitchPage is a free companion to the paid PitchPage web service, which hosts the published pages (Guideline 3.1.3(f)). The demo account already has credits, so no purchase is needed to review publishing.

OTHER NOTES
• The page itself is drawn with the same layout code the published page uses, inside a web view, so what the builder shows is exactly what visitors see. Sign-in, editing, camera and photo capture, sharing, QR codes and analytics are native.
• There are no AI features in this version, and nothing is sent to an AI service.
• The app does no tracking and shows no advertising.
```

Drop the web-view sentence if `/app-render` has not been published by then —
until it is, the app draws pages itself.

---

## 4. The other questions App Store Connect asks

**Age rating** — answer **None / No** to every question. Two that need a
moment's thought:

- *User-generated content:* **No.** People build their own pages, but nobody
  can see anyone else's page inside the app.
- *Unrestricted web access:* **No.** The app only opens the person's own
  page, the privacy policy and terms, and links that are on their own page.

That should come out as **4+**.

**Export compliance:** nothing to answer. The build declares
`ITSAppUsesNonExemptEncryption = false` (HTTPS only), so App Store Connect
skips the question.

**Content rights:** if the sample pages behind the template previews use stock
or licensed photos, answer *"Yes, it contains third-party content, and I have
the rights to use it"*; otherwise *No*. The owner knows where those photos
came from.

**Made for Kids:** No.

**Version release:** *Manually release this version*, so it goes live when you
choose, not the moment it is approved.

---

## 5. Screenshots

iPhone only (`supportsTablet: false`), so only the iPhone set is needed.

- **Size:** 6.9-inch, portrait — **1320 × 2868** (iPhone 16/17 Pro Max). App
  Store Connect also accepts 1290 × 2796 for this slot. Smaller iPhones are
  scaled from it.
- **Count:** 3 to 10. Suggested order:
  1. A finished page in the builder (the real template, filled in)
  2. The style gallery
  3. Editing a section
  4. Share — the link, QR code and tracked links
  5. Analytics for a published page
  6. The page types ("What's your page for?")
- They must show the app itself — no splash screen, no sign-in screen as the
  lead image. Use the demo account's content, not a real person's page.

Taking them on a Pro Max through TestFlight gives the right size directly.
Screenshots from any other iPhone can be placed on a 1320 × 2868 canvas with a
caption above them; that is allowed as long as the app's real screen is shown.

---

## 6. Build and submit

Once the Apple Developer account and an Expo account exist:

```bash
npm install -g eas-cli
eas login
eas init
```

`eas init` prints a project ID. The config reads it from `EAS_PROJECT_ID`;
the simplest thing is to write it into `app.config.ts` under `extra.eas`.

```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

The first build asks to sign in with the Apple ID and creates the
certificates, the `co.pitchpage.app` identifier and its Sign in with Apple and
Associated Domains capabilities. Submitting puts the build in TestFlight: test
it there on a real iPhone first (§7), then pick it on the version page in App
Store Connect and **Add for Review**.

---

## 7. TestFlight check before submitting

On a real iPhone, with the TestFlight build — not Expo Go, which cannot test
the native sign-ins:

- [ ] Sign in with Apple, with Google, and with email; sign out and back in
- [ ] Create a page, pick a style, edit sections, move one, delete one
- [ ] Portrait from the camera and from Photos; an intro video
- [ ] Publish with a credit; the live page opens; a link on it opens
- [ ] Share: copy link, share sheet, QR code saved to Photos, tracked link
- [ ] Analytics for the published page
- [ ] Delete a throwaway account: it signs out, and its pages stop loading
- [ ] Dark mode, the largest text size, and airplane mode on a few screens
