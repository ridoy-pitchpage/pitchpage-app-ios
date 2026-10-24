import { savePage, type PitchPageRow } from "@/api/supabase-direct";
import { clampSections, freshEntryId, type PageSection } from "@/page/page-sections";
import { useDraft } from "@/state/draft-store";

jest.mock("@/api/supabase-direct", () => ({ savePage: jest.fn() }));
const save = jest.mocked(savePage);

type Row = Record<string, unknown>;
const rows = (section: PageSection): Row[] => (section.data as { items: Row[] }).items;

// A timeline the website saved after Proof shipped: the first row carries an
// id (proof may be attached to it); the second predates ids.
const stored = [
  {
    id: "sec-experience",
    title: "Experience",
    blockType: "timeline",
    order: 0,
    visible: true,
    data: {
      items: [
        { id: "e-keep", period: "2024", title: "Lead engineer", org: "Acme", bullets: ["Shipped it"] },
        { period: "2022", title: "Engineer", org: "Acme", bullets: [] },
      ],
    },
  },
];

beforeEach(() => {
  save.mockReset().mockResolvedValue({ updated_at: "saved", slug: "sample" });
  useDraft.getState().clear();
});
afterEach(() => useDraft.getState().clear());

it("keeps a stored row id through load, an edit and the save", async () => {
  // Load: page-model runs the stored sections through clampSections.
  const loaded = clampSections(stored);
  expect(rows(loaded[0]!)[0]!.id).toBe("e-keep");
  // A row saved before ids gets the same deterministic id the website gives it.
  const derived = rows(loaded[0]!)[1]!.id;
  expect(derived).toMatch(/^e[0-9a-z]+$/);

  // Edit, as BlockEditor's update does: the row is spread with the patch.
  const edited = loaded.map((section) => ({
    ...section,
    data: {
      ...(section.data as object),
      items: rows(section).map((row, i) => (i === 0 ? { ...row, title: "Principal engineer" } : row)),
    },
  })) as PageSection[];

  useDraft.getState().load({
    id: "page-a", full_name: "Sam", updated_at: "baseline", sections: loaded, wizard_meta: {},
  } as unknown as PitchPageRow);
  useDraft.getState().setSections(edited);
  await expect(useDraft.getState().flush()).resolves.toBe(true);

  const saved = (save.mock.calls[0]?.[1] as { sections: PageSection[] }).sections;
  expect(rows(saved[0]!)[0]).toMatchObject({ id: "e-keep", title: "Principal engineer" });
  expect(rows(saved[0]!)[1]!.id).toBe(derived);
});

it("gives a brand-new row an id of its own", () => {
  const a = freshEntryId();
  const b = freshEntryId();
  expect(a).toMatch(/^[A-Za-z0-9_-]{1,60}$/);
  expect(a).not.toBe(b);
});
