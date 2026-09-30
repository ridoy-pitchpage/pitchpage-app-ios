import { useState } from "react";
import { Pressable, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";

import { Card } from "@/components/Card";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H3, Muted } from "@/components/Text";
import { FAQ_TOPIC_NOTE, FAQ_TOPICS, FAQS } from "@/page/faq-content";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";

/** FAQ (S10). Answers copied from the site, since several are commitments. */
export default function FaqScreen() {
  const colors = useColors();
  const [open, setOpen] = useState<string | null>(FAQS[0]?.q ?? null);

  return (
    <Screen>
      <ScreenScroll contentClassName="pt-2 gap-5">
        <BackButton />

        <H1>Questions, answered plainly</H1>

        {FAQ_TOPICS.map((topic) => (
          <View key={topic} className="gap-2">
            <H3>{topic}</H3>
            <Muted>{FAQ_TOPIC_NOTE[topic]}</Muted>

            {FAQS.filter((entry) => entry.topic === topic).map((entry) => {
              const expanded = open === entry.q;
              return (
                <Card key={entry.q} className="p-0">
                  <Pressable
                    onPress={() => setOpen(expanded ? null : entry.q)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    accessibilityLabel={entry.q}
                    style={{ minHeight: MIN_TAP }}
                    className="flex-row items-center gap-3 px-4 py-3"
                  >
                    <Body className="min-w-0 flex-1 font-body-medium">{entry.q}</Body>
                    {expanded ? (
                      <ChevronUp size={18} color={colors.mutedForeground} />
                    ) : (
                      <ChevronDown size={18} color={colors.mutedForeground} />
                    )}
                  </Pressable>
                  {expanded ? (
                    <View className="border-t border-border px-4 py-3">
                      <Body className="text-muted-foreground">{entry.a}</Body>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        ))}
      </ScreenScroll>
    </Screen>
  );
}
