/**
 * What a template's testimonial section says before its owner has written one.
 *
 * The website's sample personas come with quotes — "Camila lands the logos
 * everyone else says are impossible" — signed by people who do not exist
 * ("Greg Nolan, VP Sales"). On a sample page that is fine; it is labelled a
 * sample. Seeded onto a real person's page it becomes a fabricated endorsement
 * from a named third party, published under their own name the moment they
 * forget to change it.
 *
 * So the section keeps its shape and its place in the template, and says
 * plainly what belongs there instead. Nobody reads "Their name" as a person,
 * and the publish check names it if it is still there.
 *
 * scripts/build-template-seeds.mjs writes these same strings into the seeds;
 * __tests__/template-seeds.test.ts holds the two together.
 */
export const SAMPLE_QUOTE = {
  quote: "Add a line from someone who has worked with you — their words, copied exactly.",
  name: "Their name",
  role: "Their role",
} as const;

/** Whether a quote is still the template's placeholder rather than a real one. */
export function isSampleQuote(item: { name?: unknown; quote?: unknown }): boolean {
  return item.name === SAMPLE_QUOTE.name || item.quote === SAMPLE_QUOTE.quote;
}
