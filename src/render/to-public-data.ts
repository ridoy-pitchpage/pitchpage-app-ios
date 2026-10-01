import type { PageModel } from "@/page/page-model";
import type { Database } from "@/api/database.types";

type PitchPageRow = Database["public"]["Tables"]["pitch_pages"]["Row"];

/**
 * The page, in the shape the website's PublicPitchView takes.
 *
 * Two sources, on purpose. The DRAFT is what the builder is editing right now,
 * keystrokes included, so every field it owns comes from there — sending the
 * saved row instead would show the page as it was before the last few edits.
 * The ROW supplies the columns the draft does not carry at all (open_to, the
 * CTA labels, the résumé, credentials, documents), which the layouts read and
 * which only the website writes.
 *
 * Every field the layouts index into without guarding gets a safe value
 * rather than undefined: /app-render rejects a page missing them, and a layout
 * reading `open_to.map` on undefined is a blank screen rather than an error.
 */
export function toPublicData(draft: PageModel, row: PitchPageRow | null | undefined) {
  return {
    slug: draft.slug ?? row?.slug ?? "",
    template: draft.template ?? row?.template ?? "corporate__blue__light",
    full_name: draft.full_name ?? "",
    headline: draft.headline ?? "",
    bio: draft.bio ?? "",
    video_url: draft.video_url ?? null,
    video_trim_start: row?.video_trim_start ?? null,
    video_trim_end: row?.video_trim_end ?? null,
    portrait_url: draft.portrait_url ?? null,
    location: draft.location ?? null,
    email: draft.email ?? null,
    linkedin_url: draft.linkedin_url ?? null,
    open_to: Array.isArray(row?.open_to) ? (row.open_to as string[]) : [],
    primary_cta_label: row?.primary_cta_label ?? null,
    primary_cta_url: draft.primary_cta_url ?? null,
    resume_url: row?.resume_url ?? null,
    final_cta_label: row?.final_cta_label ?? null,
    final_cta_url: draft.final_cta_url ?? null,
    tagline: row?.tagline ?? null,
    hero_image_url: draft.hero_image_url ?? null,
    supporting_documents: Array.isArray(row?.supporting_documents)
      ? row.supporting_documents
      : [],
    credential_links: Array.isArray(row?.credential_links) ? row.credential_links : [],
    sections: draft.sections,
    portfolio: draft.portfolio ?? undefined,
    film: draft.film ?? undefined,
    listing: draft.listing ?? undefined,
    og_image_url: row?.og_image_url ?? null,
  };
}

export type PublicData = ReturnType<typeof toPublicData>;
