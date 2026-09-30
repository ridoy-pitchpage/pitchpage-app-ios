import { RefreshControl, ScrollView, View } from "react-native";

import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ErrorState, Loading } from "@/components/States";
import { Body, H1, H3, Muted } from "@/components/Text";
import { useMyCredits } from "@/api/queries";
import type { CreditTransactionRow } from "@/api/supabase-direct";
import { creditCount, relativeTime } from "@/lib/format";
import { useColors } from "@/theme/ThemeProvider";

/**
 * Credits (S82). The balance and the ledger read straight from the account, so
 * credits bought on the website already show here.
 *
 * Buying is M5: it goes through Apple In-App Purchase, which needs the products
 * in App Store Connect, the Paid Apps agreement active, and the verification
 * endpoint on the server (§13). There is deliberately no link out to the
 * website's checkout — App Store Guideline 3.1.1.
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
        contentContainerClassName="px-4 pb-10 gap-4"
        refreshControl={
          <RefreshControl
            refreshing={credits.isFetching}
            onRefresh={() => void credits.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <H1 className="pt-2">Credits</H1>

        <Card className="gap-1">
          <H3>{creditCount(balance)}</H3>
          <Muted>
            {balance > 0
              ? "One credit publishes one page. Credits never expire."
              : "You'll need a credit to publish a page."}
          </Muted>
        </Card>

        <Card className="gap-2">
          <H3>Buying credits</H3>
          <Body className="text-muted-foreground">
            Buying inside the app is coming. For now you can buy credits on
            pitchpage.co and they'll show up here straight away.
          </Body>
        </Card>

        <View className="gap-2 pt-2">
          <H3>Recent activity</H3>
          {transactions.length === 0 ? (
            <Muted>Nothing here yet.</Muted>
          ) : (
            transactions.map((row) => <LedgerRow key={row.id} row={row} />)
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

function LedgerRow({ row }: { row: CreditTransactionRow }) {
  const sign = row.delta > 0 ? "+" : "";
  return (
    <View className="flex-row items-center justify-between gap-3 border-b border-border py-3">
      <View className="min-w-0 flex-1 gap-0.5">
        <Body numberOfLines={1}>{reasonLabel(row.reason)}</Body>
        <Muted>{relativeTime(row.created_at)}</Muted>
      </View>
      {/* delta 0 is a real row: a company-sponsored publish spends nothing. */}
      {row.delta === 0 ? null : (
        <Body className={row.delta > 0 ? "text-primary" : "text-muted-foreground"}>
          {sign}
          {row.delta}
        </Body>
      )}
    </View>
  );
}
