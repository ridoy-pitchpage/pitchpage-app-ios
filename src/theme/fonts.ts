import { useFonts } from "expo-font";
import {
  Sora_600SemiBold,
  Sora_700Bold,
} from "@expo-google-fonts/sora";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";

/**
 * Sora for headings, Manrope for body — the web app's pairing (§19). Only the
 * weights the design system actually uses are bundled; each extra weight is
 * about 40 KB in the app download.
 */
export function useAppFonts(): { loaded: boolean; error: Error | null } {
  const [loaded, error] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
  });

  // A font that fails to load is not worth blocking the app for: iOS falls back
  // to the system face and every screen still works.
  return { loaded: loaded || error != null, error: error ?? null };
}
