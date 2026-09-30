import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";

import { Button } from "@/components/Button";
import { Screen, ScreenScroll } from "@/components/Screen";
import { H1, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { credentialProblem, signUpWithPassword } from "@/auth/auth-actions";
import { WEB_LINKS } from "@/lib/config";
import { useColors } from "@/theme/ThemeProvider";

/** Create account (S16). Same rules as the website, including the 6-character floor. */
export default function SignUp() {
  const colors = useColors();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

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

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScreenScroll contentClassName="pt-4 gap-5">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            className="-ml-1 self-start p-1"
          >
            <ChevronLeft size={28} color={colors.foreground} />
          </Pressable>

          <H1>Create your account</H1>

          <View className="gap-4">
            <TextField
              label="Your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              placeholder="Alex Chen"
            />
            <TextField
              label="Email"
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

          <Button title="Create account" loading={busy} onPress={() => void submit()} />

          <Muted className="text-center">
            By creating an account you agree to our{" "}
            <Muted
              className="text-primary"
              accessibilityRole="link"
              onPress={() => void WebBrowser.openBrowserAsync(WEB_LINKS.terms)}
            >
              Terms
            </Muted>{" "}
            and{" "}
            <Muted
              className="text-primary"
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
              Already have an account? <Muted className="text-primary">Sign in</Muted>
            </Muted>
          </Pressable>
        </ScreenScroll>
      </KeyboardAvoidingView>
    </Screen>
  );
}
