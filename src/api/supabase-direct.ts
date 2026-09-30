import { supabase } from "@/auth/supabase";
import { makeRefSlug } from "@/lib/share";
import { PITCH_SAVE_CONFLICT } from "@/lib/errors";
import type { Database } from "./database.types";

/**
 * The parts of the product the app reaches straight through Supabase, without
 * going via the app API.
 *
 * These are exactly the reads and writes the website's own browser already
 * makes: the tables carry RLS policies scoped to `auth.uid()`, and the RPCs are
 * SECURITY DEFINER functions granted to `authenticated` that check the caller
 * themselves (master plan §9.3). Nothing here needs a backend change, which is
 * why the app can list, edit, publish and share pages before the API ships.
 *
 * Anything involving AI, Paige, analytics rollups, uploads that need a signed
 * URL, or company and admin work goes through the app API instead: that logic
 * lives in server code and must not be reimplemented here.
 */

export type PitchPageRow = Database["public"]["Tables"]["pitch_pages"]["Row"];
export type PitchPageUpdate = Database["public"]["Tables"]["pitch_pages"]["Update"];
export type CreditTransactionRow = Database["public"]["Tables"]["credit_transactions"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** The columns the Pages list needs — matching the web's `listMyPitchPages`. */
const PAGE_CARD_COLUMNS =
  "id, slug, full_name, headline, updated_at, video_url, published_at, org_id, og_image_url, og_image_key, wizard_meta" as const;

export type PageCard = Pick<
  PitchPageRow,
  | "id"
  | "slug"
  | "full_name"
  | "headline"
  | "updated_at"
  | "video_url"
  | "published_at"
  | "org_id"
  | "og_image_url"
  | "og_image_key"
  | "wizard_meta"
>;

/** Every page the signed-in user owns, newest first. */
export async function listMyPages(): Promise<PageCard[]> {
  const { data, error } = await supabase
    .from("pitch_pages")
    .select(PAGE_CARD_COLUMNS)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PageCard[];
}

/** One page in full, for the builder and the preview. */
export async function getMyPage(id: string): Promise<PitchPageRow> {
  const { data, error } = await supabase.from("pitch_pages").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

/**
 * The style a new page starts on.
 *
 * Set explicitly, exactly as `createPitchPage` does on the web, because the
 * COLUMN default is the pre-family-system string 'sales' — not a style anyone
 * can pick, and one that renders through the neutral fallback instead of a
 * designed layout. A page created without this looks broken.
 */
const DEFAULT_TEMPLATE = "corporate__blue__light";

/** The web's `slugify`, character for character. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Create a draft.
 *
 * `slug` has no database default, so it is built here the way the web builds
 * it: the name slugified, plus five random characters. The randomness is what
 * keeps collisions rare; the web's save path also retries on a collision, and
 * when `POST /pages` lands (§9.2) this should move there to inherit that.
 *
 * `published_at` is refused on insert by the `guard_pitch_page_privileged_cols`
 * trigger, so a page can only ever go live through the publish RPC.
 */
export async function createPage(fullName: string): Promise<{ id: string }> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Unauthorized: no session");

  const displayName = fullName.trim();
  const slug = `${slugify(displayName) || "pitch"}-${Math.random().toString(36).slice(2, 7)}`;

  const { data, error } = await supabase
    .from("pitch_pages")
    .insert({ user_id: userId, slug, full_name: displayName, template: DEFAULT_TEMPLATE })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function deletePage(id: string): Promise<void> {
  const { error } = await supabase.from("pitch_pages").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Publishing spends a credit, and every rule about that — a company's pool, an
 * allocation, a page that was already paid for republishing free — lives inside
 * the RPC. A `false` result means the RPC ran and found no credit to spend.
 */
export async function publishPage(id: string): Promise<{ published: boolean }> {
  const { data, error } = await supabase.rpc("publish_pitch_page", { _pitch_page_id: id });
  if (error) throw error;
  return { published: data === true };
}

/**
 * `unpublish_pitch_page` exists live but is missing from the generated types,
 * which were produced before that migration was applied. The web works around
 * it the same way and explains why the cast is on the client rather than on a
 * detached `.rpc`: pulling the method off the object loses the auth header and
 * its `this` binding.
 */
type UntypedRpc = {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ error: { message: string } | null }>;
};

export async function unpublishPage(id: string): Promise<void> {
  const client = supabase as unknown as UntypedRpc;
  const { error } = await client.rpc("unpublish_pitch_page", { _pitch_page_id: id });
  if (error) throw new Error(error.message);
}

export type PublishEligibility = {
  mode: "sponsored" | "awaiting_credit" | "paid";
  org_name: string | null;
  credits_remaining: number;
};

/** What the publish sheet shows before anyone taps anything. */
export async function getPublishEligibility(id: string): Promise<PublishEligibility> {
  const { data, error } = await supabase.rpc("get_publish_eligibility", { _pitch_page_id: id });
  if (error) throw error;
  return data as unknown as PublishEligibility;
}

export type Credits = { balance: number; transactions: CreditTransactionRow[] };

/** Balance and the recent ledger, the two things the Credits screen shows. */
export async function getMyCredits(): Promise<Credits> {
  const [balanceResult, ledgerResult] = await Promise.all([
    supabase.from("user_credits").select("balance").maybeSingle(),
    supabase
      .from("credit_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (balanceResult.error) throw balanceResult.error;
  if (ledgerResult.error) throw ledgerResult.error;

  return {
    // No row means a new account that has never held a credit, which is 0 —
    // the web grants nothing on signup.
    balance: balanceResult.data?.balance ?? 0,
    transactions: ledgerResult.data ?? [],
  };
}

export type PageLinkRow = Database["public"]["Tables"]["pitch_page_links"]["Row"];

/** The tracked links on one page, newest first. */
export async function listPageLinks(pitchPageId: string): Promise<PageLinkRow[]> {
  const { data, error } = await supabase
    .from("pitch_page_links")
    .select("*")
    .eq("pitch_page_id", pitchPageId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Create a tracked link.
 *
 * Published only, as on the web: a labelled link exists to be sent out, and a
 * draft has no public URL to label. The slug carries four random characters, so
 * a collision is rare; one retry with a fresh suffix covers it, matching the
 * web's loop. 23505 is the unique-violation code — anything else is a real
 * failure and is thrown.
 */
export async function createPageLink(
  pitchPageId: string,
  label: string,
): Promise<PageLinkRow> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Give the link a label (e.g. the company name).");

  const { data: page, error: pageError } = await supabase
    .from("pitch_pages")
    .select("id, published_at")
    .eq("id", pitchPageId)
    .maybeSingle();
  if (pageError) throw pageError;
  if (!page) throw new Error("Pitch page not found.");
  if (!page.published_at) {
    throw new Error("Publish the page first — links track the live URL.");
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await supabase
      .from("pitch_page_links")
      .insert({ pitch_page_id: page.id, label: trimmed, ref_slug: makeRefSlug(trimmed) })
      .select("*")
      .single();
    if (!error && data) return data;
    if (error && error.code !== "23505") throw error;
  }

  throw new Error("Couldn't create the link — please try again.");
}

export async function deletePageLink(id: string): Promise<void> {
  const { error } = await supabase.from("pitch_page_links").delete().eq("id", id);
  if (error) throw error;
}

export async function getMyProfile(): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function setDisplayName(displayName: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Unauthorized: no session");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName.trim() })
    .eq("user_id", userId);
  if (error) throw error;
}

/** Whether to show the Company tab, and which companies to offer. */
export async function getMyOrgs(): Promise<Array<Record<string, unknown>>> {
  const { data, error } = await supabase.rpc("get_my_orgs");
  if (error) throw error;
  return (data ?? []) as Array<Record<string, unknown>>;
}

/** Whether to show the Admin entry in Account. */
export async function amIPlatformAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_admin");
  if (error) return false;
  return data === true;
}

// ─── Saving ─────────────────────────────────────────────────────────────────

/**
 * What a builder save may write. Derived from the generated Update type rather
 * than hand-written, so the app cannot get a column's nullability wrong.
 *
 * Worth knowing: `bio`, `headline`, `full_name`, `slug` and `template` are NOT
 * NULL in the database. Clearing one means writing `""`, and sending `null`
 * would be rejected. `open_to` is a text array, not free JSON.
 *
 * Everything left out here is the server's: `published_at` (only the publish
 * RPC), `user_id` and `org_id` (guarded by a trigger), `updated_at` (set by the
 * trigger), and the supporting-document and video-master columns.
 */
export type SavePagePatch = Partial<
  Pick<
    PitchPageUpdate,
    | "slug"
    | "full_name"
    | "headline"
    | "bio"
    | "email"
    | "location"
    | "linkedin_url"
    | "template"
    | "portrait_url"
    | "hero_image_url"
    | "video_url"
    | "video_trim_start"
    | "video_trim_end"
    | "video_effect"
    | "resume_url"
    | "tagline"
    | "primary_cta_label"
    | "primary_cta_url"
    | "final_cta_label"
    | "final_cta_url"
    | "open_to"
    | "sections"
    | "wizard_meta"
    | "portfolio"
    | "film"
    | "listing"
    | "credential_links"
    | "og_image_url"
    | "og_image_key"
  >
>;

export type SaveResult = { updated_at: string | null; slug: string | null };

/** Postgres unique-violation, which for this table means the slug is taken. */
function isSlugConflict(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "23505" || /slug/i.test(error.message ?? "");
}

const SLUG_MAX_ATTEMPTS = 4;

/**
 * Save a page.
 *
 * Two behaviours are copied exactly from the web's `savePitchPage`, because
 * both protect data rather than polish:
 *
 * 1. **Optimistic concurrency.** The update carries `expected_updated_at` as a
 *    filter, so a second device that started from an older version updates zero
 *    rows instead of silently overwriting the first. Zero rows is ambiguous —
 *    the version moved on, or the row is not the caller's — so only on that
 *    path does it pay for a second read to tell which. A rejected save also
 *    never fires the privileged-column trigger, because that runs per row
 *    actually updated.
 *
 * 2. **Slug collisions retry** with `-2`, `-3`… A slug is only sent when the
 *    caller is deliberately changing it.
 *
 * The returned `updated_at` is the baseline for the caller's NEXT save: the
 * trigger has just replaced the one it started from.
 */
export async function savePage(
  id: string,
  patch: SavePagePatch,
  expectedUpdatedAt: string | null,
): Promise<SaveResult> {
  let slug = patch.slug;

  for (let attempt = 0; attempt < SLUG_MAX_ATTEMPTS; attempt += 1) {
    let write = supabase
      .from("pitch_pages")
      .update({ ...patch, ...(slug ? { slug } : {}) })
      .eq("id", id);
    if (expectedUpdatedAt) write = write.eq("updated_at", expectedUpdatedAt);

    const { data, error } = await write.select("id, updated_at, slug");

    if (!error) {
      if (!data || data.length === 0) {
        if (expectedUpdatedAt) {
          const { data: current } = await supabase
            .from("pitch_pages")
            .select("id")
            .eq("id", id)
            .maybeSingle();
          // The row is there and is the caller's, so the only thing that failed
          // was the version match — something else wrote to it first.
          if (current) throw new Error(PITCH_SAVE_CONFLICT);
        }
        throw new Error("Not found");
      }
      const row = data[0] as { updated_at?: string | null; slug?: string | null };
      return { updated_at: row.updated_at ?? null, slug: row.slug ?? null };
    }

    // Anything other than a slug collision is a genuine failure.
    if (!isSlugConflict(error) || !patch.slug) throw error;
    slug = `${patch.slug}-${attempt + 2}`;
  }

  throw new Error(
    "That address is taken and we couldn't find a free variation — please pick a slightly different one.",
  );
}
