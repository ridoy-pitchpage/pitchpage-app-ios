import { savePage, type PitchPageRow } from "@/api/supabase-direct";
import { applyPitchKind, reseedForKind, savedListingAudience } from "@/page/apply-kind";
import { LISTING_CTA_LABEL } from "@/page/page-types";

jest.mock("@/api/supabase-direct", () => ({ savePage: jest.fn() }));
const mockGetSession = jest.fn().mockResolvedValue({ data: { session: null } });
jest.mock("@/auth/supabase", () => ({
  supabase: { auth: { getSession: () => mockGetSession() } },
}));

const save = jest.mocked(savePage);
const seller = {
  id: "seller-page", email: "owner@example.org", updated_at: "baseline",
  sections: [], wizard_meta: { pitchKind: "listing", listing_audience: "seller", keep: "owner metadata" },
} as unknown as PitchPageRow;

beforeEach(() => {
  save.mockReset().mockResolvedValue({ updated_at: "saved", slug: "listing" });
});

it.each(["seller", "investor"] as const)("preserves the %s audience when setup is reopened without edits", async (audience) => {
  const page = { ...seller, wizard_meta: { ...seller.wizard_meta as object, listing_audience: audience } };
  await applyPitchKind(page, "listing");
  expect(save).toHaveBeenCalledWith("seller-page", expect.objectContaining({
    primary_cta_label: LISTING_CTA_LABEL[audience],
    wizard_meta: expect.objectContaining({
      listing_audience: audience, keep: "owner metadata",
      placeholderHeadline: audience === "seller" ? "Listing pitch — for sellers" : "Investment listing — for investors",
    }),
  }), "baseline");
});

it("honors an explicit audience change", async () => {
  await applyPitchKind(seller, "listing", { listingAudience: "buyer" });
  expect(save).toHaveBeenCalledWith("seller-page", expect.objectContaining({
    primary_cta_label: LISTING_CTA_LABEL.buyer,
    wizard_meta: expect.objectContaining({ listing_audience: "buyer" }),
  }), "baseline");
});

it("also preserves the audience when rebuilding the listing sections", async () => {
  await reseedForKind(seller, "listing");
  expect(save).toHaveBeenCalledWith("seller-page", expect.objectContaining({
    wizard_meta: expect.objectContaining({ listing_audience: "seller" }),
  }), "baseline");
});

it.each([undefined, null, [], {}, { listing_audience: "unknown" }, { listing_audience: "buyer" }])(
  "uses buyer when there is no valid saved audience: %j", (meta) => {
    expect(savedListingAudience(meta)).toBe("buyer");
  },
);

it("reads both saved non-default selections for the form", () => {
  expect(savedListingAudience(seller.wizard_meta)).toBe("seller");
  expect(savedListingAudience({ listing_audience: "investor" })).toBe("investor");
});

describe("Apple's Hide My Email address", () => {
  const RELAY = "x7k2pq9mzt@privaterelay.appleid.com";
  const fresh = { ...seller, id: "fresh-page", email: null, wizard_meta: {} } as unknown as PitchPageRow;

  afterEach(() => mockGetSession.mockResolvedValue({ data: { session: null } }));

  it("is never written onto a page set up by an account signed in with it", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { email: RELAY } } } });
    await applyPitchKind(fresh, "job");
    const patch = save.mock.calls[0]![1] as { email?: string; sections: Array<{ blockType: string; data: { email?: string } }> };
    expect(patch.email).toBeUndefined();
    expect(patch.sections.find((s) => s.blockType === "cta")?.data.email ?? "").toBe("");
  });

  it("gives way to the account's real address when one was saved on the page", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { email: "jane@icloud.com" } } } });
    await applyPitchKind({ ...fresh, email: RELAY } as PitchPageRow, "job");
    expect(save.mock.calls[0]![1]).toEqual(expect.objectContaining({ email: "jane@icloud.com" }));
  });
});
