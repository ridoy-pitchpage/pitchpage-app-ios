import { Redirect, Stack } from "expo-router";

import { useRefreshCreditsOnReturn } from "@/api/queries";
import { useAuth } from "@/auth/AuthProvider";
import { Screen } from "@/components/Screen";
import { Loading } from "@/components/States";
import { RenderWarmup } from "@/render/RenderSurface";

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
  // Here rather than on the Credits screens: whichever screen somebody comes
  // back to from buying in Safari, the balance it shows has to be the new one.
  useRefreshCreditsOnReturn();

  if (loading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (!signedIn) return <Redirect href="/(public)/welcome" />;

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      {/* Pre-loads the website's renderer, so a page opens on its real template
          without a cold load. See RenderWarmup. */}
      <RenderWarmup />
    </>
  );
}
