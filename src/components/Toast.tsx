import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { userFacingErrorMessage } from "@/lib/errors";
import { useColors, useTheme } from "@/theme/ThemeProvider";
import { RADIUS, controlGradient, elevation } from "@/theme/tokens";

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

export function useToast(): ToastValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside <ToastProvider>");
  return value;
}

const VISIBLE_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const colors = useColors();
  const { resolved } = useTheme();
  const [toast, setToast] = useState<Toast | null>(null);
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

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <SafeAreaView
          edges={["bottom"]}
          pointerEvents="none"
          className="absolute inset-x-0 bottom-0 px-4 pb-2"
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
              elevation(colors.foreground, 3),
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
      ) : null}
    </ToastContext.Provider>
  );
}
