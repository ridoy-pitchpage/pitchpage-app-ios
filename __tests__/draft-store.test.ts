import { savePage, type PitchPageRow, type SaveResult } from "@/api/supabase-direct";
import { PITCH_SAVE_CONFLICT } from "@/lib/errors";
import { hasUnsavedChanges, useDraft } from "@/state/draft-store";

jest.mock("@/api/supabase-direct", () => ({ savePage: jest.fn() }));

const save = jest.mocked(savePage);
const row = (id = "page-a"): PitchPageRow => ({
  id, full_name: "Original", updated_at: "baseline", sections: [], wizard_meta: {},
} as unknown as PitchPageRow);
const result = (baseline = "saved"): SaveResult => ({ updated_at: baseline, slug: "sample" });
const deferred = () => {
  let resolve!: (value: SaveResult) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<SaveResult>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

beforeEach(() => {
  jest.useFakeTimers();
  save.mockReset().mockResolvedValue(result());
  useDraft.getState().clear();
  useDraft.getState().load(row());
});

afterEach(() => {
  useDraft.getState().clear();
  jest.useRealTimers();
});

it("flushes the final keystroke before the debounce timer fires", async () => {
  useDraft.getState().patch({ full_name: "Last keystroke" });
  expect(save).not.toHaveBeenCalled();
  await expect(useDraft.getState().flush()).resolves.toBe(true);
  expect(save).toHaveBeenCalledWith("page-a", { full_name: "Last keystroke" }, "baseline");
  expect(useDraft.getState().page?.full_name).toBe("Last keystroke");
  expect(useDraft.getState().dirty).toEqual({});
});

it("reports failure and keeps the local draft available for retry", async () => {
  save.mockRejectedValueOnce(new Error("Offline"));
  useDraft.getState().patch({ full_name: "Unsaved work" });
  await expect(useDraft.getState().flush()).resolves.toBe(false);
  expect(useDraft.getState()).toMatchObject({
    pageId: "page-a", status: "error", dirty: { full_name: "Unsaved work" },
  });
  expect(useDraft.getState().page?.full_name).toBe("Unsaved work");
  await expect(useDraft.getState().flush()).resolves.toBe(true);
  expect(save).toHaveBeenLastCalledWith("page-a", { full_name: "Unsaved work" }, "baseline");
});

it("serializes simultaneous flushes and saves edits typed during a write with the new baseline", async () => {
  const first = deferred();
  save.mockImplementationOnce(() => first.promise);
  useDraft.getState().patch({ full_name: "First" });
  const one = useDraft.getState().flush();
  await Promise.resolve();
  useDraft.getState().patch({ full_name: "Newest", headline: "New headline" });
  const two = useDraft.getState().flush();
  expect(save).toHaveBeenCalledTimes(1);
  first.resolve(result("baseline-two"));
  await expect(Promise.all([one, two])).resolves.toEqual([true, true]);
  expect(save).toHaveBeenCalledTimes(2);
  expect(save).toHaveBeenLastCalledWith("page-a", { full_name: "Newest", headline: "New headline" }, "baseline-two");
});

it("merges failed writes without replacing newer keystrokes", async () => {
  const first = deferred();
  save.mockImplementationOnce(() => first.promise);
  useDraft.getState().patch({ full_name: "First", headline: "Keep this" });
  const saving = useDraft.getState().flush();
  await Promise.resolve();
  useDraft.getState().patch({ full_name: "Newest" });
  first.reject(new Error("Offline"));
  await expect(saving).resolves.toBe(false);
  expect(useDraft.getState().dirty).toEqual({ full_name: "Newest", headline: "Keep this" });
});

it("retains conflicted edits and never retries them against the stale version", async () => {
  save.mockRejectedValueOnce({ code: PITCH_SAVE_CONFLICT });
  useDraft.getState().patch({ full_name: "Local work" });
  await expect(useDraft.getState().flush()).resolves.toBe(false);
  expect(useDraft.getState().dirty).toEqual({ full_name: "Local work" });
  await expect(useDraft.getState().flush()).resolves.toBe(false);
  expect(save).toHaveBeenCalledTimes(1);
});

it.each(["success", "failure"] as const)("ignores a late %s after another page is loaded", async (outcome) => {
  const first = deferred();
  save.mockImplementationOnce(() => first.promise);
  useDraft.getState().patch({ full_name: "Page A edit" });
  const saving = useDraft.getState().flush();
  await Promise.resolve();
  useDraft.getState().load(row("page-b"));
  if (outcome === "success") first.resolve(result("wrong-baseline"));
  else first.reject(new Error("Offline"));
  await expect(saving).resolves.toBe(false);
  expect(useDraft.getState()).toMatchObject({
    pageId: "page-b", baseline: "baseline", status: "idle", dirty: {}, lastError: null,
  });
});

it("does not resurrect a draft after sign-out clears it", async () => {
  const first = deferred();
  save.mockImplementationOnce(() => first.promise);
  useDraft.getState().patch({ full_name: "Private work" });
  const saving = useDraft.getState().flush();
  await Promise.resolve();
  useDraft.getState().clear();
  first.reject(new Error("Signed out"));
  await expect(saving).resolves.toBe(false);
  expect(useDraft.getState()).toMatchObject({ pageId: null, page: null, dirty: {}, status: "idle" });
});

it("does not let a queued flush save a newly loaded draft", async () => {
  useDraft.getState().patch({ full_name: "Page A" });
  const saving = useDraft.getState().flush();
  useDraft.getState().load(row("page-b"));
  useDraft.getState().patch({ full_name: "Page B" });
  await expect(saving).resolves.toBe(false);
  expect(save).not.toHaveBeenCalled();
  expect(useDraft.getState().dirty).toEqual({ full_name: "Page B" });
});

it("keeps navigation blocked for pending, saving, failed, and conflicted drafts", () => {
  for (const status of ["pending", "saving", "error", "conflict"] as const) {
    expect(hasUnsavedChanges(status)).toBe(true);
  }
  expect(hasUnsavedChanges("idle")).toBe(false);
  expect(hasUnsavedChanges("saved")).toBe(false);
});
