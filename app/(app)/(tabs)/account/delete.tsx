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
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/auth/AuthProvider";
import { signOut } from "@/auth/auth-actions";
import { ACCOUNT_DELETE_UNAVAILABLE, deleteMyAccount } from "@/api/supabase-direct";
import { SUPPORT_EMAIL } from "@/lib/config";

/**
 * Delete account (S90).
 *
 * App Store Guideline 5.1.1(v) wants deletion started AND finished in the app,
 * so that is what this does: it calls `delete_my_account()`, which removes the
 * pages, the files, the credits and the account itself in one transaction, and
 * then signs out into a signed-out app.
 *
 * That function is not part of the website — it is new SQL, in
 * sql/001_delete_my_account.sql, and somebody has to run it against the
 * database once. Until they have, the call comes back
 * ACCOUNT_DELETE_UNAVAILABLE and this falls back to the emailed request it used
 * to be, saying plainly that a person will do it. Someone trying to leave
 * should never meet a dead button, and the fallback is not good enough for
 * review — it is what keeps the screen honest until the script is applied.
 */
export default function DeleteAccountScreen() {
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  const confirmed = typed.trim().toUpperCase() === "DELETE";

  async function emailRequest() {
    const body = [
      "Please delete my PitchPage account and everything on it.",
      "",
      `Account: ${user?.email ?? "(signed in on the app)"}`,
      "",
      "I understand my published pages will come offline and nothing on my account can be recovered.",
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

  async function confirmDelete() {
    const ok = await confirm({
      title: "Delete your account?",
      message: "Your pages come offline and everything on them goes. This cannot be undone.",
      confirmLabel: "Delete everything",
      cancelLabel: "Keep my account",
      destructive: true,
    });
    if (ok) await run();
  }

  async function run() {
    setBusy(true);
    try {
      await deleteMyAccount();
      // The account is gone; the session in memory is the only thing left.
      // Signing out drops it and the app returns to its signed-out state.
      await signOut();
      toast.success("Your account has been deleted");
    } catch (error) {
      if (error instanceof Error && error.message === ACCOUNT_DELETE_UNAVAILABLE) {
        const send = await confirm({
          title: "We'll do this by hand",
          message:
            "Deleting from the app isn't switched on for this account yet. Send the request and a person will action it, then confirm by email.",
          confirmLabel: "Send the request",
          cancelLabel: "Not now",
        });
        if (send) await emailRequest();
        return;
      }
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
            {/* For anyone who bought credits on the website. One plain line,
                and no way to buy or claim a refund from here: the app sells
                nothing (Guideline 3.1.3(f)). */}
            <Body className="text-muted-foreground">
              Any credits from the website you haven't used. Deleting doesn't
              refund them.
            </Body>
          </Card>

          <Card className="gap-2">
            <H3>This cannot be undone</H3>
            <Muted>
              There is no way back and nothing is kept, so if you only want a
              page offline, you can unpublish it yourself from Pages and keep
              everything else.
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
              title="Delete my account"
              variant="destructive"
              disabled={!confirmed}
              loading={busy}
              onPress={confirmDelete}
            />
          </View>
        </ScreenScroll>
      </KeyboardAvoidingView>
    </Screen>
  );
}
