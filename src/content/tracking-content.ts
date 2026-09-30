// ─────────────────────────────────────────────────────────────────────────────
// The copy from the website's /tracking page (src/routes/tracking.tsx), which
// is what PitchPage promises about what it measures and what it never keeps.
//
// The words are copied verbatim — these are commitments about people's data,
// not marketing, and the app must not make a softer or differently-worded
// version of them. Only the shape changed: the website interleaves them with
// its own icons and scroll animations, and here they are plain data.
//
// HEARTBEAT_SECONDS is read from the analytics module rather than written out,
// exactly as the website does, so the sentence cannot drift from the code if
// the beat is ever retuned.
// ─────────────────────────────────────────────────────────────────────────────

import { HEARTBEAT_SECONDS, dwellBucketLabel } from "@/analytics/analytics-core";

export type Measured = { title: string; body: string };

export const MEASURED: readonly Measured[] = [
  {
    title: "Opens",
    body: "One view per person per ten minutes. Someone re-reading your page does not inflate the number.",
  },
  {
    title: "Video watch depth",
    body: "How far into your introduction they actually got, not just that they pressed play. Each milestone counts once per person.",
  },
  {
    title: "Resume downloads",
    body: "Whether they took the file with them, which is usually the moment a page has done its job.",
  },
  {
    title: "Scroll depth",
    body: "The furthest point of the page they reached, recorded once per visit.",
  },
  {
    title: "Time on page",
    body: `Counted only while the tab is visible and focused, in ${HEARTBEAT_SECONDS}-second beats, and only ever shown as a coarse band.`,
  },
  {
    title: "Which link they used",
    body: "Give each recipient their own tracked link and the opens separate themselves, with no read receipt to ask for.",
  },
] as const;

export const NEVER: readonly string[] = [
  "No cookie is set on a published page. There is no banner because there is nothing to consent to.",
  "No IP address is stored, raw or hashed. One is held in memory briefly, as a key that stops a single machine flooding your counts, and is never written down.",
  "Do Not Track and Global Privacy Control are obeyed. That visit is not recorded at all and you are not notified of it.",
  "From the referring page only the host name is kept, never the full URL.",
  "The browser string is reduced to mobile, desktop or bot before anything is saved.",
] as const;

/** The bands time on page is shown in, read out of the function that makes
 *  them so this stays correct if the thresholds are ever retuned. */
export const DWELL_BUCKETS: readonly string[] = [20, 45, 120, 400, 900]
  .map((seconds) => dwellBucketLabel(seconds))
  .filter((bucket): bucket is string => Boolean(bucket));
