import { View } from "react-native";

import { BackButton } from "@/components/BackButton";
import { Card } from "@/components/Card";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H2, H3, Muted } from "@/components/Text";
import { DWELL_BUCKETS, MEASURED, NEVER } from "@/content/tracking-content";

/**
 * What we measure — the website's /tracking page, in the app.
 *
 * It used to open a browser. It belongs in the app for two reasons: it is what
 * PitchPage promises about other people's data, and an owner reading their
 * analytics is exactly who wants to know what was collected to produce them —
 * so it sits one tap from Account, with the same words as the website.
 */
export default function TrackingScreen() {
  return (
    <Screen edges={["top"]}>
      <ScreenScroll contentClassName="pt-2 gap-6">
        <BackButton />

        <View className="gap-2">
          <H1>What we measure</H1>
          <Muted>
            What your page records when somebody opens it, and what it never keeps. The same on the
            app as on the web.
          </Muted>
        </View>

        <View className="gap-3">
          <H2>What your page records</H2>
          {MEASURED.map((item) => (
            <Card key={item.title} className="gap-1">
              <H3>{item.title}</H3>
              <Body className="text-muted-foreground">{item.body}</Body>
            </Card>
          ))}
          {DWELL_BUCKETS.length > 0 ? (
            <Muted>Time on page is only ever shown as one of: {DWELL_BUCKETS.join(", ")}.</Muted>
          ) : null}
        </View>

        <View className="gap-3">
          <H2>What is never stored</H2>
          {NEVER.map((line) => (
            <View key={line} className="flex-row gap-2">
              <Body className="text-muted-foreground">•</Body>
              <Body className="min-w-0 flex-1 text-muted-foreground">{line}</Body>
            </View>
          ))}
        </View>
      </ScreenScroll>
    </Screen>
  );
}
