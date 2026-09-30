import { useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { BackButton } from "@/components/BackButton";
import { Card } from "@/components/Card";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H2, H3, Muted } from "@/components/Text";
import { EmptyState, ErrorState, Loading } from "@/components/States";
import { usePageInsights, useMyPage } from "@/api/queries";
import {
  ANALYTICS_RANGES,
  RANGE_SHORT,
  periodOverPeriodPct,
  previousPeriodLabel,
  type AnalyticsRange,
} from "@/analytics/analytics-range";
import { friendlySourceLabel } from "@/analytics/analytics-sources";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";

/**
 * One page's analytics.
 *
 * The website shows this as a wide dashboard of panels. On a phone it is one
 * column, ordered by what an owner actually opens the screen to find out: did
 * anyone look, were they different people, when, where did they come from, and
 * which of my links is working.
 *
 * Every number is a count of events the public page recorded. Where a rate
 * would be misleading it is not shown — `visitors` and `totals` mean different
 * things (a reload is two views but one visitor) and mixing them is how a
 * "100% watched the video" appears.
 */

/** A horizontal bar. A donut with six labels is unreadable at 390pt. */
function Bar({ pct, tint }: { pct: number; tint: string }) {
  return (
    <View className="h-2 overflow-hidden rounded-full bg-muted">
      <View
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: tint }}
        className="h-full rounded-full"
      />
    </View>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <View className="min-w-0 flex-1 gap-0.5">
      <Muted numberOfLines={1}>{label}</Muted>
      <H2>{value}</H2>
      {note ? <Muted numberOfLines={2}>{note}</Muted> : null}
    </View>
  );
}

