import { Pressable, View } from "react-native";
import { router } from "expo-router";

import { Button } from "@/components/Button";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, Muted } from "@/components/Text";
import { Card } from "@/components/Card";

/**
 * Welcome (S05). Replaces the website's home and features pages: the same
 * promise, said once, with the three things the product actually does.
 */

const CARDS = [
  {
    title: "Start from your résumé",
    body: "Upload what you already have and AI drafts the page for you.",
  },
  {
    title: "Pick how it looks",
    body: "Thirty styles, each built for a different kind of work.",
  },
  {
    title: "Share one link, see who opened it",
    body: "Send a link instead of a PDF, and find out who read what.",
  },
];

export default function Welcome() {
  return (
    <Screen>
      <ScreenScroll contentClassName="pt-8 gap-6">
        <View className="gap-3 pt-6">
          <H1>Your story.{"\n"}One powerful link.</H1>
          <Body className="text-muted-foreground">
            Build a page that shows who you are, and send it instead of a PDF.
          </Body>
        </View>

        <View className="gap-3">
          {CARDS.map((card) => (
            <Card key={card.title} className="gap-1">
              <Body className="font-body-bold">{card.title}</Body>
              <Muted>{card.body}</Muted>
            </Card>
          ))}
        </View>

        <View className="gap-3 pt-2">
          <Button title="Create an account" onPress={() => router.push("/(public)/sign-up")} />
          <Button
            title="Sign in"
            variant="secondary"
            onPress={() => router.push("/(public)/sign-in")}
          />
        </View>

        <Muted className="text-center">
          Building a page is free. Publishing one costs a single credit.
        </Muted>

        <View className="flex-row flex-wrap justify-center gap-x-5 gap-y-2 pt-2">
          <FooterLink label="See examples" href="/(public)/examples" />
          <FooterLink label="How it works" href="/(public)/how-it-works" />
          <FooterLink label="Pricing" href="/(public)/pricing" />
          <FooterLink label="Questions" href="/(public)/faq" />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

function FooterLink({ label, href }: { label: string; href: string }) {
  return (
    <Pressable
      onPress={() => router.push(href as never)}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={{ minHeight: 44, justifyContent: "center" }}
    >
      <Muted className="text-primary">{label}</Muted>
    </Pressable>
  );
}
