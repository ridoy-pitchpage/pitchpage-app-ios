import { AppState } from "react-native";
import { create } from "zustand";

import { savePage, type PitchPageRow, type SavePagePatch } from "@/api/supabase-direct";
import { isSaveConflictError } from "@/lib/errors";
import { toPageModel, type PageModel } from "@/page/page-model";
import type { PageSection } from "@/page/page-sections";

/**
 * The page being edited, and the machinery that gets it saved.
 *
 * Three rules, all carried over from the web builder because each one exists to
 * stop losing someone's work:
 *
 * 1. **Saves are serialised.** One write is in flight at a time and the next is
 *    queued behind it. Two overlapping writes would each carry a different
 *    `expected_updated_at` and the second would look like a conflict with the
 *    first.
 * 2. **The baseline moves with every save.** The database trigger replaces
 *    `updated_at` on write, so the value the next save compares against is the
 *    one the last save returned, never the one the screen loaded with.
 * 3. **A conflict stops everything.** If another device wrote to this page,
 *    the app stops saving and asks the user to reload rather than deciding
 *    whose version wins.
 *
 * Typing debounces at 800ms, matching the web. Anything that took real effort
 * to produce — a photo, a video, a recorded answer — saves immediately, because
 * losing it costs more than a round trip.
 */

/** How long to wait after the last keystroke before writing. */
const FIELD_DEBOUNCE_MS = 800;

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error" | "conflict";

type DraftState = {
  pageId: string | null;
  page: PageModel | null;
  /** The baseline the next save compares against. */
  baseline: string | null;
  status: SaveStatus;
  /** Fields changed since the last write started. */
  dirty: SavePagePatch;
  lastError: unknown;

  load: (row: PitchPageRow) => void;
  clear: () => void;
  /** Change page-level fields. Debounced. */
  patch: (patch: SavePagePatch) => void;
  /** Change page-level fields and write at once. */
  patchNow: (patch: SavePagePatch) => Promise<void>;
  /** Replace the section list. Debounced, or immediate with `now`. */
  setSections: (sections: PageSection[], options?: { now?: boolean }) => void;
  /** Write anything outstanding. Safe to call when there is nothing to do. */
  flush: () => Promise<void>;
};

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<void> | null = null;

function cancelDebounce() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

export const useDraft = create<DraftState>((set, get) => {
  /** One write. Never called concurrently — `flush` serialises through inFlight. */
  async function write(): Promise<void> {
    const { pageId, dirty, baseline, status } = get();
    if (!pageId || status === "conflict") return;
    if (Object.keys(dirty).length === 0) return;

    // Claim this batch before awaiting, so edits made during the write are
    // collected for the next one instead of being dropped by the reset below.
    set({ status: "saving", dirty: {} });

    try {
      const result = await savePage(pageId, dirty, baseline);
      set({ status: "saved", baseline: result.updated_at, lastError: null });

      // Something changed while that was in flight.
      if (Object.keys(get().dirty).length > 0) {
        set({ status: "pending" });
        await write();
      }
    } catch (error) {
      if (isSaveConflictError(error)) {
        // Deliberately does not restore `dirty`: once the versions have
        // diverged there is nothing safe to retry, and the user reloads.
        set({ status: "conflict", lastError: error });
        return;
      }
      // Put the batch back in front of anything newer so no edit is lost.
      set((s) => ({ status: "error", lastError: error, dirty: { ...dirty, ...s.dirty } }));
    }
  }

  function schedule(immediate: boolean) {
    cancelDebounce();
    if (get().status === "conflict") return;
    set({ status: "pending" });

    if (immediate) {
      void get().flush();
      return;
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void get().flush();
    }, FIELD_DEBOUNCE_MS);
  }

  return {
    pageId: null,
    page: null,
    baseline: null,
    status: "idle",
    dirty: {},
    lastError: null,

    load: (row) => {
      cancelDebounce();
      set({
        pageId: row.id,
        page: toPageModel(row),
        baseline: row.updated_at ?? null,
        status: "idle",
        dirty: {},
        lastError: null,
      });
    },

    clear: () => {
      cancelDebounce();
      set({ pageId: null, page: null, baseline: null, status: "idle", dirty: {}, lastError: null });
    },

    patch: (patch) => {
      set((s) => ({
        // The local copy updates at once so the screen never lags the keyboard.
        page: s.page ? { ...s.page, ...(patch as Partial<PageModel>) } : s.page,
        dirty: { ...s.dirty, ...patch },
      }));
      schedule(false);
    },

    patchNow: async (patch) => {
      set((s) => ({
        page: s.page ? { ...s.page, ...(patch as Partial<PageModel>) } : s.page,
        dirty: { ...s.dirty, ...patch },
      }));
      cancelDebounce();
      await get().flush();
    },

    setSections: (sections, options) => {
      set((s) => ({
        page: s.page ? { ...s.page, sections } : s.page,
        // Order is reindexed on the way out, because the database column is the
        // list's identity and the web reindexes 0..n-1 on every save.
        dirty: { ...s.dirty, sections: sections.map((sec, i) => ({ ...sec, order: i })) },
      }));
      schedule(options?.now === true);
    },

    flush: async () => {
      cancelDebounce();
      // Chain onto whatever is running so two writes never overlap.
      const run = (inFlight ?? Promise.resolve()).then(write);
      inFlight = run.finally(() => {
        if (inFlight === run) inFlight = null;
      });
      await inFlight;
    },
  };
});

/**
 * Write pending edits when the app leaves the foreground. iOS can suspend or
 * kill a backgrounded app without warning, and an 800ms timer does not survive
 * that.
 */
export function startDraftAutosaveOnBackground(): () => void {
  const subscription = AppState.addEventListener("change", (state) => {
    if (state !== "active") void useDraft.getState().flush();
  });
  return () => subscription.remove();
}

/** What the header's save indicator shows. */
export function saveLabel(status: SaveStatus): string {
  switch (status) {
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "pending":
      return "Saving…";
    case "error":
      return "Not saved";
    case "conflict":
      return "Out of date";
    default:
      return "";
  }
}
