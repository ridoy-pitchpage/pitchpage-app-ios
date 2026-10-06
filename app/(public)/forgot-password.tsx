import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { router } from "expo-router";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react-native";

import { ActionBar } from "@/components/ActionBar";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { MotionEntrance } from "@/components/MotionEntrance";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H3, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { AuthIntro } from "@/auth/AuthIntro";
import { sendPasswordReset } from "@/auth/auth-actions";
import { useColors } from "@/theme/ThemeProvider";

/** Forgot password (S18). The reset link itself is handled on the website (§12). */
export default function ForgotPassword() {
  const toast = useToast();
  const colors = useColors();
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
        <ScreenScroll contentClassName="pt-2 gap-5" keyboardDismissMode="interactive">
          <AuthIntro
            eyebrow="A fresh start"
            title={sent ? "Check your inbox." : "Forgot your password?"}
            description={sent
              ? "One small step and you'll be back to your story."
              : "It happens. We'll help you get back to your pages."}
            onBack={() => router.canGoBack() ? router.back() : router.replace("/(public)/sign-in")}
          />

          <MotionEntrance index={1}>
            <Card flat className="gap-5 p-5">
              <View
                className="h-12 w-12 items-center justify-center rounded-2xl bg-muted"
                accessibilityElementsHidden
              >
                {sent
                  ? <CheckCircle2 size={25} color={colors.link} strokeWidth={1.7} />
                  : <Mail size={25} color={colors.link} strokeWidth={1.7} />}
              </View>
              {sent ? (
                <View className="gap-3" accessibilityLiveRegion="polite">
                  <H3>Your reset link is on its way</H3>
                  <Body style={{ color: colors.mutedForeground }}>
                    If there's an account for {email.trim()}, we've sent it a reset
                    link. Open it to choose a new password, then sign in here.
                  </Body>
                  <Muted>Can't see it? Check your spam or junk folder.</Muted>
                  <Pressable
                    onPress={() => setSent(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Use a different email address"
                    style={{ minHeight: 44 }}
                    className="self-start justify-center py-2"
                  >
                    <Muted className="font-body-bold" style={{ color: colors.link }}>
                      Use a different email
                    </Muted>
                  </Pressable>
                </View>
              ) : (
                <View className="gap-4">
                  <Muted>We'll email you a secure link to choose a new password.</Muted>
                  <TextField
                    label="Email"
                    icon={<Mail size={19} color={colors.mutedForeground} />}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    returnKeyType="go"
                    onSubmitEditing={() => void submit()}
                    placeholder="you@example.com"
                    editable={!busy}
                  />
                </View>
              )}
            </Card>
          </MotionEntrance>
        </ScreenScroll>

        <ActionBar>
          <Button
            title={sent ? "Back to sign in" : "Send reset link"}
            loading={busy}
            icon={<ArrowRight size={18} color={colors.primaryForeground} />}
            onPress={() => sent ? router.replace("/(public)/sign-in") : void submit()}
          />
        </ActionBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
