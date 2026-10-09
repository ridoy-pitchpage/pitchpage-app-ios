import { Platform, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";

import { Button } from "@/components/Button";
import { TopBar } from "@/components/TopBar";
import { BackButton } from "@/components/BackButton";
import { Screen } from "@/components/Screen";
import { ErrorState, Loading } from "@/components/States";
import { Body, Muted } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { useMyPage } from "@/api/queries";
import { publicPageUrl } from "@/lib/share";
import { openPageLink } from "@/render/page-links";

/**
 * The live page (S78) — the real thing, rendered by the website's own layouts,
 * which is the only way to be sure it matches what a recruiter sees.
 *
 * A caveat worth knowing: the server only leaves the owner's own visit out of
 * the analytics when the request carries their token, which the website
 * attaches automatically and a plain WebView does not. So looking at your page
 * this way, or through "Open in Safari", can show up as a visit. Excluding it
 * properly needs a render surface on the website that does not exist yet
 * (master plan §14).
 */
export default function LivePageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const page = useMyPage(id);
  const toast = useToast();

  if (page.isPending) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (page.isError || !page.data) {
    return (
      <Screen>
        <ErrorState error={page.error} onRetry={() => void page.refetch()} />
      </Screen>
    );
  }

  const row = page.data;

  if (!row.published_at || !row.slug) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Body className="text-center">This page isn't live yet.</Body>
          <Button
            title="Go to publish"
            onPress={() =>
              router.replace({ pathname: "/(app)/preview/[id]", params: { id: row.id } })
            }
          />
        </View>
      </Screen>
    );
  }

  const url = publicPageUrl(row.slug);

  return (
    <Screen edges={["top"]}>
      <TopBar className="justify-between">
        <BackButton />
        <Muted numberOfLines={1} className="min-w-0 flex-1 px-2">
          {row.slug}
        </Muted>
        <Pressable
          onPress={() => void WebBrowser.openBrowserAsync(url)}
          accessibilityRole="button"
          className="min-h-[44px] justify-center px-2"
        >
          <Body className="text-link">Open in Safari</Body>
        </Pressable>
      </TopBar>

      {Platform.OS === "web" ? (
        // react-native-webview has no web build: it renders a red "does not
        // support this platform" notice rather than the page. An iframe is the
        // web equivalent, and the site allows being framed.
        <View className="flex-1">
          <iframe
            src={url}
            title={row.slug}
            style={{ border: 0, width: "100%", height: "100%" }}
          />
        </View>
      ) : (
        <WebView
          source={{ uri: url }}
          style={{ flex: 1 }}
          startInLoadingState
          renderLoading={() => <Loading label="Loading your page…" />}
          // Keep the WebView to the page itself. A link out of it — their
          // LinkedIn, an email address, the resume download — opens the way it
          // would from a browser; refusing the load alone made those taps do
          // nothing at all. Frames inside the page, like an embedded video,
          // load where they are.
          onShouldStartLoadWithRequest={(request) => {
            if (request.url.startsWith(url) || request.isTopFrame === false) return true;
            void openPageLink(request.url).catch((error: unknown) => toast.error(error));
            return false;
          }}
          // Without this the view hands a mailto: to Linking.canOpenURL first,
          // which iOS answers "no" for schemes the app hasn't declared, and the
          // Contact button did nothing (src/render/RenderSurface.tsx).
          originWhitelist={["*"]}
        />
      )}
    </Screen>
  );
}
