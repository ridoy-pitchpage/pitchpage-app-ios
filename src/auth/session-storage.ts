import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Where the Supabase session lives.
 *
 * On a device it goes in the iOS Keychain through expo-secure-store, so the
 * refresh token is encrypted at rest and never readable by another app.
 * SecureStore warns above 2048 bytes and a Supabase session comfortably exceeds
 * that once the access token carries claims, so values are split into chunks
 * and a small index entry records how many there are.
 *
 * On web (the Windows browser preview) there is no Keychain, so it falls back
 * to AsyncStorage, which is localStorage there — the same place the website
 * keeps its own session.
 */

const CHUNK_SIZE = 1536;
const useSecureStore = Platform.OS !== "web";

function chunkKey(key: string, index: number): string {
  return `${key}__c${index}`;
}

async function readChunked(key: string): Promise<string | null> {
  const head = await SecureStore.getItemAsync(key);
  if (head == null) return null;

  // A plain value that was small enough not to need splitting.
  if (!head.startsWith("__chunks:")) return head;

  const count = Number.parseInt(head.slice("__chunks:".length), 10);
  if (!Number.isFinite(count) || count <= 0) return null;

  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const part = await SecureStore.getItemAsync(chunkKey(key, i));
    // A missing chunk means a half-written session; treat the whole thing as
    // absent so the user signs in again rather than hitting a parse error.
    if (part == null) return null;
    parts.push(part);
  }
  return parts.join("");
}

async function clearChunks(key: string): Promise<void> {
  const head = await SecureStore.getItemAsync(key);
  if (head?.startsWith("__chunks:")) {
    const count = Number.parseInt(head.slice("__chunks:".length), 10);
    for (let i = 0; i < count; i += 1) {
      await SecureStore.deleteItemAsync(chunkKey(key, i));
    }
  }
}

async function writeChunked(key: string, value: string): Promise<void> {
  await clearChunks(key);

  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const count = Math.ceil(value.length / CHUNK_SIZE);
  for (let i = 0; i < count; i += 1) {
    await SecureStore.setItemAsync(chunkKey(key, i), value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
  }
  // The index goes last, so an interrupted write never points at chunks that
  // were not stored.
  await SecureStore.setItemAsync(key, `__chunks:${count}`);
}

/**
 * Every method swallows its errors. Storage can be unavailable (a locked
 * device, a private browsing context), and the right outcome there is a signed
 * -out app rather than a crash on boot.
 */
export const sessionStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return useSecureStore ? await readChunked(key) : await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (useSecureStore) await writeChunked(key, value);
      else await AsyncStorage.setItem(key, value);
    } catch {
      // Ignored: the session simply will not survive a restart.
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (useSecureStore) {
        await clearChunks(key);
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch {
      // Ignored.
    }
  },
};
