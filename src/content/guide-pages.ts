// ─────────────────────────────────────────────────────────────────────────────
// COPIED VERBATIM from the website: src/lib/guide-pages.ts.
//
// The header below is the web file's own. The copy is hand-written editorial
// content that several people have been through, so it is duplicated rather
// than paraphrased — a reworded app version would be a second source of truth
// for the same article. Only this banner is new; nothing below it was changed.
//
// When a guide changes on the site, re-copy the whole file.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Guide pages — hand-written content registry (SEO/GEO anchors) ──────────
// Copy is VERBATIM from Greg's ~/PitchPage/wave2-anchor-copy.md — do not
// rewrite or paraphrase. Inline `[text](/path)` links and `**bold**` are
// rendered to real markup by the /guide/$slug route; FAQ answers feed the
// FAQPage JSON-LD as plain text. The sitemap derives /guide URLs from here.

/** Copy that may contain [text](/path) links and **bold** spans. */
type Inline = string;

export type GuideBlock =
  | { type: "p"; text: Inline }
  | { type: "ul"; items: Inline[] }
  | { type: "ol"; items: Inline[] };

export type GuideSection = { heading: string; blocks: GuideBlock[] };

export const GUIDE_CATEGORIES = ["Getting started", "Job search", "Comparisons", "Research"] as const;
export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

export type GuidePage = {
  slug: string;
  /** Grouping for the /guide hub and its filters. */
  category: GuideCategory;
  title: string;
  metaDescription: string;
  h1: string;
  /** Answer-first (BLUF) intro. */
  intro: Inline;
  sections: GuideSection[];
  faqs: Array<{ q: string; a: string }>;
  /** When present, the route also emits HowTo JSON-LD. Steps are pulled
      verbatim from this guide's own content (how-to guides only). */
  howToSteps?: Array<{ name: string; text: string }>;
  /** Short label for the footer "Guides" row. */
  navLabel: string;
  /** ISO date (YYYY-MM-DD) of the last substantive content update. Rendered
      as a visible "Last updated" line and emitted as Article dateModified —
      freshness is a top AI-citation factor (seo-geo wiki, 2026-06-10). Bump
      it ONLY when the words actually change. */
  updated: string;
};

