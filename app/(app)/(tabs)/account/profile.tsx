import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react-native";

import { Button } from "@/components/Button";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { H1, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { keys, useMyProfile } from "@/api/queries";
import { setDisplayName } from "@/api/supabase-direct";
import { useColors } from "@/theme/ThemeProvider";

/** Profile (S85). The display name is what Paige greets you by on the website. */
export default function ProfileScreen() {
  const colors = useColors();
  const toast = useToast();
  const queryClient = useQueryClient();
  const profile = useMyProfile();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile.data?.display_name) setName(profile.data.display_name);
  }, [profile.data?.display_name]);

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
