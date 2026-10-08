import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View, type TextInput } from "react-native";
import { router } from "expo-router";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react-native";

import { ActionBar } from "@/components/ActionBar";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { MotionEntrance } from "@/components/MotionEntrance";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { AppleSignInButton } from "@/auth/AppleSignInButton";
import { GoogleSignInButton } from "@/auth/GoogleSignInButton";
import { OFFER_APPLE_SIGN_IN, OFFER_GOOGLE_SIGN_IN } from "@/auth/sign-in-options";
import { credentialProblem, signInWithPassword, signInWithProvider } from "@/auth/auth-actions";
import { AuthIntro } from "@/auth/AuthIntro";
import { DEV_SIGN_IN } from "@/lib/config";
import { useColors } from "@/theme/ThemeProvider";

/**
 * Sign in (S15). Email and password go straight to Supabase, so this works
 * against the live accounts with no backend change.
 *
 * Google opens in iOS's secure authentication sheet and hands the resulting
 * Supabase session back to the app. The provider's allowed redirect URIs still
 * have to include this project's Supabase callback before a live login works.
 *
 * In development the fields arrive filled from EXPO_PUBLIC_DEV_EMAIL and
 * EXPO_PUBLIC_DEV_PASSWORD with a one-tap button beside them. It is the same
 * sign-in every other account goes through — a real session against the real
 * backend — just without the retyping.
 */
export default function SignIn() {
  const toast = useToast();
  const colors = useColors();
  const passwordInput = useRef<TextInput>(null);
  // Captured locally: TypeScript will not narrow an imported binding inside
  // the callback below.
  const devCreds = DEV_SIGN_IN;
  const [email, setEmail] = useState(DEV_SIGN_IN?.email ?? "");
  const [password, setPassword] = useState(DEV_SIGN_IN?.password ?? "");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);

  async function submit(creds: { email: string; password: string } = { email, password }) {
    const problem = credentialProblem(creds, "signin");
    if (problem) {
      toast.error(new Error(problem));
      return;
    }

    setBusy(true);
    try {
      await signInWithPassword(creds);
      // The root layout sees the session change and swaps the stack over.
      router.replace("/(app)/(tabs)/pages");
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
    }
  }

  async function continueWithApple() {
    setAppleBusy(true);
    try {
      const completed = await signInWithProvider("apple");
      if (completed) router.replace("/(app)/(tabs)/pages");
    } catch (error) {
      toast.error(error);
    } finally {
      setAppleBusy(false);
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
        <ScreenScroll contentClassName="pt-2 gap-5" keyboardDismissMode="interactive">
          <AuthIntro
            eyebrow="Your personal workspace"
            title="Welcome back."
            description="Pick up where you left off. Your story is waiting."
            onBack={() =>
              router.canGoBack() ? router.back() : router.replace("/(public)/welcome")
            }
          />

          <MotionEntrance index={1} className="gap-5">
            {OFFER_APPLE_SIGN_IN || OFFER_GOOGLE_SIGN_IN ? (
              <>
                <View className="gap-3" pointerEvents={busy || googleBusy || appleBusy ? "none" : "auto"}>
                  {/* Above Google, not below: guideline 4.8 wants an equivalent option,
                      and Apple's own guidance that it be no less prominent. */}
                  {OFFER_APPLE_SIGN_IN ? (
                    <AppleSignInButton
                      mode="signin"
                      busy={busy || appleBusy || googleBusy}
                      onPress={() => void continueWithApple()}
                    />
                  ) : null}
                  {OFFER_GOOGLE_SIGN_IN ? (
                    <GoogleSignInButton
                      mode="signin"
                      loading={googleBusy}
                      onPress={() => void continueWithGoogle()}
                    />
                  ) : null}
                </View>

                <View className="flex-row items-center gap-3">
                  <View className="h-px flex-1 bg-border" />
                  <Muted className="text-[12px]">or sign in with email</Muted>
                  <View className="h-px flex-1 bg-border" />
                </View>
              </>
            ) : null}

            <Card flat className="gap-4 p-5">
              <TextField
                label="Email"
                icon={<Mail size={19} color={colors.mutedForeground} />}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="username"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordInput.current?.focus()}
                placeholder="you@example.com"
                editable={!busy && !googleBusy && !appleBusy}
              />
              <TextField
                label="Password"
                inputRef={passwordInput}
                icon={<LockKeyhole size={19} color={colors.mutedForeground} />}
                value={password}
                onChangeText={setPassword}
                secure
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
                editable={!busy && !googleBusy && !appleBusy}
              />

              <Pressable
                onPress={() => router.push("/(public)/forgot-password")}
                accessibilityRole="link"
                accessibilityLabel="Reset your password"
                style={{ minHeight: 44 }}
                className="-my-1 self-end items-center justify-center px-1"
              >
                <Muted style={{ color: colors.link }}>Forgot your password?</Muted>
              </Pressable>

              {devCreds ? (
                <Button
                  title="Sign in as test user"
                  variant="secondary"
                  loading={busy}
                  onPress={() => void submit(devCreds)}
                />
              ) : null}
            </Card>
          </MotionEntrance>
        </ScreenScroll>

        <ActionBar>
          <Button
            title="Sign in"
            loading={busy}
            disabled={googleBusy || appleBusy}
            icon={<ArrowRight size={18} color={colors.primaryForeground} />}
            onPress={() => void submit()}
          />
          <Pressable
            onPress={() => router.replace("/(public)/sign-up")}
            accessibilityRole="link"
            accessibilityLabel="New to PitchPage? Create an account"
            style={{ minHeight: 44 }}
            className="mt-1 items-center justify-center px-2"
          >
            <Muted className="text-center">
              New to PitchPage?{" "}
              <Muted className="font-body-bold" style={{ color: colors.link }}>Create an account</Muted>
            </Muted>
          </Pressable>
        </ActionBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
