import type { ListingAudience, PitchKind } from "./page-types";

/**
 * The questions each vertical asks before the builder opens, and what the
 * answers become.
 *
 * Option keys are exact: they are stored in `wizard_meta.jobTarget` as a
 * sentence and parsed back out by matching on the label, so changing a label
 * orphans every page already built with it.
 */

export type Option = { value: string; label: string; hint?: string };

// ─── athlete ────────────────────────────────────────────────────────────────

/** Sports are stored by their own name — value and label are the same string. */
export const SPORTS: readonly Option[] = [
  "Football", "Soccer", "Basketball", "Baseball", "Softball", "Volleyball",
  "Track & Field", "Cross Country", "Swimming", "Tennis", "Golf", "Lacrosse",
  "Hockey", "Wrestling", "Gymnastics", "Rowing", "Cheer", "Rugby", "Other",
].map((name) => ({ value: name, label: name }));

export const ATHLETE_LEVELS: readonly Option[] = [
  { value: "high-school", label: "High school" },
  { value: "club-travel", label: "Club / travel" },
  { value: "juco", label: "Junior college (JUCO)" },
  { value: "ncaa-d1", label: "NCAA Division 1" },
  { value: "ncaa-d2", label: "NCAA Division 2" },
  { value: "ncaa-d3", label: "NCAA Division 3" },
  { value: "naia", label: "NAIA" },
  { value: "pro-semi", label: "Professional / semi-pro" },
];

// ─── contractor ─────────────────────────────────────────────────────────────

export const CONTRACTOR_AUDIENCES: readonly Option[] = [
  { value: "gc", label: "General contractor (GC)" },
  { value: "owner-dev", label: "Property owner or developer" },
  { value: "public-rfp", label: "Government agency / public RFP" },
  { value: "homeowner", label: "Homeowner" },
  { value: "mechanical-contractor", label: "Mechanical Contractor" },
  { value: "electrical-contractor", label: "Electrical Contractor" },
  { value: "other", label: "Other" },
];

export const TRADES: readonly Option[] = [
  { value: "general", label: "General contracting" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "hvac", label: "HVAC" },
  { value: "roofing", label: "Roofing" },
  { value: "concrete-masonry", label: "Concrete / Masonry" },
  { value: "framing", label: "Framing" },
  { value: "excavation", label: "Excavation / Grading" },
  { value: "landscaping", label: "Landscaping" },
  { value: "painting", label: "Painting" },
  { value: "flooring", label: "Flooring" },
  { value: "emcs", label: "EMCS" },
  { value: "analytics", label: "Analytics" },
  { value: "integration", label: "Integration" },
  { value: "mechanical", label: "Mechanical" },
  { value: "other", label: "Other" },
];

// ─── real estate ────────────────────────────────────────────────────────────

export const REAL_ESTATE_AUDIENCES: readonly Option[] = [
  { value: "buyers", label: "Potential home buyers" },
  { value: "sellers", label: "Potential home sellers" },
  { value: "both", label: "Both buyers and sellers" },
  { value: "brokerage", label: "A brokerage you want to join" },
  { value: "investors", label: "Investors / developers" },
  { value: "other", label: "Other" },
];

export const REAL_ESTATE_SPECIALTIES: readonly Option[] = [
  { value: "res-single", label: "Residential — single-family" },
  { value: "res-condo", label: "Residential — condos / townhomes" },
  { value: "luxury", label: "Luxury / high-end residential" },
  { value: "new-construction", label: "New construction" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "land", label: "Land / rural" },
  { value: "multi-family", label: "Multi-family / investment" },
  { value: "vacation", label: "Vacation / short-term rentals" },
  { value: "property-mgmt", label: "Property management" },
  { value: "other", label: "Other" },
];

// ─── sales ──────────────────────────────────────────────────────────────────

export const SALES_AUDIENCES: readonly Option[] = [
  { value: "b2c", label: "Individual consumers (B2C)" },
  { value: "smb", label: "Small businesses (B2B)" },
  { value: "midmarket", label: "Mid-market businesses (B2B)" },
  { value: "enterprise", label: "Enterprise / large corporations (B2B)" },
  { value: "gov", label: "Government / public sector" },
  { value: "nonprofit", label: "Nonprofits / NGOs" },
  { value: "education", label: "Educational institutions" },
  { value: "healthcare", label: "Healthcare organizations" },
  { value: "channel", label: "Resellers / distributors / channel partners" },
  { value: "investors", label: "Investors / stakeholders" },
  { value: "other", label: "Other" },
];

