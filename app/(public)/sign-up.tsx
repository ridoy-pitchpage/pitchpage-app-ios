import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react-native";

import { Button } from "@/components/Button";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { GoogleSignInButton } from "@/auth/GoogleSignInButton";
import { credentialProblem, signInWithProvider, signUpWithPassword } from "@/auth/auth-actions";
import { AuthIntro } from "@/auth/AuthIntro";
import { DEV_SIGN_IN, WEB_LINKS } from "@/lib/config";
import { useColors } from "@/theme/ThemeProvider";

/**
 * Create account (S16). Same rules as the website, including the 6-character
 * floor.
 *
 * In development the form arrives filled from .env, so the throwaway account
 * the prefilled Sign in screen expects can be made in one tap. Creating it is
 * still an ordinary sign-up against the real backend — the same rules, the
 * same confirmation mail, the same row in the same table.
 */
export default function SignUp() {
  const toast = useToast();
  const colors = useColors();
  // Captured locally: TypeScript will not narrow an imported binding.
  const devCreds = DEV_SIGN_IN;
  const [name, setName] = useState(devCreds ? "Test Account" : "");
  const [email, setEmail] = useState(devCreds?.email ?? "");
  const [password, setPassword] = useState(devCreds?.password ?? "");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function submit() {
    if (!name.trim()) {
      toast.error(new Error("Enter your name."));
      return;
    }
    const creds = { email, password };
    const problem = credentialProblem(creds, "signup");
    if (problem) {
      toast.error(new Error(problem));
      return;
    }

    setBusy(true);
    try {
      const { needsEmailConfirmation } = await signUpWithPassword(creds, name);
      if (needsEmailConfirmation) {
        router.replace("/(public)/check-email");
        return;
      }
      router.replace("/(app)/(tabs)/pages");
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
    }
  }

  async function continueWithGoogle() {
    setGoogleBusy(true);
    try {
      const completed = await signInWithProvider("google");
      if (completed) router.replace("/(app)/(tabs)/pages");
    } catch (error) {
      toast.error(error);
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScreenScroll contentClassName="pt-3 gap-5">
          <AuthIntro
            eyebrow="Start creating"
            title="Put your story to work."
            description="Create a free account and turn your experience into a page people remember."
            onBack={() =>
              router.canGoBack() ? router.back() : router.replace("/(public)/welcome")
            }
          />

          <View
            className="gap-4 rounded-card border border-border bg-card p-4"
            style={{
              shadowColor: colors.foreground,
              shadowOpacity: 0.08,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
            }}
          >
            <GoogleSignInButton
              mode="signup"
              loading={googleBusy}
              onPress={() => void continueWithGoogle()}
            />

            <View className="flex-row items-center gap-3">
              <View className="h-px flex-1 bg-border" />
              <Muted className="text-[12px]">or use email</Muted>
              <View className="h-px flex-1 bg-border" />
            </View>

            <TextField
              label="Your name"
              icon={<UserRound size={19} color={colors.mutedForeground} />}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              placeholder="Alex Chen"
            />
            <TextField
              label="Email"
              icon={<Mail size={19} color={colors.mutedForeground} />}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="username"
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              icon={<LockKeyhole size={19} color={colors.mutedForeground} />}
              value={password}
              onChangeText={setPassword}
              secure
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              hint="At least 6 characters."
              returnKeyType="go"
              onSubmitEditing={() => void submit()}
            />
          </View>

          <Muted className="text-center">
            By creating an account you agree to our{" "}
            <Muted
              style={{ color: colors.link }}
              accessibilityRole="link"
              onPress={() => void WebBrowser.openBrowserAsync(WEB_LINKS.terms)}
            >
              Terms
            </Muted>{" "}
            and{" "}
            <Muted
              style={{ color: colors.link }}
              accessibilityRole="link"
              onPress={() => void WebBrowser.openBrowserAsync(WEB_LINKS.privacy)}
            >
              Privacy Policy
            </Muted>
            .
          </Muted>

          <Pressable
            onPress={() => router.replace("/(public)/sign-in")}
            accessibilityRole="link"
            className="self-center p-2"
          >
            <Muted>
              Already have an account?{" "}
              <Muted style={{ color: colors.link }}>Sign in</Muted>
            </Muted>
          </Pressable>
        </ScreenScroll>

        {/*
          Pinned rather than last in the scroll. The introduction and three
          fields are taller than a phone, so with the keyboard up the button
          that finishes the job sat below the fold — the one thing on the
          screen that must never need looking for.
        */}
        <View className="border-t border-border bg-card px-4 pb-2 pt-3">
          <Button
            title="Create account"
            loading={busy}
            disabled={googleBusy}
            icon={<ArrowRight size={18} color={colors.primaryForeground} />}
            onPress={() => void submit()}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
