import { Pressable, View } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H3, Muted } from "@/components/Text";
import { StyleGallery } from "@/features/builder/StyleGallery";
import { SITE_URL } from "@/lib/config";
import { STYLE_CATEGORY_SHORT, STYLE_FAMILIES } from "@/page/style-families";

/**
 * Examples (S06).
 *
 * Tapping a style opens that style's real sample page on the site, because a
 * genuine finished page is far more persuasive than anything the app could
 * summarise — and it is the same page a recruiter would receive.
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
            void WebBrowser.openBrowserAsync(`${SITE_URL}/sample/${family.id}`)
          }
          footer={(family) => STYLE_CATEGORY_SHORT[family.category]}
        />

        <View className="gap-1 pt-2">
          <H3>Whole example pages</H3>
          <Muted>Four finished pages, in four different lines of work.</Muted>
          {["preview-page", "preview-page-2", "preview-page-3", "preview-page-4"].map(
            (slug, index) => (
              <Pressable
                key={slug}
                onPress={() => void WebBrowser.openBrowserAsync(`${SITE_URL}/${slug}`)}
                accessibilityRole="link"
                accessibilityLabel={`Open example page ${index + 1}`}
                style={{ minHeight: 48 }}
                className="justify-center border-b border-border"
              >
                <Body className="text-link">Example {index + 1}</Body>
              </Pressable>
            ),
          )}
        </View>
      </ScreenScroll>
    </Screen>
  );
}
