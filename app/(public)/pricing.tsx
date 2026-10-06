import { View } from "react-native";
import { Check } from "lucide-react-native";

import { Card } from "@/components/Card";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H3, Muted } from "@/components/Text";
import { useColors } from "@/theme/ThemeProvider";

/**
 * Pricing (S08).
 *
 * No prices in dollars: the website sets them and sells the credits
 * (src/features/credits/web-checkout.ts), so a figure here would only go stale.
 * Buying needs an account, so the way to it is Credits, after signing in.
 */

const FREE = [
  "Build as many pages as you like",
  "All thirty styles and twenty colours",
  "Your photo, your intro video, your documents",
  "Edit whenever you want",
];

const PAID = [
  "One credit publishes one page",
  "A shareable link, a QR code and tracked links",
  "See who opened it and how far they read",
  "Credits never expire",
];

export default function PricingScreen() {
  const colors = useColors();

  return (
    <Screen>
      <ScreenScroll contentClassName="pt-2 gap-5">
        <BackButton />

        <View className="gap-2">
          <H1>Free to build. One credit to publish.</H1>
          <Body className="text-muted-foreground">
            No subscription. You pay once per page you put live.
          </Body>
        </View>

        <Card className="gap-3">
          <H3>Building is free</H3>
          {FREE.map((line) => (
            <Row key={line} label={line} color={colors.mutedForeground} />
          ))}
        </Card>

        <Card className="gap-3">
          <H3>Publishing costs a credit</H3>
          {PAID.map((line) => (
            <Row key={line} label={line} color={colors.primary} />
          ))}
        </Card>

        <Card className="gap-2">
          <H3>Refunds</H3>
          <Muted>
            Unused credits are fully refundable within 14 days. Once a credit has
            published a page it's been spent — but you can keep editing that page
            as much as you like.
          </Muted>
        </Card>

        <Muted className="text-center">
          Credits are bought on pitchpage.co, and work in the app and on the website alike.
        </Muted>
      </ScreenScroll>
    </Screen>
  );
}

function Row({ label, color }: { label: string; color: string }) {
  return (
    <View className="flex-row items-start gap-2">
      <View className="pt-0.5">
        <Check size={16} color={color} />
      </View>
      <Body className="min-w-0 flex-1">{label}</Body>
    </View>
  );
}
