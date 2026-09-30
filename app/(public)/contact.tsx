import { Pressable, View } from "react-native";
import { router } from "expo-router";
import * as MailComposer from "expo-mail-composer";
import * as Clipboard from "expo-clipboard";
import { ChevronLeft } from "lucide-react-native";

import { Button } from "@/components/Button";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, Muted } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { SUPPORT_EMAIL } from "@/lib/config";
import { useColors } from "@/theme/ThemeProvider";

/**
 * Contact (S13). The site has no form either — it is a mail link and an
 * address, on the grounds that a real person reads every message.
 */
export default function ContactScreen() {
  const colors = useColors();
  const toast = useToast();

  async function compose() {
    if (!(await MailComposer.isAvailableAsync())) {
      await Clipboard.setStringAsync(SUPPORT_EMAIL);
      toast.success("No mail app — address copied");
      return;
    }
    await MailComposer.composeAsync({ recipients: [SUPPORT_EMAIL], subject: "PitchPage" });
  }

  return (
    <Screen>
      <ScreenScroll contentClassName="pt-2 gap-5">
        <BackButton />

        <View className="gap-2">
          <H1>Get in touch</H1>
          <Body className="text-muted-foreground">
            Questions, refunds, account deletion, or anything that isn't working.
            A real person reads every message.
          </Body>
        </View>

        <Button title="Write to us" onPress={() => void compose()} />
        <Button
          title="Copy the address"
          variant="secondary"
          onPress={async () => {
            await Clipboard.setStringAsync(SUPPORT_EMAIL);
            toast.success("Address copied");
          }}
        />
        <Muted className="text-center">{SUPPORT_EMAIL}</Muted>
      </ScreenScroll>
    </Screen>
  );
}
