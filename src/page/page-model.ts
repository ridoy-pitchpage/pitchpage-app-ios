import type { PitchPageRow } from "@/api/supabase-direct";
import { clampSections, type PageSection } from "./page-sections";

/**
 * Turning a raw `pitch_pages` row into something the page logic can read.
 *
 * Several columns are `jsonb`, so they arrive as untyped JSON. `sections` in
 * particular must go through `clampSections`, which is deliberately defensive:
 * it drops what it cannot salvage, clamps the rest, dedups ids and reindexes
 * order, and never throws. Reaching past it with a cast would let one malformed
 * section from an older save crash a screen.
 */

export type PagePortfolio = { images?: unknown[] } | null;
export type PageFilm = { clips?: unknown[] } | null;

export type PageModel = {
  id: string;
  slug: string | null;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  email: string | null;
  location: string | null;
  linkedin_url: string | null;
  template: string | null;
  portrait_url: string | null;
  hero_image_url: string | null;
  video_url: string | null;
  primary_cta_url: string | null;
  final_cta_url: string | null;
  published_at: string | null;
  updated_at: string | null;
  org_id: string | null;
  sections: PageSection[];
  portfolio: PagePortfolio;
  film: PageFilm;
  listing: Record<string, unknown> | null;
};

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function toPageModel(row: PitchPageRow): PageModel {
  return {
    id: row.id,
    slug: row.slug ?? null,
    full_name: row.full_name ?? null,
    headline: row.headline ?? null,
    bio: row.bio ?? null,
    email: row.email ?? null,
    location: row.location ?? null,
    linkedin_url: row.linkedin_url ?? null,
    template: row.template ?? null,
    portrait_url: row.portrait_url ?? null,
    hero_image_url: row.hero_image_url ?? null,
    video_url: row.video_url ?? null,
    primary_cta_url: row.primary_cta_url ?? null,
    final_cta_url: row.final_cta_url ?? null,
    published_at: row.published_at ?? null,
    updated_at: row.updated_at ?? null,
    org_id: row.org_id ?? null,
    sections: clampSections(row.sections),
    portfolio: asObject(row.portfolio) as PagePortfolio,
    film: asObject(row.film) as PageFilm,
    listing: asObject(row.listing),
  };
}
