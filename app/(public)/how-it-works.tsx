import { View } from "react-native";
import { router } from "expo-router";

import { Button } from "@/components/Button";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H3, Muted } from "@/components/Text";
import { HOW_IT_WORKS } from "@/page/faq-content";
import { useAuth } from "@/auth/AuthProvider";

/** How it works (S09). */
export default function HowItWorksScreen() {
  const { signedIn } = useAuth();

  return (
    <Screen>
      <ScreenScroll contentClassName="pt-2 gap-5">
        <BackButton />

        <H1>How it works</H1>

        <View className="gap-5">
          {HOW_IT_WORKS.map((step, index) => (
            <View key={step.title} className="flex-row gap-3">
              <View
                className="h-8 w-8 items-center justify-center rounded-full bg-primary"
                accessibilityElementsHidden
              >
                <Body className="text-primary-foreground font-body-bold">{index + 1}</Body>
              </View>
              <View className="min-w-0 flex-1 gap-1">
                <H3>{step.title}</H3>
                <Muted>{step.body}</Muted>
              </View>
            </View>
          ))}
        </View>

        {signedIn ? null : (
          <Button title="Create an account" onPress={() => router.push("/(public)/sign-up")} />
        )}
      </ScreenScroll>
    </Screen>
  );
}
