import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import * as MailComposer from "expo-mail-composer";
import * as Clipboard from "expo-clipboard";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H3, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/auth/AuthProvider";
import { SUPPORT_EMAIL } from "@/lib/config";

/**
 * Delete account (S90).
 *
 * This is a REQUEST, not a deletion, and says so plainly. Removing the account
 * itself needs the service role, and there is no function a signed-in user can
 * call to do it — see the master plan's standing constraint. Rather than
 * pretend otherwise, or half-delete somebody's work and leave the account
 * behind, the screen sends a request that a person acts on.
 *
 * This is the one item that blocks an App Store submission: Guideline 5.1.1(v)
 * requires deletion to be initiated AND completed in the app. It becomes a real
 * deletion the moment the endpoint in §10.6 exists.
 */
export default function DeleteAccountScreen() {
  const toast = useToast();
  const { user } = useAuth();
  const [typed, setTyped] = useState("");

  const confirmed = typed.trim().toUpperCase() === "DELETE";

  async function request() {
    const body = [
      "Please delete my PitchPage account and everything on it.",
      "",
      `Account: ${user?.email ?? "(signed in on the app)"}`,
      "",
      "I understand my published pages will come offline and any unused credits will be lost.",
    ].join("\n");

    if (!(await MailComposer.isAvailableAsync())) {
      await Clipboard.setStringAsync(`${SUPPORT_EMAIL}\n\n${body}`);
      toast.success("No mail app — the request was copied instead");
      return;
    }

    await MailComposer.composeAsync({
      recipients: [SUPPORT_EMAIL],
      subject: "Delete my account",
      body,
    });
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScreenScroll contentClassName="pt-2 gap-5">
          <BackButton />

          <H1>Delete your account</H1>

          <Card className="gap-2">
            <H3>What goes</H3>
            <Body className="text-muted-foreground">
              Every page you've built, published or not. Any page that is live
              comes offline and its link stops working.
            </Body>
            <Body className="text-muted-foreground">
              Your photos, videos and documents.
            </Body>
            <Body className="text-muted-foreground">
              Any credits you haven't used. They aren't refunded.
            </Body>
          </Card>

          <Card className="gap-2">
            <H3>How it happens</H3>
            <Muted>
              Deleting an account has to be done by us rather than from the app.
              Send the request below and a person will action it, then confirm by
              email. If you'd rather keep the account and just take a page
              offline, you can do that yourself from Pages.
            </Muted>
          </Card>

          <View className="gap-3">
            <TextField
              label="Type DELETE to confirm"
              value={typed}
              onChangeText={setTyped}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="DELETE"
            />
            <Button
              title="Request deletion"
              variant="destructive"
              disabled={!confirmed}
              onPress={() => void request()}
            />
          </View>
        </ScreenScroll>
      </KeyboardAvoidingView>
    </Screen>
  );
}
