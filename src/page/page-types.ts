import type { BlockData, BlockType, PageSection } from "./page-sections";

/**
 * The eight kinds of pitch page, and the sections each one starts with.
 *
 * Every title, hint and piece of starting copy is verbatim from the web repo
 * (`src/lib/job-seed.ts` and the six `wizard-*.$id.tsx` intake routes). They are
 * not decoration: the hint is what the AI is later asked to fill, and a section
 * title is matched by exact string in several places (see TITLE_GATED below),
 * so a reworded title silently turns a feature off.
 *
 * Presets ship EMPTY on purpose, as they do on the web. A preset arriving
 * pre-filled with "Service one — describe what you offer" would publish that
 * sentence verbatim for anyone who added it and never came back, and a
 * published page is the thing being sent to an employer.
 */

export type PitchKind =
  | "job"
  | "university"
  | "athlete"
  | "real-estate"
  | "contractor"
  | "sales"
  | "listing"
  | "other";

/** The order the chooser shows them in. */
export const PITCH_KINDS: readonly PitchKind[] = [
  "job",
  "university",
  "athlete",
  "real-estate",
  "listing",
  "contractor",
  "sales",
  "other",
];

export type PitchKindTile = {
  key: PitchKind;
  title: string;
  description: string;
  /** A lucide-react-native icon name. */
  icon: string;
};

export const PITCH_KIND_TILES: readonly PitchKindTile[] = [
  { key: "job", title: "Job application", description: "Stand out to employers with an interactive resume page.", icon: "Briefcase" },
  { key: "university", title: "University application", description: "Showcase yourself to admissions committees.", icon: "GraduationCap" },
  { key: "athlete", title: "Athlete pitch", description: "Highlight stats, highlights, and recruiting info.", icon: "Trophy" },
  { key: "real-estate", title: "Real estate pitch", description: "Present listings or your services as an agent.", icon: "Home" },
  { key: "listing", title: "Property listing", description: "Market one property — photos, price, facts, and showings.", icon: "Building2" },
  { key: "contractor", title: "Contractor bid", description: "Showcase your projects, trade, and past work.", icon: "Wrench" },
  { key: "sales", title: "Sales pitch", description: "Pitch your product, service, or offer to potential buyers.", icon: "Megaphone" },
  { key: "other", title: "Something else", description: "Any pitch that is not on this list — tell us what it is for and we build it.", icon: "Shapes" },
];

/**
 * Switching to one of these replaces the page's sections. The other kinds carry
 * the existing sections across, so the confirm dialog says something different.
 */
export const RESEEDING_KINDS = new Set<PitchKind>([
  "athlete",
  "real-estate",
  "contractor",
  "sales",
  "listing",
]);

/** Every kind except university skips the resume upload step. */
export const SKIPS_RESUME_UPLOAD = new Set<PitchKind>([
  "athlete",
  "real-estate",
  "contractor",
  "sales",
  "listing",
]);

export type SectionSeed = {
  title: string;
  blockType: BlockType;
  hint?: string;
  data: BlockData;
};

const textBlock = (): BlockData => ({
  heading: "",
  paragraphs: [],
  bullets: [],
  format: "paragraph",
});
const items = (): BlockData => ({ items: [] });
const tags = (): BlockData => ({ heading: "", tags: [] });
const timeline = (): BlockData => ({ location: "", items: [] });
const cta = (heading: string, sub: string, label: string): BlockData => ({
  heading,
  sub,
  label,
  url: "",
  email: "",
});

// ─── job and other ──────────────────────────────────────────────────────────

const JOB_SEEDS: readonly SectionSeed[] = [
  { title: "About Me", blockType: "text_block", hint: "Who you are and what you do, in a few sentences. Write it the way you'd say it out loud.", data: textBlock() },
  { title: "Experience", blockType: "timeline", hint: "Where you've worked, what the job was, and what you actually did there. Most recent first.", data: items() },
  { title: "Skills", blockType: "tag_list", hint: "Tools, systems, languages, certifications — the things a recruiter scans for.", data: tags() },
  { title: "By the Numbers", blockType: "metric_grid", hint: "Any real figures from your work — years of experience, people managed, revenue, tickets closed, uptime.", data: items() },
  { title: "What People Say", blockType: "quote_list", hint: "A manager, client or colleague who'd vouch for you — name and role, plus their words only if you have them in writing to copy exactly.", data: items() },
  { title: "Contact", blockType: "cta", data: cta("Let's talk", "Interested? Get in touch — I reply quickly.", "Contact me") },
];

