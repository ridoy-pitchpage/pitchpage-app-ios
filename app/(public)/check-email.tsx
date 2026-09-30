import { router } from "expo-router";

import { Button } from "@/components/Button";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1 } from "@/components/Text";

/**
 * Check your email (S17). Only reached when email confirmation is switched on
 * for the Supabase project, which it is not today — so in practice signing up
 * goes straight to Pages and this screen is a safety net.
 */
export default function CheckEmail() {
  return (
    <Screen>
      <ScreenScroll contentClassName="pt-16 gap-4">
        <H1>Check your email</H1>
        <Body className="text-muted-foreground">
          We've sent you a link to confirm your address. Open it, then come back
          and sign in.
        </Body>
        <Button
          title="Back to sign in"
          variant="secondary"
          onPress={() => router.replace("/(public)/sign-in")}
        />
      </ScreenScroll>
    </Screen>
  );
}
