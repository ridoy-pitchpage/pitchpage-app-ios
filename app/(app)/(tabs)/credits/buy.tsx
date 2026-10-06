import { useState } from "react";
import { ExternalLink } from "lucide-react-native";

import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H3, Muted } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { useMyCredits } from "@/api/queries";
import { openCreditsCheckout } from "@/features/credits/web-checkout";
import { creditCount } from "@/lib/format";
import { useColors } from "@/theme/ThemeProvider";

/**
 * Getting credits.
 *
 * Credits are bought on pitchpage.co, in Safari — web-checkout.ts says why it
 * is a link and never a checkout inside the app. The balance re-reads itself
 * when the app comes back to the foreground (useRefreshCreditsOnReturn), so
 * the number here is the new one as soon as somebody returns from paying.
 */
export default function BuyCreditsScreen() {
  const colors = useColors();
  const toast = useToast();
  const credits = useMyCredits();
  const [opening, setOpening] = useState(false);

  async function buy() {
    setOpening(true);
    try {
      await openCreditsCheckout();
    } catch (error) {
      toast.error(error);
    } finally {
      setOpening(false);
    }
  }

  return (
    <Screen edges={["top"]}>
      <ScreenScroll contentClassName="pt-2 gap-5">
        <BackButton />

        <H1>Get credits</H1>
        <Muted>
          Building and editing your page is free. Publishing one page uses one credit, and credits
          never expire.
        </Muted>

        {credits.data ? <Body>You have {creditCount(credits.data.balance)}.</Body> : null}

        <Card className="gap-3">
          <H3>Buy on pitchpage.co</H3>
          <Body className="text-muted-foreground">
            Credits are sold on the PitchPage website. Sign in there with this same account, and
            the credits you buy show up here when you come back.
          </Body>
          <Button
            title="Buy credits on pitchpage.co"
            icon={<ExternalLink size={18} color={colors.primaryForeground} />}
            loading={opening}
            accessibilityHint="Opens the PitchPage website in Safari"
            onPress={() => void buy()}
          />
        </Card>

        <Card className="gap-2">
          <H3>How credits work</H3>
          <Body className="text-muted-foreground">
            One credit publishes one page. Taking a page offline and publishing it again later
            doesn't cost another one.
          </Body>
        </Card>
      </ScreenScroll>
    </Screen>
  );
}
