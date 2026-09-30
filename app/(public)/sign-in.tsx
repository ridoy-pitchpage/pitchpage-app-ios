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

/**
 * Sign in (S15). Email and password go straight to Supabase, so this works
 * against the live accounts with no backend change.
 *
 * Continue with Apple and Continue with Google are not here yet: both currently
 * run through Lovable's OAuth broker on the web, and spike S1 decides whether
 * the app gets a native sheet or the bridge (§12).
 */
export default function SignIn() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const creds = { email, password };
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
          <BackButton />

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
