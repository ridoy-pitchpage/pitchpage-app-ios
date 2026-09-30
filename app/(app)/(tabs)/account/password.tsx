import { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";

import { Button } from "@/components/Button";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { H1, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { updatePassword } from "@/auth/auth-actions";

/**
 * Change password (S86). New on the app — the website only offers a reset by
 * email, which means leaving to check your inbox to change a password you
 * already know.
 */
export default function PasswordScreen() {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== password;
  const tooShort = password.length > 0 && password.length < 6;

  async function save() {
    if (password.length < 6) {
      toast.error(new Error("Password must be at least 6 characters."));
      return;
    }
    if (password !== confirm) {
      toast.error(new Error("Those two don't match."));
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      toast.success("Password changed");
      router.back();
    } catch (error) {
      // Supabase asks for a recent sign-in before it will accept this.
      toast.error(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScreenScroll contentClassName="pt-2 gap-5">
          <BackButton />

          <H1>Change your password</H1>

          <TextField
            label="New password"
            value={password}
            onChangeText={setPassword}
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            hint="At least 6 characters."
            error={tooShort ? "At least 6 characters." : null}
          />
          <TextField
            label="Type it again"
            value={confirm}
            onChangeText={setConfirm}
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            error={mismatch ? "Those two don't match." : null}
          />

          <Button
            title="Change password"
            loading={busy}
            disabled={password.length < 6 || password !== confirm}
            onPress={() => void save()}
          />
          <Muted>
            If you signed in a while ago you may be asked to sign in again first.
          </Muted>
        </ScreenScroll>
      </KeyboardAvoidingView>
    </Screen>
  );
}
