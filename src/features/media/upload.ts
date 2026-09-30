import { File } from "expo-file-system";

import { supabase } from "@/auth/supabase";

/**
 * Putting media on a page.
 *
 * This goes straight to Supabase Storage rather than through a server
 * function, because the bucket policies already allow a signed-in user to write
 * inside a folder named after their own id — which is exactly where their media
 * belongs. The path convention below is the website's, copied precisely, so a
 * file uploaded from the phone lands where the published page looks for it.
 */

export type MediaKind = "portrait" | "video" | "skyline" | "gallery" | "film" | "resume";

const BUCKETS: Record<MediaKind, { bucket: string; suffix: string; public: boolean }> = {
  video: { bucket: "pitch-videos", suffix: "", public: true },
  portrait: { bucket: "portraits", suffix: "-portrait", public: true },
  // The city image shares the portraits bucket with its own suffix, so
  // replacing one never deletes the other.
  skyline: { bucket: "portraits", suffix: "-skyline", public: true },
  gallery: { bucket: "portraits", suffix: "-gallery", public: true },
  film: { bucket: "pitch-videos", suffix: "-film", public: true },
  // Private. The stored value is a public-format URL that 403s on its own; the
  // website re-signs it at read time, so no durable private link is ever saved.
  resume: { bucket: "resumes", suffix: "-resume", public: false },
};

/** Kinds where a page holds exactly one, so the previous file can be removed. */
const SINGLE_FILE_KINDS: ReadonlySet<MediaKind> = new Set(["portrait", "video", "skyline", "resume"]);

function randomSegment(): string {
  const cryptoRef = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (typeof cryptoRef?.randomUUID === "function") return cryptoRef.randomUUID().slice(0, 8);
  return Math.random().toString(36).slice(2, 10);
}

export type UploadResult = { url: string; path: string; bucket: string };

/**
 * Upload one file and return the URL to store on the page.
 *
 * The random path segment is deliberate and copied from the website: these
 * buckets are public so that a published page's social image URL stays stable,
 * which means an unpublished draft's media is protected by being unguessable
 * rather than by being signed.
 */
export async function uploadMedia({
  kind,
  pageId,
  uri,
  ext,
  contentType,
  replaces,
}: {
  kind: MediaKind;
  pageId: string;
  /** A local file:// URI from the camera, library or document picker. */
  uri: string;
  ext: string;
  contentType: string;
  /** The URL currently on the page, so the file it points at can be cleaned up. */
  replaces?: string | null;
}): Promise<UploadResult> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Unauthorized: no session");

  const { bucket, suffix } = BUCKETS[kind];
  const path = `${userId}/${pageId}${suffix}-${randomSegment()}.${ext.toLowerCase()}`;

  // Reading as an ArrayBuffer rather than a fetch(uri).blob(): a blob from a
  // file URI arrives empty on some Android builds, and a large video would be
  // held twice in memory.
  const file = new File(uri);
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (error) throw error;

  const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

  if (SINGLE_FILE_KINDS.has(kind) && replaces) {
    await removeIfOwned(bucket, replaces, userId, path);
  }

  // The cache-buster is what makes a replaced portrait actually change on
  // screen: the path is new, but any layer holding the old URL would not know.
  return { url: `${url}?v=${Date.now()}`, path, bucket };
}

/**
 * Best-effort removal of a file this page used to point at.
 *
 * Guarded by the owner prefix as well as by the storage policy: a stored URL is
 * data, and one that had been tampered with must not be able to name somebody
 * else's object. A failure here is never surfaced — the upload succeeded, and
 * an orphaned file is not the user's problem.
 */
async function removeIfOwned(
  bucket: string,
  previousUrl: string,
  userId: string,
  justWritten: string,
): Promise<void> {
  try {
    const marker = `/object/public/${bucket}/`;
    const index = previousUrl.indexOf(marker);
    if (index === -1) return;

    const oldPath = decodeURIComponent(previousUrl.slice(index + marker.length).split("?")[0] ?? "");
    if (!oldPath.startsWith(`${userId}/`) || oldPath === justWritten) return;

    await supabase.storage.from(bucket).remove([oldPath]);
  } catch {
    // Ignored on purpose.
  }
}

/** Remove media a user has explicitly deleted, e.g. a gallery image. */
export async function removeMedia(kind: MediaKind, urls: string[]): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { bucket } = BUCKETS[kind];
  const marker = `/object/public/${bucket}/`;

  const paths = urls
    .map((url) => {
      const index = url.indexOf(marker);
      if (index === -1) return null;
      return decodeURIComponent(url.slice(index + marker.length).split("?")[0] ?? "");
    })
    .filter((path): path is string => Boolean(path) && path!.startsWith(`${userId}/`));

  if (paths.length === 0) return;
  await supabase.storage.from(bucket).remove(paths);
}

/** The limits the website enforces, so the app can say no before uploading. */
export const MEDIA_LIMITS = {
  /** Bucket limit for pitch-videos. */
  videoBytes: 50 * 1024 * 1024,
  imageBytes: 15 * 1024 * 1024,
  documentBytes: 8 * 1024 * 1024,
  /** What the recorder allows, matching the web. */
  videoSeconds: 120,
} as const;

export function tooLargeMessage(kind: "video" | "image" | "document"): string {
  const mb =
    kind === "video" ? 50 : kind === "image" ? 15 : 8;
  return `That file is over ${mb}MB. Try a smaller one.`;
}
