// Gesture handler requires this side-effect import to be the first thing the
// entry file runs, before any component imports it for its own exports —
// so it stays separate rather than merged with the named import below.
// eslint-disable-next-line import/no-duplicates
import "react-native-gesture-handler";
import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
// eslint-disable-next-line import/no-duplicates
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";

import { AuthProvider } from "@/auth/AuthProvider";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { useAppFonts } from "@/theme/fonts";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A phone loses its connection constantly; one quiet retry covers a
      // tunnel or a lift without making a real failure take four times as long.
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <AppShell />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const { resolved, loading: themeLoading } = useTheme();
  const { loaded: fontsLoaded } = useAppFonts();

  useEffect(() => {
    // Hold the splash until the fonts and the stored appearance are in, so the
    // first frame is never cream-on-dark or a fallback typeface.
    if (fontsLoaded && !themeLoading) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, themeLoading]);

  if (!fontsLoaded || themeLoading) return null;

  return (
    <>
      <StatusBar style={resolved === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}
