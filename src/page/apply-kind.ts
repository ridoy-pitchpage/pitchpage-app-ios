import { savePage, type PitchPageRow, type SavePagePatch } from "@/api/supabase-direct";
import { supabase } from "@/auth/supabase";
import { blockIsEmpty, clampSections, type PageSection } from "./page-sections";
import {
  buildSeedSections,
  LISTING_CTA_LABEL,
  SKIPS_RESUME_UPLOAD,
  type ListingAudience,
  type PitchKind,
} from "./page-types";
import { buildJobTarget, buildPlaceholderHeadline, type IntakeAnswers } from "./intake-options";

/**
 * Choosing a page type, and what it writes.
 *
 * The important rule, carried from the web: a seed NEVER overwrites content
 * someone has typed. Switching to a kind that re-seeds is the one case that
 * replaces sections, and the user confirms it first.
 */

/** The address to put in a new page's contact block. */
export async function ownerEmailFor(row: Pick<PitchPageRow, "email">): Promise<string> {
  const onRow = typeof row.email === "string" ? row.email.trim() : "";
  if (onRow) return onRow;
  try {
    // The stored session, not a round trip: this runs while the user is
    // waiting on a screen transition.
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.email ?? "";
  } catch {
    return "";
  }
}

/** True when any section already holds something worth keeping. */
export function hasSectionContent(sections: PageSection[]): boolean {
  return sections.some((section) => !blockIsEmpty(section.blockType, section.data));
}

type WizardMeta = Record<string, unknown>;

function readMeta(value: unknown): WizardMeta {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as WizardMeta) }
    : {};
}

export function currentPitchKind(wizardMeta: unknown): PitchKind | null {
  const meta = readMeta(wizardMeta);
  const kind = meta.pitchKind ?? meta.chosenType;
  return typeof kind === "string" ? (kind as PitchKind) : null;
}

/**
 * Write the chosen type, its seeded sections and its metadata in one save.
 *
 * One save rather than the web's two round trips: on a phone the second can
 * land after the screen has moved on, and a half-applied page type is worse
 * than a slightly slower transition.
 */
export async function applyPitchKind(
  row: PitchPageRow,
  kind: PitchKind,
  answers: IntakeAnswers = {},
): Promise<{ updatedAt: string | null }> {
  const existing = clampSections(row.sections);
  const meta = readMeta(row.wizard_meta);
  const ownerEmail = await ownerEmailFor(row);
  const listingAudience: ListingAudience = answers.listingAudience ?? "buyer";

  const alreadyThisKind = currentPitchKind(row.wizard_meta) === kind;
  // Re-running an intake must not wipe what the last one produced.
  const sections =
    alreadyThisKind || hasSectionContent(existing)
      ? existing
      : buildSeedSections(kind, ownerEmail, { listingAudience });

  const jobTarget = buildJobTarget(kind, answers);
  const placeholderHeadline = buildPlaceholderHeadline(kind, answers);

  const nextMeta: WizardMeta = {
    ...meta,
    chosenType: kind,
    pitchKind: kind,
    ...(jobTarget ? { jobTarget } : {}),
    ...(placeholderHeadline ? { placeholderHeadline } : {}),
    skipsResumeUpload: SKIPS_RESUME_UPLOAD.has(kind),
    ...(kind === "listing" ? { listing_audience: listingAudience } : {}),
    ...(kind === "university" ? { athleteMode: false } : {}),
  };

  const patch: SavePagePatch = {
    sections: sections as unknown as SavePagePatch["sections"],
    wizard_meta: nextMeta as SavePagePatch["wizard_meta"],
    // Never `headline`: that stays the user's to write, and the placeholder
    // above is only ever shown, never saved into it.
    ...(ownerEmail ? { email: ownerEmail } : {}),
    ...(kind === "listing"
      ? { primary_cta_label: LISTING_CTA_LABEL[listingAudience] }
      : {}),
  };

  const result = await savePage(row.id, patch, row.updated_at ?? null);
  return { updatedAt: result.updated_at };
}

/**
 * Replace the sections for a kind the user has confirmed switching to. Used
 * only after the "Switch & replace sections" confirm.
 */
export async function reseedForKind(
  row: PitchPageRow,
  kind: PitchKind,
  answers: IntakeAnswers = {},
): Promise<{ updatedAt: string | null }> {
  const meta = readMeta(row.wizard_meta);
  const ownerEmail = await ownerEmailFor(row);
  const listingAudience: ListingAudience = answers.listingAudience ?? "buyer";

  const patch: SavePagePatch = {
    sections: buildSeedSections(kind, ownerEmail, {
      listingAudience,
    }) as unknown as SavePagePatch["sections"],
    wizard_meta: {
      ...meta,
      chosenType: kind,
      pitchKind: kind,
      ...(buildJobTarget(kind, answers) ? { jobTarget: buildJobTarget(kind, answers) } : {}),
      placeholderHeadline: buildPlaceholderHeadline(kind, answers),
      skipsResumeUpload: SKIPS_RESUME_UPLOAD.has(kind),
      ...(kind === "listing" ? { listing_audience: listingAudience } : {}),
    } as SavePagePatch["wizard_meta"],
    ...(ownerEmail ? { email: ownerEmail } : {}),
  };

  const result = await savePage(row.id, patch, row.updated_at ?? null);
  return { updatedAt: result.updated_at };
}
