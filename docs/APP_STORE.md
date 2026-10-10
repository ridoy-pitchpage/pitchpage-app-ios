# App Store submission pack — PitchPage 1.0

Everything App Store Connect asks for, ready to paste. The app sells nothing:
since 9 October 2026, publishing from it is free, for up to 3 live pages per
account, and credits and their price exist only on pitchpage.co. So the app
can be offered on every storefront except China mainland, and the listing and
review notes below say so.

Character limits were counted, not estimated.

**Status, 6 Oct 2026:** Greg has created the App Store Connect record
("PitchPage", SKU `pitchpage-ios-01`), entered the listing text, keywords,
category and URLs, and certified the age rating at 4+. What is left in App
Store Connect is the App Privacy answers (§2), the review notes and demo
account (§3), the screenshots (§5) and choosing the build.

**9 Oct 2026:** publishing from the app is free (`publish_pitch_page_from_app`,
live on the database since 9 Oct), and the app no longer shows credits, a
price or any way to buy. Availability, the description and the review notes
changed with it, so paste §1 and §3 again, and set the EU trader status (§1)
before submitting.

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
| Availability | **Every country and region except China mainland.** The app sells nothing and links to no purchase, so no storefront rules it out. China mainland needs an ICP filing number first |

**EU trader status (Digital Services Act):** declare PitchPage a **trader**.
It is a business offering a paid service, and Apple won't put the app on EU
storefronts until the declaration is made. A trader's address, phone number
and email show on the EU product page, and Apple verifies them first, so
allow a few days.

**Keywords** (99 of 100 — words already in the name and subtitle are left out,
because Apple indexes those anyway):

```
resume,cv,portfolio,job application,personal website,career,hiring,athlete,realtor,bid,qr code,link
```

**Promotional text** (156 of 170 — can be changed later without a new build):

```
Build a pitch page on your iPhone: your story, your numbers, an intro video and a design to match. Share one link or a QR code, and see when people open it.
```

**Description** (no prices and no mention of buying anywhere else — the app
has none of it). "Build my page" drafts a page with AI since 2026-10-08; if the
description should say so, add a line such as "Tell us about yourself and add
your CV, and PitchPage writes a first draft you can change.":

```
PitchPage turns what you would normally attach — a résumé, a stat sheet, a bid — into one page people actually read. Build it on your iPhone, publish it at your own link, and see when it is opened.

PICK WHAT YOU'RE PITCHING
Job application, university application, athlete pitch, real estate pitch, property listing, contractor bid, sales pitch — or something else entirely. Each starts with the sections that kind of pitch needs, ready for you to fill in.

CHOOSE A LOOK
Thirty visual styles and twenty colours, from editorial to bold. Preview any of them with sample content, and switch whenever you like — your words come with you.

BUILD IT YOUR WAY
• Tap any section on the page to edit it, move it or remove it
• Lead with your numbers: results, stats and milestones as clear figures and charts
• Add your portrait and an intro video of up to two minutes
• Attach your résumé so people can download it
• A short checklist shows what is still missing before you publish

SHARE IT ANYWHERE
Publishing gives you one link that works everywhere. Share it to LinkedIn, X, WhatsApp, Facebook or email, show a QR code at a fair or an open house, and make a tracked link for each place you send it.

SEE WHAT HAPPENS NEXT
Analytics show when people came, where they came from, whether they watched your intro video, and which tracked link brought them.

FREE TO BUILD AND PUBLISH
Building, editing and publishing are free, with every style. Keep up to three pages live at a time, and take one offline whenever you want room for another.

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
| User Content | Photos or Videos | Portrait and intro video |
| User Content | Other User Content | Page text, the résumé and other documents |
| Identifiers | User ID | The account id every row is stored under |

**AI:** "Build my page" sends what the person typed, their CV, the kind of
page and the role they chose in setup, and their section names to Google's
Gemini through the Lovable AI Gateway, to write the draft. That is still App Functionality under User Content, so no new box, but
check the privacy policy names that processor, because Guideline 5.1.2(i)
expects it there as well as on the consent screen.

Leave everything else unticked. The app has no analytics or crash-reporting
SDK, no advertising, sells nothing in the app, and reads no location,
contacts, browsing or search history. The page analytics it shows are about
the visitors to a person's published page, collected by the website, not data
collected from the app's user.

**The website keeps its trackers out of the app** (9 October 2026,
[gregadosmond-oss/profile-pride-app#268](https://github.com/gregadosmond-oss/profile-pride-app/pull/268)).
The app draws pages with the website in its own web views (the builder,
template previews, the live page), and Apple counts what those collect. The
web views mark themselves with "PitchPageApp" in the user agent, and the
website starts neither Google Analytics nor PostHog when it sees that or
/app-render. That is what makes "no analytics" true here: if the website ever
loads a tracker in the app again, these answers have to change with it.

**Tracking:** No. (That is also why there is no App Tracking Transparency prompt.)

---

## 3. App Review information

**Sign-in required:** Yes. The demo account needs **one published page** and
room to publish more. Publishing from the app is free for up to 3 live pages,
and a page published on the website doesn't count toward them. On 9 Oct 2026
the demo account had one page, live and published on the website, so a
reviewer can publish three from the app.

```
Username: <demo account email>
Password: <demo account password>
```

**Contact:** the owner's name, phone number and email.

**Notes** — paste this. It answers Apple's "Information Needed" request of
10 Oct 2026 (below) and is 3,252 of the field's 4,000 characters:

```
1. SCREEN RECORDING
Attached, recorded on an iPhone running the latest iOS and starting from launch: creating an account, building a page with "Build my page", editing it, publishing, sharing, the live page, analytics, taking the page offline, deleting the account, and signing in with the demo account.
• User-generated content: each person sees and edits only their own pages. The app has no feed, search, messaging, comments or profiles, and no way to view anyone else's page, so there is nothing from other users to report or block in the app. Published pages are public on pitchpage.co. Our terms prohibit illegal and abusive content, we unpublish pages that break them, and anyone can report a page to support@pitchpage.co.
• Paid content: none. Nothing is sold in the app.

