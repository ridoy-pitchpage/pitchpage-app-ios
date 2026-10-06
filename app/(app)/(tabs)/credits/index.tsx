import { RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { ArrowDownLeft, ArrowUpRight, Coins, Plus, Wallet } from "lucide-react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { MotionEntrance } from "@/components/MotionEntrance";
import { Screen } from "@/components/Screen";
import { ErrorState, Loading } from "@/components/States";
import { Body, H1, H3, Muted } from "@/components/Text";
import { useMyCredits } from "@/api/queries";
import type { CreditTransactionRow } from "@/api/supabase-direct";
import { creditCount, relativeTime } from "@/lib/format";
import { useColors } from "@/theme/ThemeProvider";
import { mix } from "@/theme/tokens";

/**
 * Credits (S82). The balance and the ledger read straight from the account, so
 * credits bought on the website already show here.
 *
 * Buying is on pitchpage.co, in Safari, which the US storefront allows
 * (credits/buy and src/features/credits/web-checkout.ts). In-App Purchase
 * comes before any other storefront (§13).
 */
export default function CreditsScreen() {
  const colors = useColors();
  const credits = useMyCredits();

  if (credits.isPending) {
    return (
      <Screen>
        <Loading label="Checking your balance…" />
      </Screen>
    );
  }

  if (credits.isError) {
    return (
      <Screen>
        <ErrorState error={credits.error} onRetry={() => void credits.refetch()} />
      </Screen>
    );
  }

  const { balance, transactions } = credits.data;

  return (
    <Screen edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-3 gap-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={credits.isFetching}
            onRefresh={() => void credits.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <MotionEntrance className="gap-1">
          <Muted className="font-body-bold text-[11px] tracking-[1.5px]" style={{ color: colors.primary }}>
            READY WHEN YOU ARE
          </Muted>
          <H1>Credits</H1>
          <Muted>Build freely. Publish with a credit.</Muted>
        </MotionEntrance>

        <MotionEntrance index={1}>
          <Card flat className="gap-4 p-5" style={{ backgroundColor: mix(colors.card, colors.primary, 0.06) }}>
            <View className="flex-row items-center justify-between gap-3">
              <Muted className="font-body-bold">Available balance</Muted>
              <View
                className="h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: mix(colors.card, colors.primary, 0.1) }}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Wallet size={21} color={colors.primary} />
              </View>
            </View>
            <View className="gap-1">
              <Body className="font-heading text-[44px] leading-[56px]" style={{ color: colors.primary }}>
                {creditCount(balance)}
              </Body>
              <Muted>
                {balance > 0
                  ? "One credit publishes one page. Credits never expire."
                  : "You'll need a credit to publish a page."}
              </Muted>
            </View>
          </Card>
        </MotionEntrance>

        {/* Buying happens on pitchpage.co; the next screen says so before it sends anyone there. */}
        <Button
          title="Buy credits"
          icon={<Plus size={18} color={colors.primaryForeground} />}
          onPress={() => router.push("/(app)/(tabs)/credits/buy")}
        />

        <View className="gap-2 pt-2">
          <H3>Recent activity</H3>
          {transactions.length === 0 ? (
            <Card className="flex-row items-start gap-3">
              <View
                className="h-11 w-11 shrink-0 items-center justify-center rounded-control"
                style={{ backgroundColor: mix(colors.card, colors.accent, 0.1) }}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Coins size={20} color={colors.foreground} />
              </View>
              <View className="min-w-0 flex-1 gap-1">
                <H3>A fresh start</H3>
                <Muted>Your credit activity will appear here.</Muted>
              </View>
            </Card>
          ) : (
            <Card className="p-0 px-4">
              {transactions.map((row, index) => (
                <LedgerRow key={row.id} row={row} last={index === transactions.length - 1} />
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

/** The web's ledger labels, so the two lists read the same. */
function reasonLabel(reason: string): string {
  switch (reason) {
    case "publish_pitch_page":
      return "Published a pitch page";
    case "create_pitch_page":
      return "Created a new pitch page";
    case "purchase":
      return "Purchased credits";
    case "org_sponsored":
      return "Published — covered by your company";
    case "personal_invite":
      return "Credits from an invite";
    default:
      return "Credits granted";
  }
}

function LedgerRow({ row, last }: { row: CreditTransactionRow; last: boolean }) {
  const colors = useColors();
  const sign = row.delta > 0 ? "+" : "";
  const Icon = row.delta > 0 ? ArrowDownLeft : ArrowUpRight;
  return (
    <View className={["flex-row items-center gap-3 py-4", last ? "" : "border-b border-border"].join(" ")}>
      <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary" accessibilityElementsHidden>
        <Icon size={17} color={colors.mutedForeground} />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Body>{reasonLabel(row.reason)}</Body>
        <Muted>{relativeTime(row.created_at)}</Muted>
      </View>
      {/* delta 0 is a real row: a company-sponsored publish spends nothing. */}
      {row.delta === 0 ? null : (
        <Body className="font-body-bold" style={{ color: row.delta > 0 ? colors.primary : colors.mutedForeground }}>
          {sign}
          {row.delta}
        </Body>
      )}
    </View>
  );
}
