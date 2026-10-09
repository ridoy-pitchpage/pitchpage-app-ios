import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AccessibilityInfo, Keyboard, Platform, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { vars } from "nativewind";

import { userFacingErrorMessage } from "@/lib/errors";
import { useColors, useTheme } from "@/theme/ThemeProvider";
import { RADIUS, controlGradient, elevation, paletteVars } from "@/theme/tokens";

/**
 * Brief confirmations and failures, matching where the web app reaches for a
 * toast. Anything the user must act on gets a real screen or an alert instead.
 */

type Tone = "success" | "error";
type Toast = { id: number; message: string; tone: Tone };

type ToastValue = {
  success: (message: string) => void;
  /** Runs the error through the translator, so raw text can never reach a toast. */
  error: (error: unknown) => void;
};

const ToastContext = createContext<ToastValue | null>(null);

/**
 * Where the toast is drawn. A Modal covers everything drawn at the app's root,
 * so a toast raised inside a sheet ("Saved", a failed upload, a failed save)
 * was painted underneath it and never seen (2026-10-09). A sheet renders a
 * ToastHost; the newest active host draws the toast, and the root draws it
 * when there is none.
 *
 * Not react-native-screens' FullWindowOverlay, which would also draw above a
 * sheet: on mount it moves VoiceOver to whatever it holds, so every toast
 * would pull a VoiceOver user away from what they were doing, and the
 * announcement below already reads it out.
 */
type Hosts = {
  toast: Toast | null;
  /** The host drawing the toast; null for the root. */
  top: string | null;
  register: (host: string) => () => void;
};

const HostsContext = createContext<Hosts | null>(null);

export function useToast(): ToastValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside <ToastProvider>");
  return value;
}

const VISIBLE_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [hosts, setHosts] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const show = useCallback((message: string, tone: Tone) => {
    if (timer.current) clearTimeout(timer.current);
    nextId.current += 1;
    setToast({ id: nextId.current, message, tone });
    // A toast is off-screen for VoiceOver unless it is announced.
    AccessibilityInfo.announceForAccessibility(message);
    timer.current = setTimeout(() => setToast(null), VISIBLE_MS);
  }, []);

  const value = useMemo<ToastValue>(
    () => ({
      success: (message) => show(message, "success"),
      error: (error) => show(userFacingErrorMessage(error), "error"),
    }),
    [show],
  );

  const register = useCallback((host: string) => {
    setHosts((all) => [...all, host]);
    return () => setHosts((all) => all.filter((h) => h !== host));
  }, []);

  const top = hosts[hosts.length - 1] ?? null;
  // Separate from `value`, so a toast re-renders the hosts and not every
  // screen that can raise one.
  const drawing = useMemo<Hosts>(() => ({ toast, top, register }), [toast, top, register]);

  return (
    <ToastContext.Provider value={value}>
      <HostsContext.Provider value={drawing}>
        {children}
        {toast && top === null ? <ToastView toast={toast} /> : null}
      </HostsContext.Provider>
    </ToastContext.Provider>
  );
}

/** Draws the toast inside a Modal while `active`. Sheet renders one. */
export function ToastHost({ active }: { active: boolean }) {
  const hosts = useContext(HostsContext);
  const host = useId();
  const register = hosts?.register;

  useEffect(() => (register && active ? register(host) : undefined), [register, active, host]);

  if (!hosts?.toast || hosts.top !== host) return null;
  return <ToastView toast={hosts.toast} />;
}

/**
 * How far the keyboard reaches up the screen, on an iPhone. The keyboard is
 * drawn above the app there, so a toast at the bottom raised while typing (a
 * wrong password on sign-in, a failed save in a section) was hidden behind it.
 * Android resizes the window for the keyboard instead and needs nothing.
 */
function useKeyboardHeight(): number {
  const [height, setHeight] = useState(() =>
    Platform.OS === "ios" && Keyboard.isVisible() ? (Keyboard.metrics()?.height ?? 0) : 0,
  );

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const shown = Keyboard.addListener("keyboardWillShow", (event) => setHeight(event.endCoordinates.height));
    const hidden = Keyboard.addListener("keyboardWillHide", () => setHeight(0));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  return height;
}

function ToastView({ toast }: { toast: Toast }) {
  const colors = useColors();
  const { palette, resolved } = useTheme();
  const keyboard = useKeyboardHeight();

  return (
    <SafeAreaView
      // A raised keyboard already covers the home indicator.
      edges={keyboard > 0 ? [] : ["bottom"]}
      pointerEvents="none"
      style={[
        // A host in a Modal is outside the tree ThemeProvider set the palette
        // variables on, as Sheet explains, so they are set again here.
        vars(paletteVars(palette)),
        { bottom: keyboard },
      ]}
      className="absolute inset-x-0 px-4 pb-2"
    >
      {/*
        A toast is the one thing on screen that has to be read over
        whatever is behind it, so it is the most raised surface in the
        app — a gradient fill and a level-3 shadow. It stays opaque
        rather than glass for the same reason: a message you have to
        read must not take on the colour of the page under it.
      */}
      <LinearGradient
        colors={controlGradient(
          toast.tone === "error" ? colors.destructive : colors.foreground,
          resolved,
        )}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        accessibilityLiveRegion="polite"
        style={[
          { borderRadius: RADIUS.card, paddingHorizontal: 16, paddingVertical: 13 },
          elevation("#000000", 3),
        ]}
      >
        <Text
          className={[
            "font-body-medium text-[14px]",
            toast.tone === "error" ? "text-destructive-foreground" : "text-background",
          ].join(" ")}
        >
          {toast.message}
        </Text>
      </LinearGradient>
    </SafeAreaView>
  );
}