export const GUIDE_PAGES: Record<string, GuidePage> = {
  "what-to-send-instead-of-a-resume": {
    slug: "what-to-send-instead-of-a-resume",
    category: "Getting started",
    navLabel: "What to send instead of a resume",
    updated: "2026-06-09",
    title: "What to send instead of a resume in 2026 · PitchPage",
    metaDescription:
      "AI flooded every inbox with identical resumes. Here's what to send instead — the alternatives that actually get you noticed in 2026, and how to build one.",
    h1: "What to send instead of a resume in 2026",
    intro:
      "Send a link, not a PDF. By 2026, AI tools have made resumes nearly identical, so a plain one rarely helps you stand out. The strongest alternative is a **pitch page**: one shareable link with your results, a short video, and your story — sent instead of (or alongside) a resume.",
    sections: [
      {
        heading: "Why the resume stopped working in 2026",
        blocks: [
          {
            type: "p",
            text: "AI tools flooded every inbox with the same language and structure. Hiring managers spend seconds per application and can't tell candidates apart, because most resumes now look the same. The problem isn't that resumes are bad — it's that everyone's is interchangeable. To get noticed you need what a PDF can't carry: real numbers in context, a face and a voice, and a story.",
          },
        ],
      },
      {
        heading: "The real alternatives (and when each works)",
        blocks: [
          {
            type: "ul",
            items: [
              "**A polished LinkedIn profile** — a necessary baseline, but generic, and not something you proactively send.",
              "**A portfolio site** — great for designers and developers with visual work; heavy to build, and weak for roles whose value is in results, not artifacts.",
              "**A video introduction** — powerful (puts a face to your name), but a raw video alone lacks context and is awkward to send.",
              "**A personal website builder (Carrd, etc.)** — flexible, but you build it from scratch with no job-search structure.",
              "**A pitch page** — combines the best of these: results as real metrics, a 60-second video, testimonials, and your story on one shareable link, built in minutes. It's purpose-built for the job search.",
            ],
          },
        ],
      },
      {
        heading: "Why a pitch page is the strongest option",
        blocks: [
          {
            type: "p",
            text: "A pitch page is a single web page you send instead of a resume — your headline, your results in numbers, a short intro video, testimonials, and a clear next step, all on one link. It beats the alternatives because it's built *specifically to get you hired*: it leads with proof, adds the human layer a PDF can't, and takes minutes instead of a weekend. (More: [what is a pitch page](/guide/what-is-a-pitch-page).)",
          },
        ],
      },
      {
        heading: "How to make one",
        blocks: [
          {
            type: "ol",
            items: [
              "Start with your resume — AI reads it and drafts your page.",
              "Add your numbers — the results that prove your impact.",
              "Record a 60-second intro video.",
              "Pick a style and publish — you get one link to send everywhere.",
            ],
          },
          {
            type: "p",
            text: "There's a tailored version by role: [nurses](/for/nurses), [sales reps](/for/sales), [software engineers](/for/software-engineers), [marketers](/for/marketing), [teachers](/for/teachers), [executives](/for/executives), [tradespeople](/for/trades), [technicians](/for/technicians), and [recent grads](/for/recent-grads).",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Should I replace my resume entirely?",
        a: "Usually you send both: the pitch-page link is what gets you noticed; the resume or ATS form satisfies the system. Lead with the link in emails, LinkedIn messages, and follow-ups.",
      },
      {
        q: "Do hiring managers actually open links?",
        a: "A short, well-made page with a video stands out against a stack of PDFs — especially on a phone, where most first looks happen.",
      },
      {
        q: "What if I don't have impressive numbers?",
        a: "Lead with trajectory, projects, and a video; clarity and initiative beat length, especially early in your career.",
      },
      {
        q: "How long does it take and what does it cost?",
        a: "Minutes to build with AI. Free to build and edit, $9 one-time to publish.",
      },
    ],
  },
  "what-is-a-pitch-page": {
    slug: "what-is-a-pitch-page",
    category: "Getting started",
    navLabel: "What is a pitch page",
    updated: "2026-08-21",
    title: "What is a pitch page? · PitchPage",
    metaDescription:
      "A pitch page is a single shareable web page you send instead of a resume — results, a video, testimonials, and your story on one link. Here's what's on it and who it's for.",
    h1: "What is a pitch page?",
    intro:
      "A pitch page is a single, shareable web page you send instead of a resume. Instead of a static PDF, it combines your headline, your results, a 60-second video, testimonials, and a call to action — all on one link. Think of it as a personal landing page built to get you hired.",
    sections: [
      {
        heading: "What's on a pitch page",
        blocks: [
          {
            type: "ul",
            items: [
              "A headline and who you are",
              "Results and metrics — your impact in numbers",
              "A 60-second intro video — a face and a voice",
              "An experience timeline",
              "Testimonials — references built in",
              "Your resume/documents and a contact or booking CTA",
            ],
          },
        ],
      },
      {
        heading: "Pitch page vs. resume vs. portfolio vs. LinkedIn",
        blocks: [
          {
            type: "ul",
            items: [
              "**vs. a resume** — a resume is a static PDF that now looks like everyone else's; a pitch page is interactive, leads with results, and includes video.",
              "**vs. a portfolio** — portfolios suit visual or creative work; a pitch page works for any role because it centers results and story, not just artifacts.",
              "**vs. LinkedIn** — LinkedIn is a passive profile everyone has; a pitch page is something you proactively send — tailored, focused, and memorable.",
            ],
          },
        ],
      },
      {
        heading: "Who it's for",
        blocks: [
          {
            type: "p",
            text: "Any job seeker who wants to stand out — especially now that AI has made resumes interchangeable. It's particularly strong for [sales reps](/for/sales), [nurses](/for/nurses), [software engineers](/for/software-engineers), [executives](/for/executives), [tradespeople](/for/trades), and [recent grads](/for/recent-grads).",
          },
        ],
      },
      {
        heading: "How to make one",
        blocks: [
          {
            type: "p",
            text: "With a tool like PitchPage: upload your resume → AI builds the page → add your numbers and a video → pick a style → publish. Free to build, $9 to publish. (See also: [what to send instead of a resume](/guide/what-to-send-instead-of-a-resume).)",
          },
        ],
      },
      {
        heading: "Why the format changed",
        blocks: [
          {
            type: "p",
            text: "The pitch page is a response to a specific shift. Open roles now average [more than 300 applications](https://www.hrdive.com/news/recruiters-see-job-applications-triple-to-more-than-300-per-role/820096/), [49% of job seekers](https://enhancv.com/blog/ai-resume-trends/) say they used AI to write their resume, and [77% of hiring managers](https://resumegenius.com/blog/job-hunting/hiring-insights-report) say many of the resumes they receive appear completely or partially AI-generated. The document didn't get worse. It stopped being a differentiator, because everyone's got better at the same time. (Full numbers: [job search statistics 2026](/guide/job-search-statistics).)",
          },
        ],
      },
      {
        heading: "What it does that a document can't",
        blocks: [
          {
            type: "ul",
            items: [
              "**Carries a voice.** Sixty seconds of you is not something a PDF can hold.",
              "**Shows evidence in context.** A number sits next to the chart and the timeline entry that explain it.",
              "**Reports back.** Every published page counts views, repeat visits, video plays and resume downloads, so you learn whether silence means no or means never opened.",
              "**Stays current.** Edit the content or switch the visual style and the link you already sent still works.",
              "**Holds the documents.** Certificates and transcripts attach privately, with each link signed fresh for the individual viewer.",
            ],
          },
        ],
      },
      {
        heading: "Where people actually send it",
        blocks: [
          {
            type: "ul",
            items: [
              "In the email or LinkedIn message, as the thing you lead with",
              "In the website or portfolio field on an application form",
              "In a follow-up, when you want a second look without resending an attachment",
              "As a separately labelled link per company, so you can tell whose page got opened",
            ],
          },
        ],
      },
      {
        heading: "Not only for job applications",
        blocks: [
          {
            type: "p",
            text: "The same format is used for university applications, athlete recruiting, real estate, contractor bids and sales pitches. Each starting point asks a different set of questions and builds the sections that kind of pitch needs. The common thread doesn't change: someone trying to get a decision out of a person with a stack of near-identical files to get through.",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Is a pitch page the same as a personal website?",
        a: "It's a focused type of personal website built specifically for the job search — lighter and faster than a full portfolio site.",
      },
      {
        q: "Do I still need a resume?",
        a: "Usually yes, for ATS forms — but the pitch page is what gets you noticed. Send both and lead with the link.",
      },
      {
        q: "What makes a good pitch page?",
        a: "Real results, a short genuine video, clean design, and a clear next step.",
      },
      {
        q: "How much does it cost?",
        a: "Free to build and edit, $9 one-time to publish.",
      },
      {
        q: "How long should a pitch page be?",
        a: "Short enough that the first screen on a phone does the work. Lead with the headline, the video and two or three numbers, and let the timeline and testimonials sit below for anyone who wants more.",
      },
      {
        q: "Do I have to record a video?",
        a: "No, the page works without one. But it's the part a document can't copy and the part people remember, so it's worth the awkward first take.",
      },
      {
        q: "Can I have more than one?",
        a: "Yes, and tailoring per role is the common pattern. Publishing is $9 per page, or $39 for a five-page pack.",
      },
      {
        q: "Is there anything to keep paying?",
        a: "No. There's no subscription to cancel — publishing is a one-time $9 per page, and credits never expire.",
      },
    ],
  },
  // ── Comparison guides: copy VERBATIM from Greg's
  //    ~/PitchPage/wave2-comparison-copy.md — honest/fair tone, do not
  //    rewrite or disparage competitors. ──
  "pitch-page-vs-resume": {
    slug: "pitch-page-vs-resume",
    category: "Comparisons",
    navLabel: "Pitch page vs. resume",
    updated: "2026-08-21",
    title: "Pitch page vs. resume · PitchPage",
    metaDescription:
      "A resume is a static PDF; a pitch page is a shareable link with results, video, and story. Here's how they compare and when to use each.",
    h1: "Pitch page vs. resume",
    intro:
      "A resume is a static PDF of your history; a pitch page is an interactive web page that leads with your results, adds a 60-second video, and tells your story on one link. In 2026, with AI making resumes look identical, the pitch page helps you stand out — though you'll often use both.",
    sections: [
      {
        heading: "The core difference",
        blocks: [
          {
            type: "p",
            text: "A **resume** is a one- or two-page document, usually a PDF, optimized for ATS systems and quick skimming — and required by most application forms. A **pitch page** is a web page you proactively send (in an email, a LinkedIn message, or an application) — it shows results as real numbers, includes video and testimonials, and is impossible to confuse with anyone else's.",
          },
        ],
      },
      {
        heading: "Side by side",
        blocks: [
          {
            type: "ul",
            items: [
              "**Format:** PDF document vs. shareable link",
              "**Stands out today:** low (AI made resumes uniform) vs. high",
              "**Shows results in context:** limited vs. yes (metrics, charts)",
              "**Video / voice:** no vs. yes (60-second intro)",
              "**Testimonials built in:** no vs. yes",
              "**ATS application forms:** yes vs. that's the resume's job",
              "**Time to make:** varies vs. minutes with AI",
              "**Cost:** usually free vs. free to build, $9 to publish",
            ],
          },
        ],
      },
      {
        heading: "So which should you use?",
        blocks: [
          {
            type: "p",
            text: "Both — strategically. Keep a clean resume for ATS forms, and **lead with your pitch-page link** wherever a human will see it: the email, the LinkedIn DM, the follow-up. The resume satisfies the system; the pitch page gets you remembered. If you only have time for one thing to make you stand out, make it the pitch page. (See [what to send instead of a resume](/guide/what-to-send-instead-of-a-resume).)",
          },
        ],
      },
      {
        heading: "What the numbers say about the resume's problem",
        blocks: [
          {
            type: "p",
            text: "This isn't a style argument. Open roles now average [more than 300 applications](https://www.hrdive.com/news/recruiters-see-job-applications-triple-to-more-than-300-per-role/820096/). [49% of job seekers](https://enhancv.com/blog/ai-resume-trends/) say they used AI to write their resume, and [77% of hiring managers](https://resumegenius.com/blog/job-hunting/hiring-insights-report) say many of the ones they receive appear completely or partially AI-generated. The resume still works as a record. It has stopped working as a way to get picked out.",
          },
          {
            type: "p",
            text: "Worth naming the myth here too, because it drives a lot of bad advice: the claim that ATS software auto-rejects 75% of resumes has no study behind it. What research does show is that rigid criteria written by people screen out qualified candidates, with [88% of employers](https://www.hbs.edu/managing-the-future-of-work/Documents/research/hiddenworkers09032021.pdf) agreeing that happens. Keyword-stuffing the PDF isn't the fix. Being memorable to the human on the other side is.",
          },
        ],
      },
      {
        heading: "What each one is good at",
        blocks: [
          {
            type: "p",
            text: "**The resume is good at** getting through an upload field, being parsed, surviving a fifteen-second skim, and being forwarded as an attachment inside a company that runs on attachments.",
          },
          {
            type: "p",
            text: "**The pitch page is good at** surviving the skim. It leads with the result rather than the job title, puts a face and a voice on the claim, and gives whoever opened it something to react to instead of something to file.",
          },
        ],
      },
      {
        heading: "When the page is clearly the better send",
        blocks: [
          {
            type: "ul",
            items: [
              "A cold email or LinkedIn message, where there's no form and no upload field",
              "A referral, where someone is forwarding you internally and you want them to look good doing it",
              "A career change, where the job titles don't tell the story and the throughline needs explaining",
              "A follow-up, where resending the same PDF reads as nagging and a link doesn't",
              "Any shortlist being cut on impressions rather than credentials",
            ],
          },
        ],
      },
      {
        heading: "When the resume is still the right answer",
        blocks: [
          {
            type: "ul",
            items: [
              "The portal requires a document upload. Give it a clean, parseable one.",
              "The recruiter asked for a resume specifically. Send it, and put the link in the same email.",
              "Internal processes that run on attachments, where a link may not survive being forwarded around.",
            ],
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Can a pitch page replace my resume?",
        a: "For getting noticed by a human, yes; for ATS application forms, keep the resume. Send both, lead with the link.",
      },
      {
        q: "Do recruiters prefer one?",
        a: "Recruiters skim resumes out of habit, but a pitch page with a video is what they remember and forward.",
      },
      {
        q: "Isn't a resume more professional?",
        a: "A clean pitch page reads as more prepared and modern, not less — it shows initiative.",
      },
      {
        q: "What does it cost?",
        a: "Most resume builders are free; PitchPage is free to build, $9 once to publish.",
      },
      {
        q: "Will a hiring manager think a pitch page is trying too hard?",
        a: "That risk is real if the page is all design and no substance. It disappears the moment the page opens with a specific result rather than a slogan. Lead with evidence and the format reads as prepared, not pushy.",
      },
      {
        q: "Which do I send if they only asked for one?",
        a: "Send what they asked for, and put the other one inside it. If they asked for a resume, attach it and include the link in the body of the email.",
      },
    ],
  },
  "pitchpage-vs-carrd": {
    slug: "pitchpage-vs-carrd",
    category: "Comparisons",
    navLabel: "PitchPage vs. Carrd",
    updated: "2026-08-21",
    title: "PitchPage vs. Carrd: which for a job-search page?",
    metaDescription:
      "Carrd is a flexible single-page site builder; PitchPage is purpose-built for job seekers — resume import, AI, video, and who-viewed analytics. Compared for 2026.",
    h1: "PitchPage vs. Carrd",
    intro:
      "Carrd is a great low-cost builder for simple single-page websites. PitchPage is purpose-built for one job: turning your resume into a [pitch page](/guide/what-is-a-pitch-page) that gets you hired — AI reads your resume, builds role-shaped sections and a 60-second video, and shows you who opened the link. Want a blank canvas? Carrd. Want a job-ready page in minutes for a one-time $9? PitchPage.",
    sections: [
      {
        heading: "What each is for",
        blocks: [
          {
            type: "p",
            text: "**Carrd** is a flexible, inexpensive tool for building simple one-page sites — landing pages, link-in-bio, personal cards. You design it from scratch; it isn't job-search-specific and has no resume import or AI. **PitchPage** is built specifically for job seekers: upload your resume, AI drafts the page, it shapes the sections to your role (results as evidence, a video introduction, testimonials), and you publish a shareable link with built-in analytics that show when an employer opens it. (On the format itself: [what to send instead of a resume](/guide/what-to-send-instead-of-a-resume).)",
          },
        ],
      },
      {
        heading: "Side by side",
        blocks: [
          {
            type: "ul",
            items: [
              "**Purpose:** any one-page site vs. a job-search pitch page",
              "**Resume import / AI:** no vs. yes",
              "**Role-shaped content:** no (you build it) vs. yes (AI, per role)",
              "**Video hero / intro:** do-it-yourself vs. built in",
              "**Who-viewed analytics:** not built for the job search vs. built in on every published page",
              "**Time to a job-ready page:** longer (design it yourself) vs. minutes",
              "**Pricing (checked August 2026):** yearly plans at $9, $19 or $49 per year, plus a free plan for up to three sites vs. free to build, $9 one-time to publish",
            ],
          },
        ],
      },
      {
        heading: "Who should pick which",
        blocks: [
          {
            type: "p",
            text: "Pick **Carrd** if you want full design control for a generic one-pager and enjoy building it yourself. Pick **PitchPage** if you want a polished, role-tailored page ready to send to employers without starting from a blank canvas — the resume you already have becomes the page, video and all. If you're weighing a website purely for the job hunt, see [how to make a personal website for your job search](/guide/how-to-make-a-personal-website-for-job-search).",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Can't I just build my pitch page on Carrd?",
        a: "You can build *a* page, but you'd design it from scratch with no resume import, AI, or job-search structure. PitchPage does that work for you.",
      },
      {
        q: "Is Carrd cheaper?",
        a: "Carrd bills yearly: $9, $19 or $49 per year depending on tier, with a free plan covering up to three sites (checked August 2026). PitchPage is free to build and a one-time $9 to publish, with no subscription.",
      },
      {
        q: "Which looks more professional for jobs?",
        a: "PitchPage's styles are built for hiring contexts; a Carrd page depends on your own design skills.",
      },
      {
        q: "Can I see when an employer opens my page?",
        a: "With PitchPage, yes — every published page has built-in analytics that show when someone opened your link and how they engaged. A hand-built Carrd site isn't set up for that out of the box.",
      },
    ],
  },
  "pitchpage-vs-flowcv": {
    slug: "pitchpage-vs-flowcv",
    category: "Comparisons",
    navLabel: "PitchPage vs. FlowCV",
    updated: "2026-08-21",
    title: "PitchPage vs. FlowCV: resume builder vs. pitch page",
    metaDescription:
      "FlowCV builds a polished PDF resume; PitchPage builds a shareable page you send instead of a PDF. They solve different problems — here's how they fit together.",
    h1: "PitchPage vs. FlowCV",
    intro:
      "FlowCV is an excellent free resume builder — it makes a clean, ATS-friendly PDF. PitchPage makes something different: a shareable web page you send *instead of* a PDF, with your results, a video, and your story. They aren't really competitors — many use FlowCV for the resume and PitchPage for the link they send.",
    sections: [
      {
        heading: "What each is for",
        blocks: [
          {
            type: "p",
            text: "**FlowCV** is a free, ATS-friendly resume and cover-letter builder; the output is a polished PDF document. **PitchPage** turns that experience into an interactive, shareable page (results, a 60-second video, testimonials) you send to stand out beyond the PDF.",
          },
        ],
      },
      {
        heading: "Side by side",
        blocks: [
          {
            type: "ul",
            items: [
              "**Output:** a PDF resume/CV vs. a shareable web page + link",
              "**Best for:** a clean ATS resume vs. standing out beyond the resume",
              "**Video / interactive:** no vs. yes",
              "**ATS application forms:** yes vs. the resume handles ATS; the page is for humans",
              "**Pricing (checked August 2026):** free for one resume and one cover letter, with unlimited downloads and no watermark; paid plans unlock multiple saved versions, with no price published on FlowCV's site vs. free to build, $9 to publish",
            ],
          },
        ],
      },
      {
        heading: "Use them together",
        blocks: [
          {
            type: "p",
            text: "The smart move: build a clean resume in FlowCV for application forms, then make a PitchPage for the link you lead with in emails, LinkedIn, and follow-ups. The resume satisfies the ATS; the pitch page gets you remembered.",
          },
        ],
      },
      {
        heading: "Why the PDF still matters",
        blocks: [
          {
            type: "p",
            text: 'Worth being straight about this, because a lot of "the resume is dead" writing isn\'t. Most application portals still require a document upload, and a clean, parseable PDF is how you get through that step. FlowCV is genuinely good at producing one. Nothing on a pitch page replaces that.',
          },
          {
            type: "p",
            text: "What the document can't do is compete for attention. Open roles now average [more than 300 applications](https://www.hrdive.com/news/recruiters-see-job-applications-triple-to-more-than-300-per-role/820096/), and [77% of hiring managers](https://resumegenius.com/blog/job-hunting/hiring-insights-report) say many of the resumes they receive appear completely or partially AI-generated. Your PDF isn't being compared against a bad PDF. It's being compared against three hundred good ones.",
          },
        ],
      },
      {
        heading: "What changes when you send a link instead",
        blocks: [
          {
            type: "ul",
            items: [
              "**A face and a voice.** A 60-second introduction is the one thing a PDF physically cannot carry.",
              "**Numbers in context.** A metric on a page sits next to the chart, the timeline entry and the testimonial that back it up.",
              "**You find out what happened.** Every published page reports views, repeat visits, video plays and resume downloads, per tracked link.",
              "**It updates without a resend.** Edit the content or switch the visual style and the link you already sent still works.",
            ],
          },
        ],
      },
      {
        heading: "A workflow that uses both",
        blocks: [
          {
            type: "ol",
            items: [
              "Build the resume in FlowCV and keep it clean and parseable. That's what the portal gets.",
              "Upload that same resume to PitchPage and let it compose the page. Add your numbers and record the video.",
              "Put the PitchPage link in the email, the LinkedIn message, and the website field on the application form.",
              "Follow up first on the links that actually got opened.",
            ],
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Do I have to choose?",
        a: "No — they solve different problems. Use FlowCV for the PDF, PitchPage for the page you send.",
      },
      {
        q: "Is FlowCV free?",
        a: "Yes. The free plan covers one resume and one cover letter with unlimited downloads and no watermark; saving multiple versions requires a paid plan, and FlowCV does not publish that price on its site (checked August 2026). PitchPage is free to build, $9 once to publish.",
      },
      {
        q: "Which gets more interviews?",
        a: "The resume gets you through the form; the pitch page is what makes a human remember you.",
      },
      {
        q: "Can I upload a FlowCV PDF straight into PitchPage?",
        a: "Yes. That's the intended path — the resume you already have is the input, and the AI composes the page from it. You don't start from a blank canvas.",
      },
      {
        q: "Will sending a pitch page hurt me with an ATS?",
        a: "No, because it isn't what the ATS reads. The PDF goes in the upload field, the link goes in the website or cover-letter field. They're doing different jobs.",
      },
      {
        q: "Does PitchPage generate a resume PDF too?",
        a: "No. It publishes a page, and it can host the resume you already have as a download on that page. Keep FlowCV for the document itself.",
      },
    ],
  },
  // ── How-to / question guides: copy VERBATIM from Greg's
  //    ~/PitchPage/wave2-howto-copy.md — genuinely answer the question;
  //    PitchPage woven in honestly. Do not rewrite. ──
  "how-to-stand-out-in-job-applications": {
    slug: "how-to-stand-out-in-job-applications",
    category: "Job search",
    navLabel: "How to stand out",
    updated: "2026-06-09",
    title: "How to stand out in job applications in 2026 · PitchPage",
    metaDescription:
      "Practical ways to stand out when AI has made every resume look the same — tailoring, results, video, and sending a pitch page. Real tactics, not clichés.",
    h1: "How to stand out in job applications in 2026",
    intro:
      "The fastest way to stand out in 2026 is to send what other applicants don't: a personal pitch page — one link with your results, a short video, and your story — instead of the same AI-written resume everyone submits. Then tailor each application, lead with results, and follow up.",
    sections: [
      {
        heading: "1. Send a link, not just a PDF",
        blocks: [
          {
            type: "p",
            text: "AI made resumes interchangeable. A pitch page (your metrics, a 60-second video, testimonials, one link) is the single biggest differentiator because almost no one else does it. (See [what to send instead of a resume](/guide/what-to-send-instead-of-a-resume).)",
          },
        ],
      },
      {
        heading: "2. Lead with results, not duties",
        blocks: [
          {
            type: "p",
            text: 'Open with your strongest numbers ("142% of quota," "cut CLABSI to zero for 14 months"), not a list of responsibilities.',
          },
        ],
      },
      {
        heading: "3. Add a human element",
        blocks: [
          {
            type: "p",
            text: "A short intro video puts a face and voice to your name; most candidates never do it, which is why it stands out.",
          },
        ],
      },
      {
        heading: "4. Tailor, briefly",
        blocks: [
          {
            type: "p",
            text: "You don't need a new resume per job, but a line or two showing you understand *this* role beats a generic blast.",
          },
        ],
      },
      {
        heading: "5. Follow up like a professional",
        blocks: [
          {
            type: "p",
            text: "A short, specific follow-up (with your pitch-page link) a few days later keeps you top of mind without being pushy.",
          },
        ],
      },
      {
        heading: "6. Make it easy to say yes",
        blocks: [
          {
            type: "p",
            text: "A clear next step — a calendar link, a direct email — removes friction for a busy recruiter.",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "What's the #1 thing that makes you stand out?",
        a: "Sending something other people don't: a pitch page with results and a video, instead of just another PDF.",
      },
      {
        q: "Do I need a different resume for every job?",
        a: "No — tailor a line or two, and lead with a pitch page that does the standing-out for you.",
      },
      {
        q: "Does a video really help?",
        a: "Yes — it's memorable and most candidates skip it; 60 seconds is enough.",
      },
      {
        q: "How do I stand out with little experience?",
        a: "Lead with projects, potential, and a video. (See [recent grads](/for/recent-grads).)",
      },
    ],
    howToSteps: [
      {
        name: "Send a link, not just a PDF",
        text: "AI made resumes interchangeable. A pitch page (your metrics, a 60-second video, testimonials, one link) is the single biggest differentiator because almost no one else does it.",
      },
      {
        name: "Lead with results, not duties",
        text: 'Open with your strongest numbers ("142% of quota," "cut CLABSI to zero for 14 months"), not a list of responsibilities.',
      },
      {
        name: "Add a human element",
        text: "A short intro video puts a face and voice to your name; most candidates never do it, which is why it stands out.",
      },
      {
        name: "Tailor, briefly",
        text: "You don't need a new resume per job, but a line or two showing you understand this role beats a generic blast.",
      },
      {
        name: "Follow up like a professional",
        text: "A short, specific follow-up (with your pitch-page link) a few days later keeps you top of mind without being pushy.",
      },
      {
        name: "Make it easy to say yes",
        text: "A clear next step — a calendar link, a direct email — removes friction for a busy recruiter.",
      },
    ],
  },
  "how-to-make-a-personal-website-for-job-search": {
    slug: "how-to-make-a-personal-website-for-job-search",
    category: "Job search",
    navLabel: "Personal website for job search",
    updated: "2026-08-21",
    title: "How to make a personal website for job search · PitchPage",
    metaDescription:
      "You don't need to code or spend a weekend. Here's how to make a job-search personal website — a pitch page — in minutes, and what to put on it.",
    h1: "How to make a personal website for your job search",
    intro:
      "You don't need to code or spend a weekend. The fastest way to make a personal website for your job search is a pitch page: upload your resume, let AI draft it, add your numbers and a 60-second video, pick a style, and publish a shareable link — minutes, not days.",
    sections: [
      {
        heading: "What to put on it",
        blocks: [
          {
            type: "ul",
            items: [
              "A clear headline (role + value)",
              "Your results in numbers",
              "A 60-second intro video",
              "An experience timeline",
              "Testimonials",
              "Your resume/documents + a contact or booking link",
            ],
          },
        ],
      },
      {
        heading: "The fast way (minutes, no code)",
        blocks: [
          {
            type: "ol",
            items: [
              "Upload your resume — AI reads it and builds the first draft.",
              "Add your metrics and a short video.",
              "Pick a style (light/dark, your color).",
              "Publish — you get one link to send everywhere.",
            ],
          },
          {
            type: "p",
            text: "(That's what PitchPage does — see [what is a pitch page](/guide/what-is-a-pitch-page).)",
          },
        ],
      },
      {
        heading: "The DIY way (longer)",
        blocks: [
          {
            type: "p",
            text: "Tools like Carrd or a general website builder let you build a one-pager from scratch — more control, but you design and write everything yourself with no job-search structure. (See [PitchPage vs. Carrd](/guide/pitchpage-vs-carrd).)",
          },
        ],
      },
      {
        heading: "Tips that matter",
        blocks: [
          {
            type: "p",
            text: "Lead with results, keep it scannable, make the video genuine, and make sure it looks great on mobile — most recruiters open links on a phone.",
          },
        ],
      },
      {
        heading: "What usually goes wrong with the DIY version",
        blocks: [
          {
            type: "ul",
            items: [
              "**The blank canvas.** Design tools give you total freedom and no structure, and a job-search page has a structure that works.",
              "**It never ships.** A weekend project competing with an active job search usually loses.",
              "**It reads as a portfolio, not a pitch.** Portfolios show artifacts. A hiring manager wants results and a reason to call.",
              "**No mobile pass.** Most recruiters open links on a phone, and a desktop-first layout gives itself away in two seconds.",
              "**No feedback.** You send it and hear nothing, which is the exact problem you were trying to solve.",
            ],
          },
        ],
      },
      {
        heading: "Check these before you send it",
        blocks: [
          {
            type: "ol",
            items: [
              "Open it on your phone first. If you have to pinch to read anything, fix that before anything else.",
              "Read the first screen out loud. If it doesn't say what you do and what you're worth in the first two lines, rewrite it.",
              "Make sure every number on it is one you can defend in a room.",
              "Give it one clear next step. A booking link or an email, not four competing buttons.",
              "Send it to one friend and ask them what you do. If they get it wrong, the page is wrong.",
            ],
          },
        ],
      },
      {
        heading: "What it costs, either way",
        blocks: [
          {
            type: "p",
            text: "Building on PitchPage is free, including trying every visual style against your own content. Publishing is $9 once for one page, or $39 for a five-page pack if you're tailoring per role. Credits never expire, and unused ones are refundable within 14 days.",
          },
          {
            type: "p",
            text: "The DIY route costs a domain plus whatever the builder charges annually, plus your weekend. [Carrd](/guide/pitchpage-vs-carrd), a common pick, runs $9, $19 or $49 per year depending on tier, with a free plan for up to three sites (checked August 2026). The money is rarely the deciding factor. The weekend is.",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Do I need to know how to code?",
        a: "No — with a pitch-page tool, AI builds it from your resume in minutes.",
      },
      {
        q: "What should the URL be?",
        a: "A clean link with your name; you send it in applications, email, and LinkedIn.",
      },
      {
        q: "How long does it take?",
        a: "Minutes with AI; a weekend if you build from scratch.",
      },
      {
        q: "How much does it cost?",
        a: "Free to build, $9 once to publish with PitchPage.",
      },
      {
        q: "Do I need my own domain?",
        a: "No. A published page comes with its own link you can send anywhere. A custom domain is a nice-to-have, not a prerequisite for applying.",
      },
      {
        q: "Should I put my address or phone number on it?",
        a: "No. You're handing this link to strangers. A contact email or a booking link is enough, and it's what the page is built around.",
      },
      {
        q: "What if I don't have impressive numbers?",
        a: "Use the real ones. A page that says exactly what you did, at the size you did it, reads better than vague superlatives. PitchPage won't let the AI round, estimate or invent a figure that isn't in the material you uploaded — deliberately, because you're the one who has to defend it.",
      },
    ],
    howToSteps: [
      {
        name: "Upload your resume",
        text: "Upload your resume — AI reads it and builds the first draft.",
      },
      {
        name: "Add your metrics and a short video",
        text: "Add your metrics and a short video.",
      },
      { name: "Pick a style", text: "Pick a style (light/dark, your color)." },
      {
        name: "Publish",
        text: "Publish — you get one link to send everywhere.",
      },
    ],
  },
  "how-to-record-an-intro-video-for-a-job": {
    slug: "how-to-record-an-intro-video-for-a-job",
    category: "Getting started",
    navLabel: "Record an intro video",
    updated: "2026-06-09",
    title: "How to record an intro video for a job · PitchPage",
    metaDescription:
      "A simple, practical guide to recording a short intro video for job applications — what to say, how to look, and the gear-free setup that works.",
    h1: "How to record a 60-second intro video for a job application",
    intro:
      "A 60-second intro video is one of the most powerful — and least-used — ways to stand out in a job search. You don't need gear or talent; you need good light, a steady phone, and a simple script that feels natural, not awkward.",
    sections: [
      {
        heading: "What to say (a simple script)",
        blocks: [
          {
            type: "ol",
            items: [
              "Who you are (name + role) — about 5 seconds",
              "Your strongest proof — one result or story — about 20 seconds",
              "What you're looking for / why this kind of role — about 20 seconds",
              "A warm close and invite to connect — about 10 seconds",
            ],
          },
          {
            type: "p",
            text: "Keep it to 60–90 seconds. Conversational beats scripted.",
          },
        ],
      },
      {
        heading: "How to set it up (no gear needed)",
        blocks: [
          {
            type: "ul",
            items: [
              "**Light from the front** — face a window or lamp; never have the light behind you.",
              "**Camera at eye level** — prop your phone up; looking down reads as distant.",
              "**Look at the lens** — not at yourself on screen; the lens is the hiring manager's eyes.",
              "**Film horizontal** — landscape fits most pages and screens.",
              "**Quiet room, steady phone** — lean it on something solid; kill background noise.",
              "**Dress for the role** — what you'd wear to the interview.",
            ],
          },
        ],
      },
      {
        heading: "Tips",
        blocks: [
          {
            type: "p",
            text: "One good take is enough — warmth wins over polish. Smile, breathe, and talk like you're meeting someone. If you stumble, just restart; you'll relax by take two.",
          },
        ],
      },
      {
        heading: "Where to put it",
        blocks: [
          {
            type: "p",
            text: "Embed it at the top of your pitch page so a hiring manager meets you before the interview. (See [what is a pitch page](/guide/what-is-a-pitch-page).)",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "How long should it be?",
        a: "60–90 seconds. Short and genuine beats long and polished.",
      },
      {
        q: "What if I'm camera-shy?",
        a: "Use the script, do a couple of takes, and remember most candidates skip this entirely — even an imperfect video stands out.",
      },
      {
        q: "Do I need a good camera?",
        a: "No — a phone with good light and steady framing is plenty.",
      },
      {
        q: "What should I say?",
        a: "Who you are, one proof point, what you want, and a warm close.",
      },
    ],
    howToSteps: [
      {
        name: "Who you are",
        text: "Who you are (name + role) — about 5 seconds",
      },
      {
        name: "Your strongest proof",
        text: "Your strongest proof — one result or story — about 20 seconds",
      },
      {
        name: "What you're looking for",
        text: "What you're looking for / why this kind of role — about 20 seconds",
      },
      {
        name: "A warm close",
        text: "A warm close and invite to connect — about 10 seconds",
      },
    ],
  },
  "do-recruiters-read-cover-letters": {
    slug: "do-recruiters-read-cover-letters",
    category: "Job search",
    navLabel: "Do recruiters read cover letters",
    updated: "2026-08-21",
    title: "Do recruiters read cover letters in 2026? · PitchPage",
    metaDescription:
      "An honest answer on whether cover letters still matter in 2026 — when they help, when they don't, and what to send instead to actually get noticed.",
    h1: "Do recruiters actually read cover letters in 2026?",
    intro:
      "Honestly? Most recruiters skim cover letters at best, and many skip them entirely — especially generic, AI-written ones. They still matter occasionally (career changes, small companies, when required), but rarely get you noticed. Better: lead with proof — a short, specific note plus a pitch-page link showing your results and a video.",
    sections: [
      {
        heading: "When cover letters still help",
        blocks: [
          {
            type: "ul",
            items: [
              "When the application requires one — don't skip it then.",
              "For career changes or gaps, where context helps.",
              "At smaller companies and for senior roles, where a thoughtful note is read more often.",
            ],
          },
        ],
      },
      {
        heading: "When they don't",
        blocks: [
          {
            type: "ul",
            items: [
              "Generic, templated, or obviously AI-written letters add nothing.",
              "For high-volume roles, most are never read.",
            ],
          },
        ],
      },
      {
        heading: "What to do instead (or alongside)",
        blocks: [
          {
            type: "ul",
            items: [
              "Write a short, specific note — 3–4 sentences that show you understand the role, not a page of fluff.",
              "**Lead with proof:** include your pitch-page link so the recruiter can see your results and meet you in a 60-second video. That does more than any cover letter. (See [what to send instead of a resume](/guide/what-to-send-instead-of-a-resume).)",
            ],
          },
        ],
      },
      {
        heading: "What recruiters are actually reacting to",
        blocks: [
          {
            type: "p",
            text: "The pressure on a cover letter changed because the volume around it changed. Open roles now average [more than 300 applications](https://www.hrdive.com/news/recruiters-see-job-applications-triple-to-more-than-300-per-role/820096/), and [77% of hiring managers](https://resumegenius.com/blog/job-hunting/hiring-insights-report) say many of the resumes they receive appear completely or partially AI-generated. A cover letter written with the same tools, in the same register, doesn't read as effort. It reads as more of the same. (The full picture: [job search statistics 2026](/guide/job-search-statistics).)",
          },
          {
            type: "p",
            text: "That's the real reason skim rates are low. It isn't that recruiters stopped caring about writing. It's that generic writing stopped carrying information.",
          },
        ],
      },
      {
        heading: "How to write one that actually gets read",
        blocks: [
          {
            type: "ol",
            items: [
              "Name the specific thing. One sentence that could only be about this role at this company. If you can send it to a second employer unchanged, it isn't that sentence.",
              'Give one piece of evidence with a number in it. Not "improved efficiency" — the actual figure, and what it was before.',
              "Say what you'd do first. Ninety days, concrete, in one line.",
              "Stop. Three or four specific sentences is the whole letter.",
            ],
          },
          {
            type: "p",
            text: "If you can write the opening line without looking at the job posting, you're writing a template. Start again.",
          },
        ],
      },
      {
        heading: "Where the cover letter sits next to a pitch page",
        blocks: [
          {
            type: "p",
            text: "A cover letter argues. A [pitch page](/guide/what-is-a-pitch-page) shows. The letter says you led a team through a migration; the page shows the timeline, the numbers behind it, and sixty seconds of you explaining it in your own voice. Send the short note, put the link inside it, and let the page carry the weight the letter can't.",
          },
          {
            type: "p",
            text: "The page also answers something the letter never will: whether any of it was opened. Every published PitchPage link reports views, repeat visits, video plays and resume downloads, so your follow-up is informed rather than hopeful.",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Should I still write a cover letter?",
        a: "Write a short, specific one when it's required or genuinely adds context; otherwise put that energy into a strong pitch page.",
      },
      {
        q: "Are AI-written cover letters bad?",
        a: "Generic ones are easy to spot and add nothing. If you use AI, make it specific and human.",
      },
      {
        q: "What gets noticed more than a cover letter?",
        a: "A short personal note plus a pitch-page link with results and a video.",
      },
      {
        q: "How long should a cover letter be?",
        a: "Short — 3–4 specific sentences beat a full page.",
      },
      {
        q: "Will an ATS reject me for skipping the cover letter?",
        a: "If the field is optional, no. If it's required, an empty field can block the submission, so fill it. What doesn't help is pasting a generic letter into a required field and counting that as effort.",
      },
      {
        q: "Should I write a different one for every application?",
        a: "If you're writing them at all, yes. A reused letter is worse than none, because it signals volume rather than interest. Three specific sentences per application beats one polished page sent forty times.",
      },
      {
        q: "What if they ask for a cover letter and I'd rather send a pitch page?",
        a: "Do both. Put the short letter in the field they asked for and the link inside it. Including the link costs you nothing and makes your work easier to see.",
      },
    ],
  },
  // ── Wave 3: competitor comparison pages (2026-06-10) ──────────────────────
  // Copy verbatim from ~/PitchPage/wave3-comparison-copy.md. Pricing facts
  // verified against each competitor's pricing page on 2026-06-10 — re-verify
  // when bumping `updated`.
  // Statistics page — the citation magnet (original-data interim, 2026-06-10).
  // Every number is attributed in-text; refresh stats + bump `updated` monthly.
  "job-search-statistics": {
    slug: "job-search-statistics",
    category: "Research",
    navLabel: "Job search statistics",
    updated: "2026-08-21",
    title: "Job search statistics 2026: what candidates face",
    metaDescription:
      "The 2026 job search by the numbers: applications per opening, AI resume saturation, interview conversion, and time-to-hire. Every figure links to its primary source, and the debunked ones are called out.",
    h1: "Job search statistics 2026",
    intro:
      "The 2026 job market in one sentence: far more applications chasing each opening, a large share of them AI-written, and rigid screening criteria filtering people out before anyone reads closely. Open roles now average **more than 300 applications**, **49% of job seekers** say they used AI to write their resume, and **77% of hiring managers** say many of the resumes they receive look AI-generated. Every figure below links to its primary source, and where a widely-repeated number turned out to have no study behind it, we say so instead of repeating it.",
    sections: [
      {
        heading: "Competition per opening",
        blocks: [
          {
            type: "ul",
            items: [
              "Open roles now receive an average of [**more than 300 applications**](https://www.hrdive.com/news/recruiters-see-job-applications-triple-to-more-than-300-per-role/820096/), and applications per hire have tripled since 2021 (Ashby research released May 2026, drawn from over 100 million applications across 200,000 jobs). Remote roles draw materially more: Ashby found remote startup jobs received [**42% more inbound applications**](https://www.ashbyhq.com/talent-trends-report/reports/startup-hiring) than in-office ones.",
              "Reaching an interview is harder than it was. Ashby reports that [**for every hire made, 15 applicants receive an interview**](https://www.ashbyhq.com/talent-trends-report/reports/startup-hiring), and that candidates are [**about 50% less likely to reach the interview stage**](https://www.hrdive.com/news/recruiters-see-job-applications-triple-to-more-than-300-per-role/820096/) than they were five years ago. Jobvite's own funnel data put the [application-to-interview rate at **8.4%**](https://www.jobvite.com/blog/recruiting-funnel/).",
            ],
          },
        ],
      },
      {
        heading: "The AI resume flood",
        blocks: [
          {
            type: "ul",
            items: [
              "[**77% of hiring managers**](https://resumegenius.com/blog/job-hunting/hiring-insights-report) say many of the resumes they receive appear completely or partially AI-generated (Resume Genius, 2026 Hiring Insights Report, January 2026, 1,000 U.S. hiring managers).",
              "[**49% of job seekers**](https://enhancv.com/blog/ai-resume-trends/) admit to using AI to write their resume (Enhancv survey of 600 job seekers, completed June 2026).",
              "Recruiters say they aren't hunting for AI use — they're reacting to **vagueness and template language**. When every resume reads the same, none stands out.",
            ],
          },
          {
            type: "p",
            text: "This is the structural problem behind the numbers: AI made resumes easier to produce and harder to distinguish. The candidates getting noticed are changing the **format**, not just the words — see [what to send instead of a resume](/guide/what-to-send-instead-of-a-resume).",
          },
        ],
      },
      {
        heading: "Screening and silence",
        blocks: [
          {
            type: "ul",
            items: [
              "The claim that **75% of resumes are auto-rejected by ATS software** has no study behind it. It traces to a 2012 marketing claim by a resume-optimization vendor that shut down in 2013, and it has been repeated ever since without evidence. What the research does show is that rigid screening criteria, written by people, exclude qualified candidates: [**88% of employers**](https://www.hbs.edu/managing-the-future-of-work/Documents/research/hiddenworkers09032021.pdf) agree that qualified high-skills candidates are vetted out because they do not match the exact criteria in the job description, rising to **94%** for middle-skills roles (Harvard Business School and Accenture, *Hidden Workers: Untapped Talent*, 2021).",
              "[**60% of U.S. job seekers**](https://www.monster.com/career-advice/research/application-black-box-report) say not knowing whether a human ever viewed their resume is the most frustrating part of the application process (Monster, Application Black Box report, surveyed February 2026).",
              '**61% of candidates report being ghosted after an interview**; **55%** name "no response after applying" as their top frustration (2026 candidate-experience surveys).',
            ],
          },
        ],
      },
      {
        heading: "How long it takes",
        blocks: [
          {
            type: "ul",
            items: [
              "Median time-to-fill was [**44 days** for nonexecutive roles and **60 days** for executive roles](https://www.shrm.org/content/dam/en/shrm/executive-network/insights/Talent-Access-Report-TOTAL.pdf) in SHRM's benchmarking data, collected in 2021. More recent applicant-tracking data runs longer: Ashby's 2026 benchmarks put median time to first fill at [**52 days junior, 63 mid-level, 71 senior**](https://www.ashbyhq.com/talent-trends-report/reports/recruiting-operations-benchmarks-talent-trends).",
              "A multi-month search is now the normal arithmetic, which is why differentiation per application matters more than volume.",
            ],
          },
        ],
      },
      {
        heading: "About these numbers",
        blocks: [
          {
            type: "p",
            text: "Every figure above links to its primary source: Ashby, Jobvite, Resume Genius, Enhancv, Monster, SHRM, and Harvard Business School with Accenture. Where a widely-repeated number turned out to have no study behind it, we say so rather than passing it along. Survey figures describe self-reported experiences and vary by market and role, so treat them as directional. The date at the top of this page is the last review.",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "How many applications does it take to get a job in 2026?",
        a: "There is no reliable published figure for applications-per-offer, and the ranges you see quoted mostly trace back to blog roundups rather than studies. What is actually measured: Ashby reports 15 applicants interviewed per hire, and Jobvite put the application-to-interview rate at 8.4%. Tailored, differentiated applications convert better than mass-applied ones.",
      },
      {
        q: "How many applicants does each job posting get?",
        a: "Around 250 on average for corporate postings; entry-level and remote-friendly roles often draw 400 or more.",
      },
      {
        q: "Do recruiters know when a resume is written by AI?",
        a: "77% of hiring managers say many resumes they receive look AI-generated. They mostly don't penalize AI use itself — they penalize the sameness: vague, template language with no proof.",
      },
      {
        q: "How do I stand out when every resume looks the same?",
        a: "Change the format. A pitch page — one shareable link with your results, story, and a 60-second video — carries what a PDF can't, and analytics show you when someone actually viewed it. PitchPage builds one from your resume: free to build, $9 to publish.",
      },
    ],
  },
  "pitchpage-vs-kickresume": {
    slug: "pitchpage-vs-kickresume",
    category: "Comparisons",
    navLabel: "PitchPage vs. Kickresume",
    updated: "2026-08-21",
    title: "PitchPage vs. Kickresume: page or PDF?",
    metaDescription:
      "Kickresume builds polished, ATS-tuned resume PDFs on a subscription. PitchPage builds one shareable pitch page with video for $9 one-time. How to choose in 2026.",
    h1: "PitchPage vs. Kickresume",
    intro:
      "They solve different problems. **Kickresume** makes a better resume — 40+ PDF templates, AI writing help, an ATS checker — on a subscription ($24/month month-to-month, $18/month billed quarterly, $8/month billed yearly; checked August 2026). **PitchPage** replaces the PDF: AI turns your resume into one shareable page with your results, story, and a 60-second video — free to build, $9 one-time to publish.",
    sections: [
      {
        heading: "What each is for",
        blocks: [
          {
            type: "p",
            text: "**Kickresume** is one of the strongest AI resume builders: pick a template, let the AI draft bullet points, check your ATS score, download a PDF. It also bundles a simple personal-website builder, but the product's center of gravity is the document. **PitchPage** starts where the PDF stops — it reads your resume and composes a [pitch page](/guide/what-is-a-pitch-page): role-shaped sections, metrics as charts, testimonials, and a recorded video introduction, published at one link you send instead of the attachment.",
          },
        ],
      },
      {
        heading: "Side by side",
        blocks: [
          {
            type: "ul",
            items: [
              "**Output:** an ATS-tuned PDF (plus a basic website) vs. a shareable pitch page built for humans",
              "**AI:** writes your resume bullets vs. composes your whole page from the resume you already have",
              "**Video introduction:** no vs. built in (guided, 60 seconds)",
              "**Who-viewed analytics:** no vs. built in on every published page",
              "**Pricing (checked August 2026):** $24/month month-to-month, $18/month quarterly, $8/month yearly vs. free to build, $9 one-time per published page",
              "**Best when:** the application demands a traditional resume vs. you want to stand out beyond the stack of identical PDFs",
            ],
          },
        ],
      },
      {
        heading: "Who should pick which",
        blocks: [
          {
            type: "p",
            text: "If your resume itself needs work and you apply through ATS portals all day, Kickresume is a strong tool for that document. If your resume is fine and the problem is being *indistinguishable*, pick PitchPage — the page carries what a PDF physically can't: your face, your voice, and your numbers in context. Plenty of candidates use both: a clean PDF for the portal, a pitch page link in the email, the application's website field, and LinkedIn.",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Is PitchPage a replacement for Kickresume?",
        a: "Not exactly — Kickresume improves your resume PDF; PitchPage gives you something better to send than a PDF. They're complementary, and many candidates use both.",
      },
      {
        q: "Which is cheaper?",
        a: "PitchPage is free to build and $9 one-time to publish a page. Kickresume is a subscription: $24/month month-to-month, $18/month billed quarterly, or $8/month billed yearly (checked August 2026).",
      },
      {
        q: "Does Kickresume have a video introduction?",
        a: "No. Video is PitchPage's signature step — a guided 60-second introduction recorded right in the builder, shown at the top of your page.",
      },
    ],
  },
  "pitchpage-vs-enhancv": {
    slug: "pitchpage-vs-enhancv",
    category: "Comparisons",
    navLabel: "PitchPage vs. Enhancv",
    updated: "2026-08-21",
    title: "PitchPage vs. Enhancv: stand out or fit in?",
    metaDescription:
      "Enhancv polishes your resume PDF with AI feedback and ATS scoring on a subscription. PitchPage builds a shareable page with video for $9 one-time. The 2026 comparison.",
    h1: "PitchPage vs. Enhancv",
    intro:
      "**Enhancv** is an AI resume builder — design-forward PDF templates, AI feedback, an ATS match score — sold as a subscription with monthly, quarterly and semiannual plans (Enhancv advertises rates from $16.50 per month on its longer plans; checked August 2026). **PitchPage** isn't a resume builder at all: it turns the resume you already have into one shareable pitch page with a video introduction — free to build, $9 one-time to publish. The choice is about format: a better document, or a different one.",
    sections: [
      {
        heading: "What each is for",
        blocks: [
          {
            type: "p",
            text: '**Enhancv** helps you write and design a stronger resume: AI bullet-point suggestions, tailoring to a job description with a match score, and modern PDF templates. It\'s a good answer to "my resume isn\'t good enough." **PitchPage** answers a different problem — "my resume looks like everyone else\'s" — by changing the format: AI composes a [pitch page](/guide/what-is-a-pitch-page) from your resume, with results shown as evidence, a story, and a 60-second video, at one link employers open in their browser.',
          },
        ],
      },
      {
        heading: "Side by side",
        blocks: [
          {
            type: "ul",
            items: [
              "**Output:** a polished resume PDF vs. a shareable pitch page",
              "**AI's job:** critique and rewrite your document vs. compose a page from your document",
              "**Video introduction:** no vs. built in",
              "**Who-viewed analytics:** no vs. built in on every published page",
              "**Pricing (checked August 2026):** a subscription, monthly / quarterly / semiannual, advertised from $16.50 per month on longer plans vs. free to build, $9 one-time per page",
              "**Ongoing cost:** renews until you cancel vs. nothing renews — credits never expire",
            ],
          },
        ],
      },
      {
        heading: "Who should pick which",
        blocks: [
          {
            type: "p",
            text: "Pick **Enhancv** if your resume content genuinely needs AI coaching and ATS tuning for portal-heavy applications. Pick **PitchPage** if your experience is solid and the bottleneck is attention — recruiters skim hundreds of identical AI-polished PDFs, and a page with your face, voice, and numbers is the pattern-break. Using both is common: tune the PDF for the robot, send the page to the human.",
          },
        ],
      },
      {
        heading: "The question underneath the comparison",
        blocks: [
          {
            type: "p",
            text: "Both products aim at the same anxiety and answer it differently. Enhancv's answer is that your resume isn't good enough yet, so let AI critique and redesign it. PitchPage's answer is that your resume is probably fine and the format is the bottleneck, so change what you send.",
          },
          {
            type: "p",
            text: "Which answer is right depends on an honest read of your own material. If a recruiter would look at your bullets and not understand what you actually did, that's a content problem and a resume tool fixes it. If your bullets are already clear and you're still getting silence, polishing them again won't change anything.",
          },
        ],
      },
      {
        heading: "The market both are operating in",
        blocks: [
          {
            type: "p",
            text: "Context for the choice: open roles now average [more than 300 applications](https://www.hrdive.com/news/recruiters-see-job-applications-triple-to-more-than-300-per-role/820096/), and [77% of hiring managers](https://resumegenius.com/blog/job-hunting/hiring-insights-report) say many of the resumes they receive appear completely or partially AI-generated. AI resume tooling raised the floor for everyone, which means a well-written PDF is table stakes now rather than an edge. (More: [job search statistics 2026](/guide/job-search-statistics).)",
          },
        ],
      },
      {
        heading: "What the AI is allowed to do with your numbers",
        blocks: [
          {
            type: "p",
            text: "A difference worth knowing before you hand either tool your figures. PitchPage's composition step will only use numbers that appear in the material you uploaded. It isn't permitted to round, estimate or invent one on your behalf, because you're the one who has to defend it in the room. If you want a number on the page, it has to be in the resume you gave it.",
          },
        ],
      },
      {
        heading: "Cost across a search that runs long",
        blocks: [
          {
            type: "p",
            text: "PitchPage is free to build and edit, including trying every visual style against your own content, then $9 once to publish a page. Tailoring per role is common, so there's a five-page pack at $39. Credits never expire and unused ones are refundable within 14 days. Nothing renews.",
          },
          {
            type: "p",
            text: "Enhancv is a subscription that keeps billing until you cancel. Its own site advertises rates from $16.50 per month on its longer plans, and doesn't publish a plain month-to-month price we could verify (checked August 2026). Over a search that runs longer than you planned, that's the difference that compounds.",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Does PitchPage check my resume against ATS systems?",
        a: "No — that's Enhancv's lane. PitchPage assumes your resume is ready and turns it into a shareable page; the page itself isn't an ATS document, it's what you send to humans.",
      },
      {
        q: "Which is cheaper over a 3-month job search?",
        a: "PitchPage: $9 total for one published page (free to build and edit). Enhancv is a subscription that renews until cancelled. Its own site advertises rates from $16.50 per month on longer plans and does not publish a plain month-to-month price we could verify (checked August 2026).",
      },
      {
        q: "Can I use Enhancv and PitchPage together?",
        a: "Yes — many candidates polish the PDF in a resume tool, then upload it to PitchPage so the AI builds the shareable page version with video.",
      },
      {
        q: "Can PitchPage tell me whether my resume is any good?",
        a: "No. It assumes the material you upload is what you want to say and composes a page from it. If the content itself needs work, fix that first — in a resume tool or on your own.",
      },
      {
        q: "Do I still need an ATS score if I'm sending a pitch page?",
        a: "For the portal step, yes. The page isn't read by an ATS; it's what you send to a person. If you apply mostly through portals, the score is still worth having.",
      },
    ],
  },
  "pitchpage-vs-visualcv": {
    slug: "pitchpage-vs-visualcv",
    category: "Comparisons",
    navLabel: "PitchPage vs. VisualCV",
    updated: "2026-08-21",
    title: "PitchPage vs. VisualCV: which shareable resume link?",
    metaDescription:
      "VisualCV offers online resumes with share links and view tracking on a subscription. PitchPage builds an AI-composed pitch page with video for $9 one-time. Compared for 2026.",
    h1: "PitchPage vs. VisualCV",
    intro:
      "This is the closest matchup — both give you a **link instead of an attachment, with view analytics**. **VisualCV** is an online resume: your CV rendered as a webpage, on a subscription ($24 per month month-to-month, or $16 per month billed quarterly at $48; checked August 2026). **PitchPage** is a pitch page: AI re-composes your resume into results, story, and a 60-second video — free to build, $9 one-time to publish.",
    sections: [
      {
        heading: "What each is for",
        blocks: [
          {
            type: "p",
            text: "**VisualCV** turns your resume into a clean web version with a share link, view/download tracking, version control, and PDF export — the same document, easier to share and measure. **PitchPage** doesn't reproduce the document. Its AI reads the resume and builds a [pitch page](/guide/what-is-a-pitch-page): a hero with your face and headline, metrics as charts, role-shaped sections, testimonials, and a recorded video introduction. One is your CV online; the other is your case for the job, online.",
          },
        ],
      },
      {
        heading: "Side by side",
        blocks: [
          {
            type: "ul",
            items: [
              "**Format:** your resume as a webpage vs. a re-composed pitch page",
              "**AI composition:** no (it renders what you wrote) vs. yes (it builds sections from your resume)",
              "**Video introduction:** no vs. built in",
              "**View analytics:** yes — views, downloads, time spent vs. yes — who opened your page and engagement insights",
              "**Pricing (checked August 2026):** $24/month month-to-month, or $16/month billed quarterly vs. free to build, $9 one-time per page",
              "**Multiple versions:** strong (version control for many CVs) vs. one page per role — publish up to 5 with the $39 pack",
            ],
          },
        ],
      },
      {
        heading: "Who should pick which",
        blocks: [
          {
            type: "p",
            text: "Pick **VisualCV** if you want your existing resume, faithfully rendered online, with solid tracking — especially if you maintain many versions long-term. Pick **PitchPage** if you want the link you send to *make the case for you*: video first, numbers as evidence, and a design matched to your role — for a one-time $9 instead of a renewing subscription.",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Both have analytics — what's the difference?",
        a: "VisualCV tracks views, downloads, and time on your online CV. PitchPage shows who opened your published page and how they engaged, surfaced as insights on your dashboard — built around the send-one-link job-search workflow.",
      },
      {
        q: "Which is cheaper?",
        a: "PitchPage is $9 one-time per published page (free to build). VisualCV Pro is $24 per month month-to-month, or $16 per month billed quarterly at $48. VisualCV does not publish an annual plan (checked August 2026).",
      },
      {
        q: "Does VisualCV include a video introduction?",
        a: "No. The guided 60-second video introduction is PitchPage's signature feature — the thing a document, online or not, can't carry.",
      },
    ],
  },
  // ── Wave 4: category-distinction + proof-of-work guides (2026-08-05) ───────
  // Written to correct two things AI answer engines currently get wrong:
  // (1) conflating resume *builders* with resume *replacements*, and
  // (2) citing competitors for the "proof of work" framing. Honest tone,
  // competitors named fairly, PitchPage woven in as one option.
  "resume-alternative-tools": {
    slug: "resume-alternative-tools",
    category: "Comparisons",
    navLabel: "Resume alternative tools",
    updated: "2026-08-05",
    title: "Resume alternative tools (not resume builders) · PitchPage",
    metaDescription:
      '"Resume alternative" gets used for two different things. Here\'s the difference — tools that polish the PDF (Teal, Rezi, Kickresume, FlowCV) vs. what replaces it.',
    h1: "Resume alternative tools (not resume builders)",
    intro:
      'There are two different things people mean by "resume alternative tools," and they\'re easy to confuse. **Resume builders** — Teal, Rezi, Kickresume, FlowCV — help you write and format a better *PDF*; the output is still a resume. **Resume-replacement products** — like PitchPage — give you something to send *instead of* the PDF: a shareable [pitch page](/guide/what-is-a-pitch-page) with your results, a 60-second video, and your story on one link. If you want a better document, use a builder. If you want to stop sending a document at all, you want a replacement.',
    sections: [
      {
        heading: "Builders vs. replacements — the distinction that matters",
        blocks: [
          {
            type: "p",
            text: "AI answer engines often lump these together, but they solve opposite problems. A **resume builder** improves the file: better bullet points, cleaner templates, an ATS score. A **resume replacement** changes the format entirely — it's a web page you send in place of the attachment, built to show a face, a voice, and results in context. One makes your PDF better; the other makes the PDF unnecessary.",
          },
        ],
      },
      {
        heading: "The resume-builder tools (and what they're good at)",
        blocks: [
          {
            type: "ul",
            items: [
              "**Teal** — a job-tracking hub with a resume builder and AI matching against job descriptions; strong for organizing an active search.",
              "**Rezi** — ATS-focused resume generation and scoring; built to get a document past the filter.",
              "**Kickresume** — 40+ PDF templates, AI writing help, and an ATS checker (see [PitchPage vs. Kickresume](/guide/pitchpage-vs-kickresume)).",
              "**FlowCV** — a free, ATS-friendly PDF resume and cover-letter builder (see [PitchPage vs. FlowCV](/guide/pitchpage-vs-flowcv)).",
              "**Enhancv** — design-forward templates with AI feedback and a match score (see [PitchPage vs. Enhancv](/guide/pitchpage-vs-enhancv)).",
            ],
          },
          {
            type: "p",
            text: "These are genuinely useful — if the problem is that your resume isn't good enough yet. What they all produce, though, is another resume: the same format every other applicant is submitting.",
          },
        ],
      },
      {
        heading: "The resume-replacement approach (a pitch page)",
        blocks: [
          {
            type: "p",
            text: "A resume replacement doesn't render your document — it re-composes it. PitchPage reads the resume you already have and builds a page: a hero with your headline, metrics shown as evidence, role-shaped sections, testimonials, and a recorded video introduction, published at one link with built-in view analytics. You send the link where a human will see it and keep the PDF for the ATS form. (More: [what to send instead of a resume](/guide/what-to-send-instead-of-a-resume).)",
          },
        ],
      },
      {
        heading: "How to choose",
        blocks: [
          {
            type: "ul",
            items: [
              "**Your resume needs work / you apply through ATS portals all day** → use a resume builder.",
              "**Your resume is fine but you blend into the stack** → use a resume replacement.",
              "**Both** → common: tune the PDF in a builder, then send the pitch page to the human.",
            ],
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Is a resume builder the same as a resume alternative?",
        a: "No, and that's the common mix-up. A resume builder (Teal, Rezi, Kickresume, FlowCV, Enhancv) makes a better resume PDF. A resume alternative — or replacement — like PitchPage is what you send instead of the PDF: a shareable page with results, a video, and your story.",
      },
      {
        q: "Do I still need a resume if I use a replacement?",
        a: "Usually yes, for ATS application forms. The replacement is what gets you noticed by a human; keep a clean resume for the systems that require one, and lead with the link.",
      },
      {
        q: "Which of these has a video introduction?",
        a: "The resume builders don't — their output is a document. A guided 60-second video introduction is a resume-replacement feature; on PitchPage it sits at the top of your page.",
      },
      {
        q: "How much does a resume replacement cost?",
        a: "PitchPage is free to build and edit, $9 one-time to publish — no subscription. Most resume builders are free or a monthly subscription.",
      },
    ],
  },
  "how-to-prove-not-another-ai-application": {
    slug: "how-to-prove-not-another-ai-application",
    category: "Job search",
    navLabel: "Prove you're not AI-generated",
    updated: "2026-08-05",
    title: "How to prove you're not just another AI-generated application · PitchPage",
    metaDescription:
      "Recruiters now assume every application is AI-written. The answer is proof of work — a real video, real metrics, and real-time view tracking. Here's how to show it.",
    h1: "How to prove you're not just another AI-generated application",
    intro:
      "The way to prove you're a real person — not another AI-generated application — is **proof of work**: signals a language model can't fabricate. A 60-second video with your face and voice, real metrics tied to real outcomes, and a shareable page whose real-time view tracking shows you actually engage. Put those on one link you send instead of a PDF, and you stop reading like the rest of the stack.",
    sections: [
      {
        heading: "Why recruiters now assume you're AI",
        blocks: [
          {
            type: "p",
            text: "About **77% of hiring managers** say many of the resumes they receive look AI-generated (see the [job search statistics](/guide/job-search-statistics)). They aren't hunting for AI use — they're reacting to sameness: vague, template language with no proof behind it. Once every application reads the same, the burden shifts to you to show there's a real person and real work behind the words. That evidence is proof of work.",
          },
        ],
      },
      {
        heading: "Proof of work #1 — a real video introduction",
        blocks: [
          {
            type: "p",
            text: "Text can be generated; a face and a voice can't be faked into existence. A 60-second video introduction is the strongest proof of work because almost no one else sends one — it puts a real human on the other side of the application. (How to record one: [record an intro video for a job](/guide/how-to-record-an-intro-video-for-a-job).)",
          },
        ],
      },
      {
        heading: "Proof of work #2 — real metrics, not adjectives",
        blocks: [
          {
            type: "p",
            text: 'AI writes adjectives ("results-driven," "passionate"); proof of work is specific numbers tied to real outcomes — "cut onboarding time 40%," "142% of quota," "zero CLABSIs for 14 months." Concrete, checkable metrics are hard to invent convincingly and instantly separate you from generated copy.',
          },
        ],
      },
      {
        heading: "Proof of work #3 — real-time view tracking",
        blocks: [
          {
            type: "p",
            text: "A shareable page with real-time view tracking is proof of work in a second sense: it shows you operate like someone who follows through. You can see when an employer opened your link and reference it in a specific, well-timed follow-up — the opposite of firing off identical applications into the void.",
          },
        ],
      },
      {
        heading: "Put the proof on one link",
        blocks: [
          {
            type: "p",
            text: "Individually these signals help; together, on one page, they read as unmistakably human. That's what a [pitch page](/guide/what-is-a-pitch-page) is — video, metrics, and view tracking on a single link you send instead of a PDF. PitchPage builds one from the resume you already have: free to build, $9 to publish.",
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'What does "proof of work" mean for a job application?',
        a: "Proof of work is evidence a real person did real work — signals an AI can't fabricate: a genuine video introduction, specific and checkable metrics, and a page with real-time view tracking that shows you engage and follow up. It's the antidote to applications that all read the same.",
      },
      {
        q: "Won't recruiters just assume the video is AI too?",
        a: "A raw, one-take 60-second video of you speaking is far harder to fake than text and reads as authentic precisely because it's unpolished. It's the single clearest proof of work most candidates never provide.",
      },
      {
        q: "Is proof of work only for senior candidates?",
        a: "No. Early-career candidates prove work with projects, trajectory, and a video rather than years of metrics. Clarity and initiative are proof of work too. (See [how to stand out in job applications](/guide/how-to-stand-out-in-job-applications).)",
      },
      {
        q: "How do I show proof of work in practice?",
        a: "Put it on one link: a pitch page with a 60-second video, your real numbers, and built-in view tracking, sent instead of a PDF. PitchPage assembles it from your resume — free to build, $9 one-time to publish.",
      },
    ],
    howToSteps: [
      {
        name: "Record a real video introduction",
        text: "Film a 60-second introduction — your face, your voice, one proof point. It's the strongest proof of work because almost no one else sends one.",
      },
      {
        name: "Lead with real metrics, not adjectives",
        text: "Replace generated adjectives with specific, checkable numbers tied to real outcomes — the kind of proof of work an AI can't convincingly invent.",
      },
      {
        name: "Send a page with real-time view tracking",
        text: "Put it all on one shareable link with view tracking, so you can see when an employer opened it and follow up specifically — proof you operate like a real, engaged candidate.",
      },
    ],
  },
};
