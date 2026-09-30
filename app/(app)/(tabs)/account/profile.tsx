import { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/Button";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { H1, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { keys, useMyProfile } from "@/api/queries";
import { setDisplayName } from "@/api/supabase-direct";

/** Profile (S85). The display name is what Paige greets you by on the website. */
export default function ProfileScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const profile = useMyProfile();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  /*
   * Seed the field once, when the profile arrives, and never again — someone
   * who started typing before the query resolved should not have it taken back
   * off them. Adjusting state during render rather than in an effect means the
   * empty field is never committed and then replaced, which on a slow
   * connection showed as a visible flicker.
   */
  const [seeded, setSeeded] = useState(false);
  const loadedName = profile.data?.display_name;

  if (!seeded && loadedName != null) {
    setSeeded(true);
    if (name === "") setName(loadedName);
  }

  async function save() {
    setBusy(true);
    try {
      await setDisplayName(name);
      await queryClient.invalidateQueries({ queryKey: keys.profile });
      toast.success("Saved");
      router.back();
    } catch (error) {
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

          <H1>Your name</H1>
          <TextField
            label="Display name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            textContentType="name"
          />
          <Muted>
            This is how the website greets you. It's separate from the name on
            any of your pages.
          </Muted>
          <Button title="Save" loading={busy} disabled={!name.trim()} onPress={() => void save()} />
        </ScreenScroll>
      </KeyboardAvoidingView>
    </Screen>
  );
}
