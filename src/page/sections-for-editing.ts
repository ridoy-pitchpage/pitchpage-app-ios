import type { PageSection } from "./page-sections";

/**
 * The section list for the BUILDER rather than a page. App-only: the web's
 * page-sections.ts once carried it and no longer does, and that file is copied
 * across unchanged, so it lives here.
 *
 * sectionsForLayout drops empty sections because a published page must not
 * show a heading over nothing. Applied while editing, that hid the entire
 * outline a template seeds: About Me, Experience, Skills, By the Numbers and
 * What People Say all start empty, so the only thing left on screen was
 * Contact, which is the one seed carrying copy. Every template opened as the
 * same near-blank page, and the sections that were supposed to be filled in
 * could not be reached to fill in.
 *
 * So the builder keeps them. Emptiness is still what decides whether a
 * section is published; it is not what decides whether its owner can see it.
 */
export function sectionsForEditing(data: { sections?: PageSection[] | null }): PageSection[] {
  return (data.sections ?? []).filter((s) => s.visible).sort((a, b) => a.order - b.order);
}
