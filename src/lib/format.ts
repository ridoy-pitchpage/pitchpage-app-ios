/** Small formatters shared across screens. */

/** "just now", "3 hours ago", "12 Mar" — the relative style the web uses. */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  // Past a week a date is more use than a count, and the year only matters
  // once it is not this one.
  const date = new Date(then);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** "1 credit", "5 credits". */
export function creditCount(balance: number): string {
  return `${balance} credit${balance === 1 ? "" : "s"}`;
}

/**
 * What a page is called when it has no headline yet. The web falls back from
 * the headline to a placeholder stored on the page, then to the slug.
 */
export function pageSubtitle(page: {
  headline: string | null;
  slug: string | null;
  wizard_meta: unknown;
}): string {
  if (page.headline?.trim()) return page.headline;

  const meta = page.wizard_meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const placeholder = (meta as Record<string, unknown>).placeholderHeadline;
    if (typeof placeholder === "string" && placeholder.trim()) return placeholder;
  }

  return page.slug ? `/p/${page.slug}` : "Untitled page";
}
