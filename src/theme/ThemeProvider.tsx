import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme as useSystemColorScheme, View } from "react-native";
import { vars } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { appDark, appLight, paletteVars, site, type Palette } from "./tokens";

export type Appearance = "system" | "light" | "dark";
export type Surface = "app" | "site";

/**
 * The same key the web app stores the choice under, so the two stay legible to
 * each other even though they do not share storage.
 */
const STORAGE_KEY = "pp-appearance";

type ThemeValue = {
  /** What the user picked. */
  appearance: Appearance;
  /** What that resolves to right now, once the system setting is folded in. */
  resolved: "light" | "dark";
  palette: Palette;
  setAppearance: (next: Appearance) => void;
  /** True until the stored choice has been read, so nothing flashes. */
  loading: boolean;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside <ThemeProvider>");
  return value;
}

/** Palette values as plain strings, for the places RN needs a colour prop. */
export function useColors(): Palette {
  return useTheme().palette;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useSystemColorScheme();
  const [appearance, setAppearanceState] = useState<Appearance>("system");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (stored === "light" || stored === "dark" || stored === "system") {
          setAppearanceState(stored);
        }
      })
      // Storage can be unavailable; the OS setting is a fine answer on its own.
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const resolved: "light" | "dark" =
      appearance === "system" ? (system === "dark" ? "dark" : "light") : appearance;
    return {
      appearance,
      resolved,
      palette: resolved === "dark" ? appDark : appLight,
      loading,
      setAppearance: (next) => {
        setAppearanceState(next);
        void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
      },
    };
  }, [appearance, system, loading]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, vars(paletteVars(value.palette))]} className="bg-background">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

/** Keep the public palette and JS color values in sync in either appearance. */
export function SiteSurface({ children }: { children: ReactNode }) {
  const parent = useTheme();
  const palette = parent.resolved === "dark" ? appDark : site;
  const value = useMemo<ThemeValue>(() => ({ ...parent, palette }), [parent, palette]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, vars(paletteVars(palette))]} className="bg-background">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

/** The palette a given surface wears, for code outside the React tree. */
export function paletteFor(surface: Surface, resolved: "light" | "dark"): Palette {
  if (surface === "site") return resolved === "dark" ? appDark : site;
  return resolved === "dark" ? appDark : appLight;
}
