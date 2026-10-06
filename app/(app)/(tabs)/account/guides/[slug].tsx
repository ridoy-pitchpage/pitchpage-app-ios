import { useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react-native";

import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { InlineText } from "@/components/InlineText";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H2, H3, Muted } from "@/components/Text";
import { EmptyState } from "@/components/States";
import { APP_GUIDE_PAGES, appRelationFor } from "@/content/guide-app-copy";
import type { GuideBlock } from "@/content/guide-pages";
import { runGuideCta } from "@/content/guide-links";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";

/**
 * One guide.
 *
 * The website renders these as an article with a sidebar; on a phone that is
 * simply the article, one column, with the FAQ collapsed because it sits after
 * the body and a reader scrolling to the call to action should not have to
 * scroll past twelve open answers to reach it.
 */

function Block({ block }: { block: GuideBlock }) {
  if (block.type === "p") {
    return <InlineText text={block.text} className="font-body text-[16px] leading-7 text-foreground" />;
  }

  const ordered = block.type === "ol";
  return (
    <View className="gap-2">
      {block.items.map((item, index) => (
        <View key={index} className="flex-row gap-2">
          <Body className="text-muted-foreground" style={{ minWidth: ordered ? 20 : 12 }}>
            {ordered ? `${index + 1}.` : "•"}
          </Body>
          <InlineText
            text={item}
            className="min-w-0 flex-1 font-body text-[16px] leading-7 text-foreground"
          />
        </View>
      ))}
    </View>
  );
}

export default function GuideScreen() {
  const colors = useColors();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const guide = slug ? APP_GUIDE_PAGES[slug] : undefined;
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  if (!guide) {
    return (
      <Screen edges={["top"]}>
        <ScreenScroll contentClassName="pt-2 gap-5">
          <BackButton />
          <EmptyState
            title="That guide has moved"
            body="It isn't in this version of the app. The guides list has everything that is."
            action={
              <Button
                title="See all guides"
                onPress={() => router.replace("/(app)/(tabs)/account/guides")}
              />
            }
          />
        </ScreenScroll>
      </Screen>
    );
  }

  const relation = appRelationFor(guide.slug);

  return (
    <Screen edges={["top"]}>
      <ScreenScroll contentClassName="pt-2 gap-6">
        <BackButton />

        <View className="gap-2">
          <Muted className="uppercase">{guide.category}</Muted>
          <H1>{guide.h1}</H1>
          <InlineText
            text={guide.intro}
            className="font-body text-[17px] leading-7 text-muted-foreground"
          />
          <Muted>Last updated {guide.updated}</Muted>
        </View>

        {guide.sections.map((section) => (
          <View key={section.heading} className="gap-3">
            <H2>{section.heading}</H2>
            {section.blocks.map((block, index) => (
              <Block key={index} block={block} />
            ))}
          </View>
        ))}

        {guide.faqs.length > 0 ? (
          <View className="gap-2">
            <H2>Questions</H2>
            {guide.faqs.map((faq) => {
              const expanded = openFaq === faq.q;
              return (
                <Card key={faq.q} className="p-0">
                  <Pressable
                    onPress={() => setOpenFaq(expanded ? null : faq.q)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    accessibilityLabel={faq.q}
                    style={{ minHeight: MIN_TAP }}
                    className="flex-row items-center gap-3 px-4 py-3"
                  >
                    <Body className="min-w-0 flex-1 font-body-medium">{faq.q}</Body>
                    {expanded ? (
                      <ChevronUp size={18} color={colors.mutedForeground} />
                    ) : (
                      <ChevronDown size={18} color={colors.mutedForeground} />
                    )}
                  </Pressable>
                  {expanded ? (
                    <View className="border-t border-border px-4 py-3">
                      <InlineText
                        text={faq.a}
                        className="font-body text-[16px] leading-7 text-muted-foreground"
                      />
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        ) : null}

        <Card className="gap-3">
          <H3>{relation.ctaLabel}</H3>
          <Muted>{relation.ctaBlurb}</Muted>
          <Button title={relation.ctaLabel} onPress={() => runGuideCta(relation.ctaTo)} />
        </Card>

        <View className="gap-2">
          <H2>Read next</H2>
          {relation.related.map((other) => {
            const next = APP_GUIDE_PAGES[other];
            if (!next) return null;
            return (
              <Card key={other} className="p-0">
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/(tabs)/account/guides/[slug]",
                      params: { slug: next.slug },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={next.h1}
                  style={{ minHeight: MIN_TAP }}
                  className="flex-row items-center gap-3 px-4 py-3"
                >
                  <View className="min-w-0 flex-1 gap-1">
                    <Muted className="uppercase">{next.category}</Muted>
                    <H3>{next.h1}</H3>
                  </View>
                  <ChevronRight size={18} color={colors.mutedForeground} />
                </Pressable>
              </Card>
            );
          })}
        </View>
      </ScreenScroll>
    </Screen>
  );
}
