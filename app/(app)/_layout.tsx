import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/auth/AuthProvider";
import { Screen } from "@/components/Screen";
import { Loading } from "@/components/States";

/**
 * The signed-in guard, matching the web's `_authenticated` route: no session
 * means back to Welcome.
 *
 * Every screen below this is server-guarded too. RLS and the SECURITY DEFINER
 * RPCs decide what the account may actually read or write, so this redirect is
 * about not showing an empty shell, never about access.
 */
export default function AppLayout() {
  const { loading, signedIn } = useAuth();

  if (loading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (!signedIn) return <Redirect href="/(public)/welcome" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
