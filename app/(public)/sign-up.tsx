import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View, type TextInput } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react-native";

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
import { credentialProblem, signInWithApple, signInWithProvider, signUpWithPassword } from "@/auth/auth-actions";
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
  const emailInput = useRef<TextInput>(null);
  const passwordInput = useRef<TextInput>(null);
  // Captured locally: TypeScript will not narrow an imported binding.
  const devCreds = DEV_SIGN_IN;
  const [name, setName] = useState(devCreds ? "Test Account" : "");
  const [email, setEmail] = useState(devCreds?.email ?? "");
  const [password, setPassword] = useState(devCreds?.password ?? "");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);

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

  async function continueWithApple() {
    setAppleBusy(true);
    try {
      const completed = await signInWithApple();
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
            eyebrow="A space for your story"
            title="Your story starts here."
            description="Create your account. Turn what you've done into something worth sharing."
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
                      mode="signup"
                      busy={busy || appleBusy || googleBusy}
                      onPress={() => void continueWithApple()}
                    />
                  ) : null}
                  {OFFER_GOOGLE_SIGN_IN ? (
                    <GoogleSignInButton
                      mode="signup"
                      loading={googleBusy}
                      onPress={() => void continueWithGoogle()}
                    />
                  ) : null}
                </View>

                <View className="flex-row items-center gap-3">
                  <View className="h-px flex-1 bg-border" />
                  <Muted className="text-[12px]">or create with email</Muted>
                  <View className="h-px flex-1 bg-border" />
                </View>
              </>
            ) : null}

            <Card flat className="gap-4 p-5">
              <TextField
                label="Your name"
                icon={<UserRound size={19} color={colors.mutedForeground} />}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                placeholder="Alex Chen"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => emailInput.current?.focus()}
                editable={!busy && !googleBusy && !appleBusy}
              />
              <TextField
                label="Email"
                inputRef={emailInput}
                icon={<Mail size={19} color={colors.mutedForeground} />}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="username"
                placeholder="you@example.com"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordInput.current?.focus()}
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
                autoComplete="new-password"
                textContentType="newPassword"
                hint="At least 6 characters."
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
                editable={!busy && !googleBusy && !appleBusy}
              />
            </Card>
          </MotionEntrance>

          <View className="gap-0.5">
            <Muted className="text-center">By creating an account, you agree to our</Muted>
            <View className="flex-row flex-wrap items-center justify-center gap-x-5">
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Read the Terms of Service"
                style={{ minHeight: 44 }}
                className="items-center justify-center px-2"
                onPress={() => void WebBrowser.openBrowserAsync(WEB_LINKS.terms)}
              >
                <Muted className="font-body-bold" style={{ color: colors.link }}>Terms of Service</Muted>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Read the Privacy Policy"
                style={{ minHeight: 44 }}
                className="items-center justify-center px-2"
                onPress={() => void WebBrowser.openBrowserAsync(WEB_LINKS.privacy)}
              >
                <Muted className="font-body-bold" style={{ color: colors.link }}>Privacy Policy</Muted>
              </Pressable>
            </View>
          </View>
        </ScreenScroll>

        {/*
          Pinned rather than last in the scroll. The introduction and three
          fields are taller than a phone, so with the keyboard up the button
          that finishes the job sat below the fold — the one thing on the
          screen that must never need looking for.
        */}
        <ActionBar>
          <Button
            title="Create account"
            loading={busy}
            disabled={googleBusy || appleBusy}
            icon={<ArrowRight size={18} color={colors.primaryForeground} />}
            onPress={() => void submit()}
          />
          <Pressable
            onPress={() => router.replace("/(public)/sign-in")}
            accessibilityRole="link"
            accessibilityLabel="Already have an account? Sign in"
            style={{ minHeight: 44 }}
            className="mt-1 items-center justify-center px-2"
          >
            <Muted className="text-center">
              Already have an account?{" "}
              <Muted className="font-body-bold" style={{ color: colors.link }}>Sign in</Muted>
            </Muted>
          </Pressable>
        </ActionBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