2. PURPOSE AND AUDIENCE
PitchPage turns what people usually attach to an application (a résumé, a stat sheet, a bid) into one web page that gets read: their story, their results as figures and charts, an optional intro video, and a design suited to their work. It is for anyone making a pitch: job seekers, students applying to university, athletes contacting coaches, real estate agents, contractors bidding for work and salespeople. Attachments get skimmed or never opened. A PitchPage is one link or QR code that works everywhere, and its analytics show when it was opened.

3. HOW TO USE IT
The demo account is in the Sign-In Information fields and has one published page. There is only one kind of account.
1. Pages → New page. Choose what the page is for, then pick a look.
2. Describe yourself and tap "Build my page" for an AI first draft, or fill it in yourself. A CV is optional (any PDF); no sample files are needed.
3. Tap any section on the page to edit it. Add a photo or a short video from the media buttons.
4. Review → Publish now. Publishing from the app is free, for up to 3 live pages per account; Pages → Take offline makes room.
5. Share: copy the link, show the QR code or make a tracked link. Analytics shows the page's visits.
6. Account → Delete your account removes the account and all its data straight away. Please try it with a new account (email, Sign in with Apple or Google), not the demo account, which review needs.

4. EXTERNAL SERVICES
• Supabase, through Lovable Cloud: accounts and sign-in, the database and file storage.
• Sign in with Apple and Google Sign-In: optional ways to sign in. Both open PitchPage's own sign-in page in a secure sign-in sheet and return to the app.
• pitchpage.co, hosted on Lovable: serves published pages, and draws the page in the builder exactly as visitors will see it.
• Google Gemini, through the Lovable AI Gateway: writes the "Build my page" draft. The app asks for consent first, naming what is sent and where it goes.
• Payments: none in the app. PitchPage is a free companion to the paid PitchPage web service, which hosts the published pages (Guideline 3.1.3(f)). The app has no analytics, advertising or tracking SDKs.

5. REGIONS
The app works the same in every region, with no regional differences in features or content. It is in English.

