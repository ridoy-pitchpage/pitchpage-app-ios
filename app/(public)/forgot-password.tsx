import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { Button } from "@/components/Button";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1 } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { sendPasswordReset } from "@/auth/auth-actions";
import { useColors } from "@/theme/ThemeProvider";

/** Forgot password (S18). The reset link itself is handled on the website (§12). */
export default function ForgotPassword() {
  const colors = useColors();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!email.trim()) {
      toast.error(new Error("Enter your email."));
      return;
    }
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScreenScroll contentClassName="pt-4 gap-5">
          <BackButton />

          <H1>Reset your password</H1>

          {sent ? (
            <>
              <Body className="text-muted-foreground">
                If there's an account for {email.trim()}, we've sent it a reset
                link. Open it to choose a new password, then sign in here.
              </Body>
              <Button
                title="Back to sign in"
                variant="secondary"
                onPress={() => router.replace("/(public)/sign-in")}
              />
            </>
          ) : (
            <>
              <Body className="text-muted-foreground">
                Enter your email and we'll send you a link to set a new password.
              </Body>
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
                placeholder="you@example.com"
              />
              <Button title="Send reset link" loading={busy} onPress={() => void submit()} />
            </>
          )}
        </ScreenScroll>
      </KeyboardAvoidingView>
    </Screen>
  );
}
