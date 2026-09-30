import { Redirect } from "expo-router";

import { useAuth } from "@/auth/AuthProvider";
import { Loading } from "@/components/States";
import { Screen } from "@/components/Screen";

/**
 * The boot decision (screen S01): signed in goes to Pages, everyone else meets
 * Welcome. The session read is already done by the time this renders in the
 * usual case, so this rarely paints.
 *
 * Development starts at Sign in instead. Welcome is what a new customer must
 * see first, but it is in the way when the thing being worked on is behind a
 * session; Sign in keeps Welcome one back-tap away. Release builds are
 * untouched.
 */
export default function Index() {
  const { loading, signedIn } = useAuth();

  if (loading) {
    return (
      <Screen>
        <Loading label="Getting your pages…" />
      </Screen>
    );
  }

  if (signedIn) return <Redirect href="/(app)/(tabs)/pages" />;
  return <Redirect href={__DEV__ ? "/(public)/sign-in" : "/(public)/welcome"} />;
}
