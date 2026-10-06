import { Platform } from "react-native";
import { File } from "expo-file-system";

/**
 * Reading a file the picker just handed back, on both platforms.
 *
 * expo-file-system's `File` is native-only. On web it throws
 * "this.validatePath is not a function" — a picker in a browser returns a
 * `blob:` URL rather than a path, and there is no filesystem behind it to
 * validate against. Every size check and the upload itself went through
 * `new File(uri)`, so choosing any photo in the browser build failed before
 * it started.
 *
 * On web the browser answers both questions through fetch. That holds the
 * bytes in memory twice, which is why native keeps using `File`: a 50 MB
 * video on a phone should not be copied to be measured. It is also why the
 * upload does not simply fetch everywhere — a blob read from a file URI comes
 * back empty on some Android builds.
 */

export async function fileSize(uri: string): Promise<number> {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  }
  return new File(uri).size ?? 0;
}

export async function fileBytes(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    return await response.arrayBuffer();
  }
  return await new File(uri).arrayBuffer();
}
