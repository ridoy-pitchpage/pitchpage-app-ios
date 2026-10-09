import { View } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1 } from "@/components/Text";
import { StyleGallery } from "@/features/builder/StyleGallery";
import { SITE_URL } from "@/lib/config";
import { STYLE_CATEGORY_SHORT, STYLE_FAMILIES } from "@/page/style-families";

/**
 * Examples (S06).
 *
 * Tapping a style opens that style's real sample page on the site, because a
 * genuine finished page is far more persuasive than anything the app could
 * summarise — and it is the same page a recruiter would receive.
 *
 * ?screenshot=1 drops the website's sample banner, as the template preview
 * does. Its "All examples" goes to the website's gallery, which names the
 * price and links to buying, and an app that sells nothing may not point
 * anyone there (Guideline 3.1.3(f)). The four whole example pages went for the
 * same reason (2026-10-09): their banner has no such switch.
 */
export default function ExamplesScreen() {

  return (
    <Screen>
      <ScreenScroll contentClassName="pt-2 gap-5">
        <BackButton />

        <View className="gap-2">
          <H1>Thirty styles</H1>
          <Body className="text-muted-foreground">
            Each one built for a different kind of work. Tap any to see a full
            example page.
          </Body>
        </View>

        <StyleGallery
          families={STYLE_FAMILIES}
          onSelect={(family) =>
            void WebBrowser.openBrowserAsync(`${SITE_URL}/sample/${family.id}?screenshot=1`)
          }
          footer={(family) => STYLE_CATEGORY_SHORT[family.category]}
        />
      </ScreenScroll>
    </Screen>
  );
}
