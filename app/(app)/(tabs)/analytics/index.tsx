import { Screen, ScreenScroll } from "@/components/Screen";
import { EmptyState } from "@/components/States";
import { H1 } from "@/components/Text";

/**
 * Analytics (S79) arrives in M6, together with the analytics endpoints
 * (§9.2). The tab exists now so the shape of the app is right; it says plainly
 * that the numbers are not here yet rather than showing zeros, which would read
 * as "nobody opened your page".
 */
export default function AnalyticsScreen() {
  return (
    <Screen edges={["top"]}>
      <ScreenScroll contentClassName="pt-2">
        <H1>Analytics</H1>
        <EmptyState
          title="Coming in the next milestone"
          body="Views, visitors, video plays and tracked links will appear here. For now they're on pitchpage.co."
        />
      </ScreenScroll>
    </Screen>
  );
}
