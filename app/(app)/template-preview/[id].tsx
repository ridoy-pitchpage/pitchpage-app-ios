import { useState } from "react";
import { Platform, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";

import { ActionBar } from "@/components/ActionBar";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { ErrorState, Loading } from "@/components/States";
import { Body, Muted } from "@/components/Text";
import { useMyPage } from "@/api/queries";
import { useApplyTemplate } from "@/features/builder/use-apply-template";
import { FAMILY_BY_ID, STYLE_CATEGORY_SHORT } from "@/page/style-families";
import { SITE_URL } from "@/lib/config";

/**
 * One template, as the website actually draws it.
 *
 * The app renders thirty families through five archetypes — see
 * `src/render/template-theme.ts` for why — which is enough to build a page
 * against but not enough to choose one by: Corporate, Letterhead and Momentum
 * all come out as the same treatment, so a swatch in the picker cannot show
 * what is being picked. The website already publishes a real sample of every
 * family at `/sample/<id>`, complete with content, so this shows that instead
 * of an approximation of it.
 *
 * It is a WebView for the same reason the live page is one: the website's own
 * layouts are the only thing guaranteed to match what a reader will see.
 */
export default function TemplatePreviewScreen() {
  const { id, family: familyId } = useLocalSearchParams<{ id: string; family: string }>();
  const page = useMyPage(id);
  // Remounting the WebView is the only reliable way to retry a failed load.
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  const family = familyId ? FAMILY_BY_ID[familyId] : undefined;
  const { apply, busy } = useApplyTemplate(
    page.data ?? {
      id: id ?? "",
      template: null,
      updated_at: null,
      wizard_meta: null,
      sections: null,
      portrait_url: null,
    },
  );

  if (page.isPending) {
    return (
      <Screen>
        <Loading label="Loading your page…" />
      </Screen>
    );
  }

  if (page.isError || !page.data || !family) {
    return (
      <Screen edges={["top"]}>
        <View className="px-2 py-1">
          <BackButton label="Back to templates" />
        </View>
        <ErrorState
          error={page.error}
          title={family ? "That didn't load" : "That template no longer exists"}
          onRetry={family ? () => void page.refetch() : undefined}
        />
      </Screen>
    );
  }

  // ?screenshot=1 drops the website's sample banner — the "this is a sample,
  // build yours free" strip with All examples and Build My Pitch Page in it.
  // That is marketing chrome aimed at a web visitor; inside the app the person
  // is already building, and those two controls lead out of the flow they are
  // in. The website already supports the flag for its own gallery thumbnails.
  const base = `${SITE_URL}/sample/${family.id}`;
  const url = `${base}?screenshot=1`;

  function retry() {
    setFailed(false);
    setAttempt((n) => n + 1);
  }

  return (
    <Screen edges={["top"]}>
      <View className="flex-row items-center gap-2 border-b border-border px-2 py-1">
        <BackButton label="Back to templates" />
        <View className="min-w-0 flex-1">
          <Body numberOfLines={1} className="font-body-medium">
            {family.label}
          </Body>
          <Muted numberOfLines={1} className="text-[12px]">
            {STYLE_CATEGORY_SHORT[family.category]}
          </Muted>
        </View>
      </View>

      {failed ? (
        <ErrorState
          error={new Error("The sample couldn't be loaded.")}
          title="That didn't load"
          onRetry={retry}
        />
      ) : Platform.OS === "web" ? (
        // react-native-webview has no web build at all: it renders a red
        // "does not support this platform" notice instead of the page. A plain
        // iframe is the web equivalent, and pitchpage.co allows being framed —
        // it sets no X-Frame-Options and no frame-ancestors.
        <View className="flex-1">
          <iframe
            key={attempt}
            src={url}
            title={`${family.label} sample`}
            onError={() => setFailed(true)}
            style={{ border: 0, width: "100%", height: "100%" }}
          />
        </View>
      ) : (
        <WebView
          key={attempt}
          source={{ uri: url }}
          style={{ flex: 1 }}
          startInLoadingState
          renderLoading={() => <Loading label={`Loading the ${family.label} sample…`} />}
          onError={() => setFailed(true)}
          onHttpError={() => setFailed(true)}
          // A sample page links out to the marketing site. Staying put keeps
          // this screen about the one decision it exists for.
          // Matched on the path, not the full URL: the flag is a query string,
          // and a redirect that drops it would otherwise strand a blank screen.
          onShouldStartLoadWithRequest={(request) => request.url.startsWith(base)}
        />
      )}

      <ActionBar>
        <Button
          title="Use this template"
          loading={busy}
          haptic
          onPress={() => void apply(family.id)}
        />
      </ActionBar>
    </Screen>
  );
}