6. REGULATED INDUSTRY OR PROTECTED MATERIAL
Not applicable. PitchPage isn't in a regulated industry and provides no protected third-party material.
```

### The "Information Needed" request (2.1, 10 Oct 2026)

The first submission came back with *Guideline 2.1 - Information Needed -
New App Submission*. It is not a bug report: Apple asks it of developer
accounts with little review history. It wants, in a reply in App Store
Connect and in the Notes field:

1. a screen recording on a physical device running the latest iOS, starting
   from launch, showing registration, login and account deletion;
2. the app's purpose and audience; 3. how to use it, with the login;
4. the external services it uses; 5. regional differences; 6. any
   regulated-industry paperwork.

The Notes text above answers 2 to 6, and point 1 for user-generated content
and paid features. To reply:

1. **Record with the build being submitted**, installed from TestFlight, on
   an iPhone updated to the latest iOS. Delete the app first so the
   recording opens on onboarding, turn on Do Not Disturb, and start Screen
   Recording from Control Center. Then, in one take:
   1. Open PitchPage from the Home Screen and go through onboarding.
   2. Create an account with Sign in with Apple. It is the quickest; email
      sign-up needs the confirmation email first.
   3. Pages → New page → type a name → Create → choose a type → pick a
      style → describe yourself → Build my page, accept the AI consent, and
      wait for the draft.
   4. Tap a section and change a line; add a portrait from Photos.
   5. Preview your page, then Edit your page; Publish → Publish now (and
      Publish anyway, if it asks); on Share, Copy link, Show a QR code, then
      See it live.
   6. Analytics → the page.
   7. Pages → the page's ⋯ → Take offline.
   8. Account → Delete your account → type DELETE → Delete everything. The
      app returns to Welcome.
   9. Sign in with the demo account's email and password; Pages shows its
      published page.
2. **Attach the video** to the reply in App Store Connect, and upload the same
   file under App Review Information → Attachment.
3. **Paste the Notes text** into the reply and into App Review Information →
   Notes, select the build, and resubmit.

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

### On a Mac, with Xcode — how PitchPage builds

The Apple side is in place: team `S53D2H48PD`, the App ID `co.pitchpage.app`
with Sign in with Apple and Associated Domains, and the App Store Connect
record. The config already carries the team, so nothing needs choosing in
Xcode. The Mac needs Xcode and CocoaPods; the release command installs the
pods itself.

```bash
npm ci
IOS_BUILD_NUMBER=1 npm run ios:release
open ios/PitchPage.xcworkspace
```

In Xcode, pick **Any iOS Device (arm64)**, then **Product → Archive**, then
**Distribute App → App Store Connect → Upload**. The build appears in
TestFlight after Apple processes it.

- **Every upload needs a higher build number:** `IOS_BUILD_NUMBER=2 npm run
  ios:release` for the second, and so on. `ios:release` regenerates the
  project from scratch each time, so a number typed into Xcode does not
  survive it.
- **Never upload from a plain `npx expo prebuild`.** Without the release
  command the project comes out as "PitchPage Dev", `co.pitchpage.app.dev`,
  which matches no App ID.

### Or with EAS, Expo's build service

```bash
npm install -g eas-cli
eas login
eas init
eas build --platform ios --profile production
eas submit --platform ios --latest
```

`eas init` prints a project ID for `extra.eas` in `app.config.ts`. EAS keeps
its own build numbers.

Either way: test the TestFlight build on a real iPhone first (§7), then pick
it on the version page in App Store Connect and **Add for Review**.

---

## 7. TestFlight check before submitting

On a real iPhone, with the TestFlight build — not Expo Go, which cannot test
the native sign-ins:

- [ ] Sign in with Apple, with Google, and with email; sign out and back in.
      Apple and Google open pitchpage.co's sign-in sheet and come back signed in
- [ ] Build my page: the AI consent is asked once; a prompt alone builds a
      draft; a prompt and a CV build one; Cancel stops it
- [ ] Create a page, pick a style, edit sections, move one, delete one
- [ ] Portrait from the camera and from Photos; an intro video
- [ ] Publish a draft on an account with no credits; the live page opens; a
      link on it opens
- [ ] Publish until the limit: the fourth asks you to take a page offline, and
      See your pages goes to Pages
- [ ] Take a page offline from Pages, then publish another
- [ ] No screen mentions credits, a price or buying
- [ ] Share: copy link, share sheet, QR code saved to Photos, tracked link
- [ ] Analytics for the published page
- [ ] Delete a throwaway account: it signs out, and its pages stop loading
- [ ] Dark mode, the largest text size, and airplane mode on a few screens
