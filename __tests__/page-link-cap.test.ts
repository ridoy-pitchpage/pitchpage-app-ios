import { createPageLink, MAX_TRACKED_LINKS, TRACKED_LINKS_CAP_MESSAGE } from "@/api/supabase-direct";

// createPageLink needs only makeRefSlug from here; the real module pulls in
// expo-constants, which Jest cannot load.
jest.mock("@/lib/share", () => ({ makeRefSlug: (label: string) => label.toLowerCase().replace(/\W+/g, "-") }));

// The server as it answers a Basic page's 6th tracked link since pricing-tiers
// PR 4: a trigger error that names a price and an upgrade.
jest.mock("@/auth/supabase", () => ({
  supabase: {
    from: (table: string) =>
      table === "pitch_pages"
        ? {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: "page-a", published_at: "2026-10-01T00:00:00Z" }, error: null }),
              }),
            }),
          }
        : {
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: null,
                  error: {
                    code: "P0001",
                    message:
                      "Basic pages can track up to 5 companies. Upgrade this page to Pro for $10 to track every company you send it to.",
                  },
                }),
              }),
            }),
          },
  },
}));

it("answers the 6th tracked link with the app's own sentence, not the server's price", async () => {
  const err = (await createPageLink("page-a", "Acme Corp").catch((e: unknown) => e)) as Error;
  expect(err).toBeInstanceOf(Error);
  expect(err.message).toBe(TRACKED_LINKS_CAP_MESSAGE);
  expect(err.message).toContain(String(MAX_TRACKED_LINKS));
  expect(err.message).not.toMatch(/\$|€|£|\bPro\b|upgrade/i);
});
