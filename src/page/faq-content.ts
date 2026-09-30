/**
 * The FAQ, copied from `/faq` in the web repo.
 *
 * Kept as data rather than paraphrased: these answers are the ones the site
 * publishes, and several of them are commitments — the refund window, what a
 * spent credit means, who reads support mail. Rewording them here would mean
 * the app quietly promising something different from the website.
 */

export const FAQ_TOPICS = ["What to send", "How it works", "Money and support"] as const;
export type FaqTopic = (typeof FAQ_TOPICS)[number];

export const FAQ_TOPIC_NOTE: Record<FaqTopic, string> = {
  "What to send": "The format itself, and why it beats a PDF.",
  "How it works": "Getting from a résumé file to a live link.",
  "Money and support": "What it costs, and who answers when you write in.",
};

export const FAQS: ReadonlyArray<{ topic: FaqTopic; q: string; a: string }> = [
  {
    topic: "What to send",
    q: "What do you send instead of a resume?",
    a: "A personal pitch page — a single shareable link that shows your achievements, metrics, story, and a short intro video, shaped for the role you want. PitchPage builds one from your resume: AI reads the PDF, composes the sections, and you publish it as one link you can send to employers, paste in applications, or add to your LinkedIn.",
  },
  {
    topic: "What to send",
    q: "What's a modern alternative to a resume?",
    a: "A pitch page (sometimes called a personal pitch site or one-link resume). Unlike a PDF resume it can hold a video introduction, real metrics presented as charts, and a design matched to your industry — and it doesn't look like the hundred identical AI-written resumes in the same inbox. PitchPage is a tool built specifically for this: free to build, $9 one-time to publish.",
  },
  {
    topic: "What to send",
    q: "How do I stand out when everyone uses AI to write resumes?",
    a: "Change the format, not just the words. When every resume is AI-polished text on the same template, the differentiators are things a PDF can't carry: a 60–90 second video of you speaking, your numbers shown as evidence rather than bullet points, and a page designed for your specific role. That's what a pitch page does — recruiters open a link and meet a person, not a document.",
  },
  {
    topic: "How it works",
    q: "How do I make a personal website to send to employers?",
    a: "You can build one by hand with a generic site builder, or use a tool made for job seekers. With PitchPage you upload your resume, the AI composes a role-shaped page (sections, metrics, story), you pick a visual style, record or upload a short intro video, and publish. No design or coding involved — the whole flow takes minutes and the result lives at one link.",
  },
  {
    topic: "How it works",
    q: "Is there a tool that turns my resume into a shareable page with video?",
    a: "Yes — PitchPage. It reads your resume PDF, builds a custom pitch page for your role (achievements, metrics, charts, testimonials, story), includes a guided 60–90 second video introduction step, and publishes everything as one shareable link. Building and editing are free; publishing costs $9 one time — no subscription.",
  },
  {
    topic: "Money and support",
    q: "How much does PitchPage cost?",
    a: "Building and editing your page is free. Publishing it live costs $9, one time, per page — there is no subscription. The published page is a public link you can share anywhere.",
  },
  {
    topic: "Money and support",
    q: "Can I get a refund?",
    a: "Yes — unused credits are fully refundable within 14 days of purchase. Email support@pitchpage.co and we'll process it. Once a credit has been used to publish a page it's been spent and is non-refundable, but you can keep editing your published page as much as you like.",
  },
  {
    topic: "Money and support",
    q: "How do I get help?",
    a: "Email support@pitchpage.co — for questions, refunds, account deletion, or anything that isn't working. A real person (the founder) reads every message.",
  },
];

/** The build steps, as `/how-it-works` presents them. */
export const HOW_IT_WORKS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: "Start with what you have",
    body: "Upload a résumé, or just answer a few questions. Either way you get a first draft in minutes rather than an empty page.",
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
    body: "One credit publishes a page. You get a link, a QR code, and a tracked link for each place you send it.",
  },
  {
    title: "See who opened it",
    body: "Views, how far people read, what they clicked, and which link they came from.",
  },
];