// ─── athlete ────────────────────────────────────────────────────────────────

const ATHLETE_SEEDS: readonly SectionSeed[] = [
  { title: "Basic Info", blockType: "text_block", hint: "Name, age, graduation year, position, height, weight, location.", data: textBlock() },
  { title: "Schooling", blockType: "text_block", hint: "Current school, GPA, academic honors and awards.", data: textBlock() },
  { title: "Athletic Accomplishments", blockType: "text_block", hint: "Records, championships, MVPs, awards, all-conference selections.", data: textBlock() },
  { title: "Playing Experience", blockType: "timeline", hint: "Teams and clubs you've played for — years, role, key stats.", data: items() },
  { title: "Coach References", blockType: "cards", hint: "Coaches who can vouch for you — name, role, contact.", data: items() },
  { title: "Stats", blockType: "metric_grid", hint: "Your key performance stats for your sport — points, rebounds and assists for basketball; yards, tackles and sacks for football; goals and assists for soccer. Short numbers work best. Put links to MaxPreps or Hudl in a text section instead.", data: items() },
  { title: "Film & Highlights", blockType: "text_block", hint: "Upload highlight reels and game film — MP4, MOV, or WebM.", data: textBlock() },
  { title: "Contact", blockType: "cta", data: cta("Let's connect", "Interested in recruiting me? Reach out below.", "Contact me") },
];

// ─── contractor ─────────────────────────────────────────────────────────────

const CONTRACTOR_SEEDS: readonly SectionSeed[] = [
  { title: "Basic Info", blockType: "text_block", hint: "Company name, license #, years in business, trade/specialty, service area, phone, email.", data: textBlock() },
  { title: "Bid Snapshot", blockType: "metric_grid", hint: "Project name / RFP reference, bid amount or pricing tiers, proposed timeline / start date.", data: items() },
  { title: "Capabilities & Services", blockType: "tag_list", hint: "Service categories, equipment capacity, vertical and horizontal market focus.", data: tags() },
  { title: "Past Projects", blockType: "cards", hint: "One card per project — project name, value, duration, client type, outcome.", data: items() },
  { title: "Certifications & Compliance", blockType: "tag_list", hint: "Licenses, bonding / insurance limits, safety certifications, union affiliation, minority/veteran-owned status.", data: tags() },
  { title: "Client References & Testimonials", blockType: "quote_list", hint: "Past clients you can name as references — name, role, project — and their exact written feedback if you have it.", data: items() },
  { title: "Safety Record", blockType: "metric_grid", hint: "EMR/WSIB rating (or your country's equivalent experience/safety rating — e.g. NEER or CAD-7 for Canadian provincial WCBs, LTIFR for Australia/NZ, AFR for the UK), incident-free days, safety program summary.", data: items() },
  { title: "Team & Key Personnel", blockType: "timeline", hint: "Project manager / foreman and other key personnel — role, years of experience.", data: timeline() },
  { title: "Contact", blockType: "cta", data: cta("Let's talk bids", "Ready to move forward? Reach out to discuss your project.", "Request a quote") },
];

// ─── real estate ────────────────────────────────────────────────────────────

const REAL_ESTATE_SEEDS: readonly SectionSeed[] = [
  { title: "Basic Info", blockType: "text_block", hint: "Name, license #, brokerage, years in business, service area, phone, email.", data: textBlock() },
  { title: "Schooling & Certifications", blockType: "text_block", hint: "Education, real estate license state(s), certifications (CRS, ABR, SRS…), designations.", data: textBlock() },
  { title: "Sales Accomplishments", blockType: "metric_grid", hint: "Total volume, homes sold, awards, top-producer recognition, notable deals.", data: items() },
  { title: "Experience", blockType: "timeline", hint: "Brokerages and roles you've held — years, specialties, highlights.", data: items() },
  { title: "Client Testimonials & References", blockType: "cards", hint: "Client name, role (buyer/seller/brokerage), quote or contact.", data: items() },
  { title: "Portfolio & Listings", blockType: "text_block", hint: "Link to portfolio, featured listings, virtual tours, personal website.", data: textBlock() },
  { title: "Contact", blockType: "cta", data: cta("Let's connect", "Ready to buy, sell, or list with me? Get in touch.", "Contact me") },
];

// ─── sales ──────────────────────────────────────────────────────────────────