export const SALES_OFFERINGS: readonly Option[] = [
  { value: "product", label: "Physical product" },
  { value: "saas", label: "Software / SaaS" },
  { value: "services", label: "Professional services" },
  { value: "financial", label: "Financial products" },
  { value: "insurance", label: "Insurance" },
  { value: "consulting", label: "Consulting" },
  { value: "manufacturing", label: "Manufacturing / industrial equipment" },
  { value: "healthcare", label: "Healthcare / medical products or services" },
  { value: "marketing", label: "Marketing / advertising / creative services" },
  { value: "education", label: "Education / training / coaching" },
  { value: "subscription", label: "Subscription / membership program" },
  { value: "franchise", label: "Franchise / licensing opportunity" },
  { value: "other", label: "Other" },
];

// ─── university ─────────────────────────────────────────────────────────────

export const SCHOOL_TYPES: readonly Option[] = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "grad-masters", label: "Graduate — Master's (MA/MS)" },
  { value: "grad-mba", label: "Graduate — MBA / Business" },
  { value: "grad-law", label: "Graduate — Law (JD/LLM)" },
  { value: "grad-medical", label: "Graduate — Medical (MD/DO)" },
  { value: "grad-phd", label: "Graduate — PhD / Doctoral" },
  { value: "grad-engineering", label: "Graduate — Engineering" },
  { value: "grad-education", label: "Graduate — Education (MEd)" },
  { value: "grad-policy-health", label: "Graduate — Public Policy / Public Health" },
  { value: "grad-arts", label: "Graduate — Arts / MFA" },
  { value: "grad-other", label: "Graduate — Other" },
];

// ─── property listing ───────────────────────────────────────────────────────

export const LISTING_AUDIENCES: ReadonlyArray<Option & { value: ListingAudience }> = [
  { value: "buyer", label: "Buyers", hint: "A shareable page for the property itself — photos, facts, showings." },
  { value: "seller", label: "A seller you're pitching", hint: "Show how you'd market this home and what you've sold nearby." },
  { value: "investor", label: "Investors", hint: "Lead with the numbers: returns, terms, and the deal case." },
];

// ─── what the answers become ────────────────────────────────────────────────

const MAX_PLACEHOLDER_HEADLINE = 80;

function join(lead: string, tail?: string | null): string {
  const value = tail ? `${lead} — ${tail}` : lead;
  return value.slice(0, MAX_PLACEHOLDER_HEADLINE);
}

const label = (options: readonly Option[], value: string | null): string | null =>
  options.find((option) => option.value === value)?.label ?? null;

const CONTRACTOR_TRADE_LEAD: Record<string, string> = {
  general: "General contractor", electrical: "Electrical contractor",
  plumbing: "Plumbing contractor", hvac: "HVAC contractor", roofing: "Roofing contractor",
  "concrete-masonry": "Concrete and masonry contractor", framing: "Framing contractor",
  excavation: "Excavation contractor", landscaping: "Landscaping contractor",
  painting: "Painting contractor", flooring: "Flooring contractor", emcs: "EMCS contractor",
  analytics: "Building analytics contractor", integration: "Systems integration contractor",
  mechanical: "Mechanical contractor",
};

const CONTRACTOR_AUDIENCE_TAIL: Record<string, string> = {
  gc: "bidding to general contractors", "owner-dev": "bidding to owners and developers",
  "public-rfp": "bidding on public contracts", homeowner: "bidding to homeowners",
  "mechanical-contractor": "bidding to mechanical contractors",
  "electrical-contractor": "bidding to electrical contractors",
};

const REAL_ESTATE_LEAD: Record<string, string> = {
  "res-single": "Single-family agent", "res-condo": "Condo and townhome agent",
  luxury: "Luxury agent", "new-construction": "New-construction agent",
  commercial: "Commercial agent", industrial: "Industrial agent",
  land: "Land and rural agent", "multi-family": "Multi-family agent",
  vacation: "Vacation rental agent", "property-mgmt": "Property manager",
};

const REAL_ESTATE_TAIL: Record<string, string> = {
  buyers: "working with buyers", sellers: "working with sellers",
  both: "working with buyers and sellers", brokerage: "seeking a brokerage",
  investors: "working with investors",
};

const SALES_LEAD: Record<string, string> = {
  product: "Product sales", saas: "SaaS sales", services: "Professional services sales",
  financial: "Financial products sales", insurance: "Insurance sales", consulting: "Consulting sales",
  manufacturing: "Industrial equipment sales", healthcare: "Healthcare sales",
  marketing: "Marketing services sales", education: "Education and training sales",
  subscription: "Subscription sales", franchise: "Franchise sales",
};

const SALES_TAIL: Record<string, string> = {
  b2c: "selling to consumers", smb: "selling to small business", midmarket: "selling to mid-market",
  enterprise: "selling to enterprise", gov: "selling to government", nonprofit: "selling to nonprofits",
  education: "selling to education", healthcare: "selling to healthcare",
  channel: "selling through channel partners", investors: "pitching investors",
};

