import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { router } from "expo-router";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react-native";

import { Button } from "@/components/Button";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { GoogleSignInButton } from "@/auth/GoogleSignInButton";
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
  // Captured locally: TypeScript will not narrow an imported binding inside
  // the callback below.
  const devCreds = DEV_SIGN_IN;
  const [email, setEmail] = useState(DEV_SIGN_IN?.email ?? "");
  const [password, setPassword] = useState(DEV_SIGN_IN?.password ?? "");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

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
            eyebrow="Welcome back"
            title="Keep building your next opportunity."
            description="Sign in to edit your pages, see who viewed them, and share your best work."
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
              mode="signin"
              loading={googleBusy}
              onPress={() => void continueWithGoogle()}
            />

            <View className="flex-row items-center gap-3">
              <View className="h-px flex-1 bg-border" />
              <Muted className="text-[12px]">or use email</Muted>
              <View className="h-px flex-1 bg-border" />
            </View>

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
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              icon={<LockKeyhole size={19} color={colors.mutedForeground} />}
              value={password}
              onChangeText={setPassword}
              secure
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => void submit()}
            />

            <Pressable
              onPress={() => router.push("/(public)/forgot-password")}
              accessibilityRole="link"
              className="-my-1 self-end p-2"
            >
              <Muted style={{ color: colors.link }}>Forgot your password?</Muted>
            </Pressable>

            <Button
              title="Sign in"
              loading={busy}
              disabled={googleBusy}
              icon={<ArrowRight size={18} color={colors.primaryForeground} />}
              onPress={() => void submit()}
            />

            {devCreds ? (
              <Button
                title="Sign in as test user"
                variant="secondary"
                loading={busy}
                onPress={() => void submit(devCreds)}
              />
            ) : null}
          </View>

          <Pressable
            onPress={() => router.replace("/(public)/sign-up")}
            accessibilityRole="link"
            className="self-center p-2"
          >
            <Muted>
              New to PitchPage?{" "}
              <Muted style={{ color: colors.link }}>Create an account</Muted>
            </Muted>
          </Pressable>
        </ScreenScroll>
      </KeyboardAvoidingView>
    </Screen>
  );
}
