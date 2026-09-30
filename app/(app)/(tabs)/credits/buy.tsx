import { View } from "react-native";
import { Check } from "lucide-react-native";

import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H2, H3, Muted } from "@/components/Text";
import { useConfirm } from "@/components/Confirm";
import { useColors } from "@/theme/ThemeProvider";

/**
 * Buying credits.
 *
 * Credits are a digital good used inside the app, so Apple requires them to be
 * sold through In-App Purchase — Guideline 3.1.1 — and the same rule forbids
 * sending somebody to a web checkout instead, or even telling them one exists.
 * So there is no link out here, deliberately.
 *
 * What IAP needs that the app cannot supply on its own: the products defined in
 * App Store Connect, the Paid Apps agreement signed, and an endpoint that
 * verifies Apple's receipt and then calls grant_credits. That last one has to
 * live on the server — grant_credits is granted to service_role only, and
 * rightly so, since a client that could grant itself credits would be a hole.
 *
 * The packs are real and the flow is real; the purchase is what is waiting. The
 * prices shown are the website's, as a placeholder: once StoreKit is wired the
 * price comes from it, already localised, because a hard-coded dollar figure is
 * wrong in every other country and Apple rejects builds that show one.
 */

type Pack = {
  id: "starter" | "pro";
  credits: number;
  price: string;
  each?: string;
  best?: boolean;
  lines: string[];
};

const PACKS: readonly Pack[] = [
  {
    id: "starter",
    credits: 1,
    price: "$9",
    lines: ["Publishes one page", "Never expires", "Refundable for 14 days if unused"],
  },
  {
    id: "pro",
    credits: 5,
    price: "$39",
    each: "$7.80 a page",
    best: true,
    lines: [
      "Publishes five pages",
      "Use them whenever, for whatever",
      "Refundable for 14 days if unused",
    ],
  },
];

export default function BuyCreditsScreen() {
  const colors = useColors();
  const confirm = useConfirm();

  async function buy(pack: Pack) {
    await confirm({
      title: "In-app purchase isn't switched on yet",
      message:
        `Buying ${pack.credits === 1 ? "a credit" : `${pack.credits} credits`} has to go through Apple, which needs the products set up in App Store Connect and a server that checks Apple's receipt before the credits are granted. It isn't ready yet. Credits already on your account work normally.`,
      confirmLabel: "OK",
      dismissOnly: true,
    });
  }

  return (
    <Screen edges={["top"]}>
      <ScreenScroll contentClassName="pt-2 gap-5">
        <BackButton />

        <View className="gap-2">
          <H1>Buy credits</H1>
          <Muted>
            Building and editing is free. A credit is what publishes a page and makes its link live.
          </Muted>
        </View>

        {PACKS.map((pack) => (
          <Card
            key={pack.id}
            className={pack.best ? "gap-3 border-primary" : "gap-3"}
          >
            <View className="flex-row items-baseline gap-2">
              <H2>{pack.price}</H2>
              <Body className="text-muted-foreground">
                {pack.credits === 1 ? "one credit" : `${pack.credits} credits`}
              </Body>
              {pack.best ? (
                <Body className="ml-auto font-body-medium text-link">Better value</Body>
              ) : null}
            </View>

            {pack.each ? <Muted>{pack.each}</Muted> : null}

            <View className="gap-1">
              {pack.lines.map((line) => (
                <View key={line} className="flex-row items-center gap-2">
                  <Check size={15} color={colors.primary} />
                  <Body className="min-w-0 flex-1 text-muted-foreground">{line}</Body>
                </View>
              ))}
            </View>

            <Button
              title={`Buy ${pack.credits === 1 ? "1 credit" : `${pack.credits} credits`}`}
              variant={pack.best ? "primary" : "secondary"}
              onPress={() => void buy(pack)}
            />
          </Card>
        ))}

        <Card className="gap-2">
          <H3>How credits work</H3>
          <Body className="text-muted-foreground">
            One credit publishes one page. Taking a page offline and publishing it again later
            doesn't cost another one.
          </Body>
          <Body className="text-muted-foreground">
            Credits never expire, and unused ones are refundable for 14 days.
          </Body>
        </Card>
      </ScreenScroll>
    </Screen>
  );
}