const UNIVERSITY_LEAD: Record<string, string> = {
  undergraduate: "Undergraduate applicant", "grad-masters": "Master's applicant",
  "grad-mba": "MBA applicant", "grad-law": "Law school applicant",
  "grad-medical": "Medical school applicant", "grad-phd": "PhD applicant",
  "grad-engineering": "Graduate engineering applicant",
  "grad-education": "Graduate education applicant",
  "grad-policy-health": "Public policy applicant", "grad-arts": "MFA applicant",
  "grad-other": "Graduate school applicant",
};

const LISTING_PLACEHOLDER: Record<ListingAudience, string> = {
  buyer: "Property listing — for buyers",
  seller: "Listing pitch — for sellers",
  investor: "Investment listing — for investors",
};

export type IntakeAnswers = {
  /** Athlete. */
  sport?: string | null;
  level?: string | null;
  /** Contractor, real estate, sales. */
  audience?: string | null;
  trade?: string | null;
  specialty?: string | null;
  offering?: string | null;
  /** University. */
  schoolType?: string | null;
  major?: string | null;
  skipped?: boolean;
  /** Listing. */
  listingAudience?: ListingAudience | null;
};

/**
 * The sentence stored as `wizard_meta.jobTarget`, which is what the AI is later
 * given as context. Listing pages deliberately do not have one.
 */
export function buildJobTarget(kind: PitchKind, answers: IntakeAnswers): string | null {
  switch (kind) {
    case "athlete": {
      const level = label(ATHLETE_LEVELS, answers.level ?? null);
      if (!answers.sport || !level) return null;
      return `${answers.sport} — ${level} recruit`.slice(0, 120);
    }
    case "contractor": {
      const trade = label(TRADES, answers.trade ?? null);
      const audience = label(CONTRACTOR_AUDIENCES, answers.audience ?? null);
      if (!trade || !audience) return null;
      return `${trade} contractor — bidding to ${audience}`.slice(0, 120);
    }
    case "real-estate": {
      const specialty = label(REAL_ESTATE_SPECIALTIES, answers.specialty ?? null);
      const audience = label(REAL_ESTATE_AUDIENCES, answers.audience ?? null);
      if (!specialty || !audience) return null;
      return `${specialty} agent — pitching ${audience}`.slice(0, 120);
    }
    case "sales": {
      const offering = label(SALES_OFFERINGS, answers.offering ?? null);
      const audience = label(SALES_AUDIENCES, answers.audience ?? null);
      if (!offering || !audience) return null;
      return `${offering} sales — pitching ${audience}`.slice(0, 120);
    }
    case "university": {
      if (answers.skipped) return "University application";
      const schoolLabel = label(SCHOOL_TYPES, answers.schoolType ?? null);
      if (!schoolLabel) return "University application";
      if (answers.schoolType === "undergraduate") {
        return join("Undergraduate application", answers.major?.trim() || null).slice(0, 120);
      }
      return `${schoolLabel} application`.slice(0, 120);
    }
    default:
      return null;
  }
}

/**
 * The stand-in headline shown wherever a page has none yet — on the dashboard
 * card and in the page's own hero. It is never written to `headline`: that
 * stays the user's to fill.
 */
export function buildPlaceholderHeadline(kind: PitchKind, answers: IntakeAnswers): string {
  switch (kind) {
    case "athlete": {
      const level = label(ATHLETE_LEVELS, answers.level ?? null);
      if (!answers.sport) return level ? `${level} recruit` : "Athlete";
      return join(`${answers.sport} player`, level ? `${level} recruit` : null);
    }
    case "contractor":
      return join(
        CONTRACTOR_TRADE_LEAD[answers.trade ?? ""] ?? "Contractor",
        CONTRACTOR_AUDIENCE_TAIL[answers.audience ?? ""],
      );
    case "real-estate":
      return join(
        REAL_ESTATE_LEAD[answers.specialty ?? ""] ?? "Real estate agent",
        REAL_ESTATE_TAIL[answers.audience ?? ""],
      );
    case "sales":
      return join(
        SALES_LEAD[answers.offering ?? ""] ?? "Sales professional",
        SALES_TAIL[answers.audience ?? ""],
      );
    case "university":
      if (answers.skipped) return "University applicant";
      return UNIVERSITY_LEAD[answers.schoolType ?? ""] ?? "University applicant";
    case "listing":
      return LISTING_PLACEHOLDER[answers.listingAudience ?? "buyer"] ?? "Property listing";
    default:
      return "";
  }
}