/** Views per day, as bars. The tallest day sets the scale. */
function DayChart({ byDay, tint }: { byDay: Array<{ day: string; views: number }>; tint: string }) {
  const max = byDay.reduce((m, d) => Math.max(m, d.views), 0);
  if (max === 0) return null;

  // At most ~30 bars: more than that on a phone is a grey smear.
  const shown = byDay.slice(-30);
  const first = shown[0]?.day;
  const last = shown[shown.length - 1]?.day;
  const dayLabel = (day: string | undefined) =>
    day ? new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";

  return (
    <View
      className="gap-2"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Views per day from ${dayLabel(first)} to ${dayLabel(last)}. Busiest day ${max} views.`}
    >
      <View className="h-24 flex-row items-end gap-0.5">
        {shown.map((day) => (
          <View
            key={day.day}
            style={{
              height: `${Math.max(day.views === 0 ? 2 : 8, (day.views / max) * 100)}%`,
              backgroundColor: tint,
              opacity: day.views === 0 ? 0.25 : 1,
            }}
            className="min-w-0 flex-1 rounded-sm"
          />
        ))}
      </View>
      <View className="flex-row justify-between">
        <Muted>{dayLabel(first)}</Muted>
        <Muted>{dayLabel(last)}</Muted>
      </View>
    </View>
  );
}

function RankedList({
  rows,
  tint,
  empty,
}: {
  rows: Array<{ key: string; label: string; value: number; note?: string }>;
  tint: string;
  empty: string;
}) {
  if (rows.length === 0) return <Muted>{empty}</Muted>;
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0);
  return (
    <View className="gap-3">
      {rows.map((row) => (
        <View key={row.key} className="gap-1">
          <View className="flex-row items-center gap-3">
            <Body className="min-w-0 flex-1 font-body-medium" numberOfLines={1}>
              {row.label}
            </Body>
            <Body className="shrink-0 text-muted-foreground">{row.value}</Body>
          </View>
          <Bar pct={max > 0 ? (row.value / max) * 100 : 0} tint={tint} />
          {row.note ? <Muted>{row.note}</Muted> : null}
        </View>
      ))}
    </View>
  );
}

export default function PageAnalyticsScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const page = useMyPage(id);
  const insights = usePageInsights(id, range);

  const title = page.data?.full_name || "Your page";

  return (
    <Screen edges={["top"]}>
      <ScreenScroll contentClassName="pt-2 gap-5">
        <BackButton />
        <H1 numberOfLines={2}>{title}</H1>

        <View className="flex-row flex-wrap gap-2">
          {ANALYTICS_RANGES.map((option) => {
            const on = option === range;
            return (
              <Pressable
                key={option}
                onPress={() => setRange(option)}
                accessibilityRole="button"
                accessibilityLabel={`Show the last ${RANGE_SHORT[option]}`}
                accessibilityState={{ selected: on }}
                style={{ minHeight: MIN_TAP }}
                className={[
                  "justify-center rounded-control border px-3",
                  on ? "border-foreground bg-foreground" : "border-border bg-card",
                ].join(" ")}
              >
                {/* Colour as a style, not a class — see Text.tsx on why. */}
                <Body
                  className={on ? "font-body-medium" : ""}
                  style={{ color: on ? colors.background : colors.foreground }}
                >
                  {RANGE_SHORT[option]}
                </Body>
              </Pressable>
            );
          })}
        </View>

        {insights.isPending ? <Loading label="Counting…" /> : null}

        {insights.isError ? (
          <ErrorState error={insights.error} onRetry={() => void insights.refetch()} />
        ) : null}

        {insights.data ? <Insights data={insights.data} tint={colors.primary} /> : null}
      </ScreenScroll>
    </Screen>
  );
}

function Insights({
  data,
  tint,
}: {
  data: NonNullable<ReturnType<typeof usePageInsights>["data"]>;
  tint: string;
}) {
  const views = data.totals.view;
  const people = data.visitors.view;
  const delta = periodOverPeriodPct(views, data.previousViews);
  const previousLabel = previousPeriodLabel(data.range);

  if (views === 0) {
    return (
      <EmptyState
        title="No visits in this period"
        body="Share your link and everyone who opens it shows up here. Try a longer period if you published a while ago."
      />
    );
  }

  const videoPlays = data.visitors.video_play;
  const watchedAll = data.visitors.video_100;

  return (
    <View className="gap-5">
      <Card className="flex-row gap-4">
        <Stat
          label="Views"
          value={String(views)}
          note={
            delta != null && previousLabel
              // previousPeriodLabel already begins "vs".
              ? `${delta >= 0 ? "+" : ""}${Math.round(delta)}% ${previousLabel}`
              : undefined
          }
        />
        <Stat
          label="People"
          value={String(people)}
          note={people === 1 ? "one device" : "separate devices"}
        />
      </Card>

      {data.coverage === "capped" ? (
        <Muted>
          This page has more history than one read returns, so the oldest visits in this period
          aren't counted. The shorter periods are exact.
        </Muted>
      ) : null}

      <View className="gap-2">
        <H3>When they came</H3>
        <DayChart byDay={data.byDay} tint={tint} />
      </View>

      {videoPlays > 0 ? (
        <View className="gap-2">
          <H3>Intro video</H3>
          <Muted>
            {videoPlays >= people
              ? `Everyone who opened your page started the video`
              : `${videoPlays} of the ${people} people who opened your page started the video`}
            {watchedAll > 0
              ? watchedAll >= videoPlays
                ? ", and every one of them watched it through."
                : `, and ${watchedAll} watched it through.`
              : "."}
          </Muted>
        </View>
      ) : null}

      <View className="gap-2">
        <H3>Where they came from</H3>
        <RankedList
          tint={tint}
          empty="Nothing recorded a source yet."
          rows={data.sources.slice(0, 6).map((source) => ({
            key: source.host,
            label: friendlySourceLabel(source.host),
            value: source.views,
          }))}
        />
      </View>

      <View className="gap-2">
        <H3>Your tracked links</H3>
        <RankedList
          tint={tint}
          empty="You haven't made any tracked links yet. One per person you send it to tells you who actually opened it."
          rows={data.byRef.map((ref) => ({
            key: ref.refSlug,
            label: ref.label,
            value: ref.views,
            note:
              ref.views === 0
                ? "Not opened yet"
                : `${ref.distinctVisitors} ${ref.distinctVisitors === 1 ? "device" : "devices"}`,
          }))}
        />
      </View>
    </View>
  );
}
