import { useEffect, useState } from "react";
import { Redirect } from "expo-router";

import { useAuth } from "@/auth/AuthProvider";
import { Loading } from "@/components/States";
import { Screen } from "@/components/Screen";
import { hasCompletedOnboarding } from "@/onboarding/storage";

/**
 * The boot decision (screen S01): signed in goes to Pages, a first launch sees
 * the four-step introduction, and a returning signed-out visitor meets Welcome.
 * The session read is already done by the time this renders in the usual case,
 * so this rarely paints.
 *
 * Development always starts at the introduction, whatever is stored. The
 * "already seen it" flag makes the screen being worked on unreachable after
 * the first run, and clearing the app's storage to look at it again is not a
 * workflow. Sign in is one tap away from there. Release builds are untouched.
 */
export default function Index() {
  const { loading, signedIn } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void hasCompletedOnboarding().then((complete) => {
      if (active) setOnboardingComplete(complete);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <Screen>
        <Loading label="Opening PitchPage…" />
      </Screen>
    );
  }

  if (signedIn) return <Redirect href="/(app)/(tabs)/pages" />;

  if (__DEV__) return <Redirect href="/(public)/onboarding" />;

  if (onboardingComplete == null) {
    return (
      <Screen>
        <Loading label="Opening PitchPage…" />
      </Screen>
    );
  }

  if (!onboardingComplete) return <Redirect href="/(public)/onboarding" />;
  return <Redirect href="/(public)/welcome" />;
}
