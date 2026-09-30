import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { router } from "expo-router";

import { Button } from "@/components/Button";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { H1, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { credentialProblem, signInWithPassword } from "@/auth/auth-actions";
import { DEV_SIGN_IN } from "@/lib/config";

/**
 * Sign in (S15). Email and password go straight to Supabase, so this works
 * against the live accounts with no backend change.
 *
 * Continue with Apple and Continue with Google are not here yet: both currently
 * run through Lovable's OAuth broker on the web, and spike S1 decides whether
 * the app gets a native sheet or the bridge (§12).
 *
 * In development the fields arrive filled from EXPO_PUBLIC_DEV_EMAIL and
 * EXPO_PUBLIC_DEV_PASSWORD with a one-tap button beside them. It is the same
 * sign-in every other account goes through — a real session against the real
 * backend — just without the retyping.
 */
export default function SignIn() {
  const toast = useToast();
  // Captured locally: TypeScript will not narrow an imported binding inside
  // the callback below.
  const devCreds = DEV_SIGN_IN;
  const [email, setEmail] = useState(DEV_SIGN_IN?.email ?? "");
  const [password, setPassword] = useState(DEV_SIGN_IN?.password ?? "");
  const [busy, setBusy] = useState(false);

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

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScreenScroll contentClassName="pt-4 gap-5">
          <BackButton
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/(public)/welcome")
            }
          />

          <H1>Welcome back</H1>

          <View className="gap-4">
            <TextField
              label="Email"
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
              value={password}
              onChangeText={setPassword}
              secure
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => void submit()}
            />
          </View>

          <Button title="Sign in" loading={busy} onPress={() => void submit()} />

          {devCreds ? (
            <Button
              title="Sign in as test user"
              variant="secondary"
              loading={busy}
              onPress={() => void submit(devCreds)}
            />
          ) : null}

          <Pressable
            onPress={() => router.push("/(public)/forgot-password")}
            accessibilityRole="link"
            className="self-center p-2"
          >
            <Muted className="text-link">Forgot your password?</Muted>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(public)/sign-up")}
            accessibilityRole="link"
            className="self-center p-2"
          >
            <Muted>
              No account yet? <Muted className="text-link">Create one</Muted>
            </Muted>
          </Pressable>
        </ScreenScroll>
      </KeyboardAvoidingView>
    </Screen>
  );
}
