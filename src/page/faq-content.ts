import { FREE_LIVE_PAGES } from "@/lib/free-publishing";

/**
 * The FAQ for the current iOS experience. Policy commitments match the
 * website, while feature descriptions reflect what this app can do today.
 *
 * Nothing here names a price, a credit or a refund (2026-10-09). The app sells
 * nothing and publishing from it is free, and pointing people at a purchase
 * outside the app is what Guideline 3.1.3(f) rules out.
 */

export const FAQ_TOPICS = ["What to send", "How it works", "Cost and support"] as const;
export type FaqTopic = (typeof FAQ_TOPICS)[number];

export const FAQ_TOPIC_NOTE: Record<FaqTopic, string> = {
  "What to send": "The format itself, and why it beats a PDF.",
  "How it works": "Getting from a resume file to a live link.",
  "Cost and support": "What's free, and who answers when you write in.",
};

export const FAQS: ReadonlyArray<{ topic: FaqTopic; q: string; a: string }> = [
  {
    topic: "What to send",
    q: "What do you send instead of a resume?",
    a: "A personal pitch page — a single shareable link that shows your achievements, metrics, story, and an optional intro video. In the app, you can upload your resume, build the sections yourself, and publish it free.",
  },
  {
    topic: "What to send",
    q: "What's a modern alternative to a resume?",
    a: "A pitch page (sometimes called a personal pitch site or one-link resume). Unlike a PDF resume it can hold a video introduction, real metrics presented as charts, and a design matched to your work. Building, editing and publishing it in the app are free.",
  },
  {
    topic: "What to send",
    q: "How do I stand out when everyone uses AI to write resumes?",
    a: "Change the format, not just the words. When every resume is AI-polished text on the same template, the differentiators are things a PDF can't carry: a 60–90 second video of you speaking, your numbers shown as evidence rather than bullet points, and a page designed for your specific role. That's what a pitch page does — recruiters open a link and meet a person, not a document.",
  },
  {
    topic: "How it works",
    q: "How do I make a personal website to send to employers?",
    a: "With PitchPage, start with your resume, arrange your achievements and story into sections, pick a visual style, and optionally add a portrait or short intro video. Then publish it free, at one shareable link. No coding is needed.",
  },
  {
    topic: "How it works",
    q: "Is there a tool that turns my resume into a shareable page with video?",
    a: "Yes — PitchPage lets you attach your resume PDF, build a page with sections for your achievements and story, and add an optional video introduction. Building, editing and publishing are free in the app.",
  },
  {
    topic: "Cost and support",
    q: "What does the app cost?",
    a: `Nothing. Build and edit as many pages as you like, and publish them free, with up to ${FREE_LIVE_PAGES} live at a time. There's no subscription.`,
  },
  {
    topic: "Cost and support",
    q: "How do I get help?",
    a: "Email support@pitchpage.co with questions or anything that isn't working. A real person, the founder, reads every message. To delete your account, go to Account, then Delete your account.",
  },
];

/** The build steps, as `/how-it-works` presents them. */
export const HOW_IT_WORKS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: "Start with what you have",
    body: "Upload a resume or start with your name, then add the sections that tell your story. You can change them whenever you like.",
  },
  {
    title: "Pick how it looks",
    body: "Thirty styles, each built for a different kind of work, in twenty colours and both light and dark.",
  },
  {
    title: "Add your face and your voice",
    body: "A portrait and a short intro video do more than another paragraph. Both are optional, and both change how the page lands.",
  },
  {
    title: "Publish and share",
    body: `Publishing from the app is free, for up to ${FREE_LIVE_PAGES} live pages at a time. You get a link, a QR code, and a tracked link for each place you send it.`,
  },
  {
    title: "See who opened it",
    body: "Views, how far people read, what they clicked, and which link they came from.",
  },
];
