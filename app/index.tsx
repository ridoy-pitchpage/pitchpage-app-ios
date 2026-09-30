import { Redirect } from "expo-router";

import { useAuth } from "@/auth/AuthProvider";
import { Loading } from "@/components/States";
import { Screen } from "@/components/Screen";

/**
 * The boot decision (screen S01): signed in goes to Pages, everyone else meets
 * Welcome. The session read is already done by the time this renders in the
 * usual case, so this rarely paints.
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

  return <Redirect href={signedIn ? "/(app)/(tabs)/pages" : "/(public)/welcome"} />;
}