const SALES_SEEDS: readonly SectionSeed[] = [
  { title: "Basic Info", blockType: "text_block", hint: "The offering: product or service name, what category it is, how it's priced or packaged, and who its target market/buyer is.", data: textBlock() },
  { title: "Offer Snapshot", blockType: "text_block", hint: "Product/service name, pricing or packages, key terms, what's included.", data: textBlock() },
  { title: "Why Us", blockType: "cards", hint: "Differentiators and unique selling points — one card each.", data: items() },
  { title: "Product/Service Highlights", blockType: "tag_list", hint: "Key features, capabilities, specs.", data: tags() },
  { title: "Results & Track Record", blockType: "metric_grid", hint: "The OFFERING's performance for customers: adoption/usage, ROI delivered, growth enabled, retention or satisfaction — not the rep's personal sales numbers.", data: items() },
  { title: "Case Studies", blockType: "cards", hint: "One card per case study — client, problem, outcome.", data: items() },
  { title: "Client Testimonials", blockType: "quote_list", hint: "Past clients' exact words — from a review, email or case study — with their name, role and company.", data: items() },
  { title: "Certifications & Partnerships", blockType: "tag_list", hint: "For the PRODUCT/COMPANY: compliance certifications, technology/vendor partnerships, and industry awards for the offering — not the rep's personal sales certifications.", data: tags() },
  { title: "Contact", blockType: "cta", data: cta("Let's talk", "Interested in learning more? Get in touch.", "Contact me") },
];

// ─── university ─────────────────────────────────────────────────────────────

const UNIVERSITY_SEEDS: readonly SectionSeed[] = [
  { title: "About Me", blockType: "text_block", hint: "Who you are in a few sentences — where you're from, where you study now, and what you want to do next.", data: textBlock() },
  { title: "Academics", blockType: "text_block", hint: "School, graduation year, GPA or grades, test scores, coursework that matters for this programme.", data: textBlock() },
  { title: "At a Glance", blockType: "metric_grid", hint: "The few numbers worth scanning — GPA, test score, class rank, years of a language, hours volunteered.", data: items() },
  { title: "Activities & Leadership", blockType: "text_block", hint: "Clubs, sports, jobs, volunteering, research, anything you ran or built. What you did, not just what you joined.", data: textBlock() },
  { title: "Why This Programme", blockType: "text_block", hint: "Why this school and this course specifically. Name the programme, the faculty, or the thing you can't get elsewhere.", data: textBlock() },
  { title: "References", blockType: "quote_list", hint: "Teachers, coaches or supervisors who can vouch for you — name and role, plus their words only if you have them in writing to copy exactly.", data: items() },
  { title: "Contact", blockType: "cta", data: cta("Get in touch", "Questions about my application? Reach out any time.", "Contact me") },
];

// ─── property listing ───────────────────────────────────────────────────────

export type ListingAudience = "buyer" | "seller" | "investor";

/** The section title the photo gallery attaches to on a listing page. */
export const LISTING_PHOTOS_SECTION_TITLE = "Photos";

const PHOTOS_SEED: SectionSeed = {
  title: LISTING_PHOTOS_SECTION_TITLE,
  blockType: "text_block",
  hint: "Drop the property photos in — exterior first, then the rooms that sell it.",
  data: textBlock(),
};

const LISTING_SEEDS: Record<ListingAudience, readonly SectionSeed[]> = {
  buyer: [
    PHOTOS_SEED,
    { title: "About this home", blockType: "text_block", hint: "What a buyer walks into. Layout, light, recent work, what's included.", data: textBlock() },
    { title: "The neighborhood", blockType: "text_block", hint: "Schools, transit, walkability, what's within a few blocks.", data: textBlock() },
    { title: "At a glance", blockType: "metric_grid", hint: "Four facts worth repeating — year built, lot size, taxes, HOA, parking.", data: items() },
    { title: "Showings & next steps", blockType: "text_block", hint: "Open-house times, how to book a private showing, offer dates.", data: textBlock() },
    { title: "Contact", blockType: "cta", data: cta("Come see it", "Book a showing or ask me anything about the property.", "Book a showing") },
  ],
  seller: [
    PHOTOS_SEED,
    { title: "How I'd market this home", blockType: "text_block", hint: "Your plan: photography, staging, launch timing, channels.", data: textBlock() },
    { title: "Recent results nearby", blockType: "metric_grid", hint: "Only numbers you can stand behind — list-to-sale ratio, days on market, volume.", data: items() },
    { title: "Comparable sales", blockType: "timeline", hint: "Address, sale price, date — the comps that set your pricing view.", data: items() },
    { title: "What sellers say", blockType: "quote_list", hint: "Past sellers' exact words — from a review or a note — with their name and neighborhood.", data: items() },
    { title: "Contact", blockType: "cta", data: cta("Let's talk about your home", "I'll walk you through how I'd price and market it.", "Let's talk") },
  ],
  investor: [
    PHOTOS_SEED,
    { title: "The numbers", blockType: "metric_grid", hint: "Cap rate, gross rent, NOI, price per sq ft — only figures you can document.", data: items() },
    { title: "The deal", blockType: "text_block", hint: "Why this property, at this price, right now. Risks included.", data: textBlock() },
    { title: "Financials & terms", blockType: "text_block", hint: "Rent roll, expenses, financing assumptions, timeline to close.", data: textBlock() },
    { title: "Unit mix & condition", blockType: "text_block", hint: "Units, sizes, occupancy, deferred maintenance, capex plan.", data: textBlock() },
    { title: "Contact", blockType: "cta", data: cta("Want the full financials?", "Send me a note and I'll share the full package.", "Request the full package") },
  ],
};

