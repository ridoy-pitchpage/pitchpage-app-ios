import { View } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { Button } from "@/components/Button";
import { Sheet } from "@/components/Sheet";
import { Body, Muted } from "@/components/Text";
import { SITE_URL } from "@/lib/config";

/**
 * Asked once, before the first AI build (S20, Guideline 5.1.2(i)): what is
 * sent, to whom, and why, with a real choice. "Not now" is not a dead end:
 * the page can still be built by hand.
 */
export function ConsentSheet({
  visible,
  busy,
  onAllow,
  onNotNow,
}: {
  visible: boolean;
  busy: boolean;
  onAllow: () => void;
  onNotNow: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onNotNow} title="Build your page with AI">
      <Body>
        To write your first draft, PitchPage sends what you give it to Google's Gemini model,
        through the Lovable AI Gateway:
      </Body>
      <View className="gap-1 pl-1">
        <Body>• What you typed about yourself</Body>
        <Body>• Your CV, if you added one</Body>
        <Body>• The kind of page and the role you chose in setup</Body>
        <Body>• The names of your page's sections</Body>
      </View>
      <Muted>
        It's used to write your draft, which you can change or remove in the builder. Nothing is
        published until you publish.
      </Muted>
      <Button
        title="Read the privacy policy"
        variant="ghost"
        onPress={() => void WebBrowser.openBrowserAsync(`${SITE_URL}/privacy`)}
      />
      <View className="gap-2 pt-2">
        <Button title="Allow" loading={busy} onPress={onAllow} />
        <Button title="Not now" variant="secondary" disabled={busy} onPress={onNotNow} />
      </View>
      <Muted className="text-center">You can always build your page by hand instead.</Muted>
    </Sheet>
  );
}