export const LISTING_CTA_LABEL: Record<ListingAudience, string> = {
  buyer: "Book a showing",
  seller: "Let's talk",
  investor: "Request the full package",
};

// ─── building the sections ──────────────────────────────────────────────────

export function freshId(): string {
  const cryptoRef = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (typeof cryptoRef?.randomUUID === "function") return cryptoRef.randomUUID();
  return `sec-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function seedsFor(kind: PitchKind, listingAudience?: ListingAudience): readonly SectionSeed[] {
  switch (kind) {
    case "athlete":
      return ATHLETE_SEEDS;
    case "contractor":
      return CONTRACTOR_SEEDS;
    case "real-estate":
      return REAL_ESTATE_SEEDS;
    case "sales":
      return SALES_SEEDS;
    case "university":
      return UNIVERSITY_SEEDS;
    case "listing":
      return LISTING_SEEDS[listingAudience ?? "buyer"];
    default:
      return JOB_SEEDS;
  }
}

/**
 * Build the starting sections for a page.
 *
 * The owner's email is written into the contact block, so a published page
 * always has a way to reach the person even if they never open that section.
 * Returns null when the page already has content in any section: a seed must
 * never overwrite something someone typed.
 */
export function buildSeedSections(
  kind: PitchKind,
  ownerEmail: string,
  options?: { listingAudience?: ListingAudience },
): PageSection[] {
  return seedsFor(kind, options?.listingAudience).map((seed, index) => ({
    id: freshId(),
    title: seed.title,
    blockType: seed.blockType,
    data:
      seed.blockType === "cta" && ownerEmail
        ? ({ ...seed.data, email: ownerEmail } as BlockData)
        : ({ ...seed.data } as BlockData),
    order: index,
    visible: true,
    ...(seed.hint ? { hint: seed.hint } : {}),
  }));
}

// ─── titles that switch features on ─────────────────────────────────────────

/**
 * Several editors attach by EXACT section title. Renaming one of these turns
 * its editor off silently, which is why they are constants rather than inline
 * strings.
 */
export const TITLE_GATED = {
  /** A photo gallery, on any kind. */
  portfolio: "Portfolio & Listings",
  pastProjects: "Past Projects",
  /** A photo gallery, but only on a listing page. */
  listingPhotos: LISTING_PHOTOS_SECTION_TITLE,
  /** A video gallery, on any kind. */
  film: "Film & Highlights",
  /** Contractor-only helpers. */
  marketFocus: "Capabilities & Services",
  safetyRecord: "Safety Record",
  /** Where verified credential links attach, per kind. */
  credentials: {
    contractor: "Certifications & Compliance",
    "real-estate": "Schooling & Certifications",
    sales: "Certifications & Partnerships",
  } as Partial<Record<PitchKind, string>>,
} as const;

/** Whether a section shows the photo-gallery editor. */
export function hasPhotoGallery(title: string, kind: PitchKind | null): boolean {
  if (title === TITLE_GATED.portfolio || title === TITLE_GATED.pastProjects) return true;
  return title === TITLE_GATED.listingPhotos && kind === "listing";
}

/** Whether a section shows the video-gallery editor. Not gated by kind. */
export function hasVideoGallery(title: string): boolean {
  return title === TITLE_GATED.film;
}

/** Whether a section shows the verified-credential editor. */
export function hasCredentialLinks(title: string, kind: PitchKind | null): boolean {
  if (!kind) return false;
  return TITLE_GATED.credentials[kind] === title;
}
