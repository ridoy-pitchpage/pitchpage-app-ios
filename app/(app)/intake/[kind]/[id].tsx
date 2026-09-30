import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/Button";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Select } from "@/components/Select";
import { ErrorState, Loading } from "@/components/States";
import { Body, H1, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { keys, useMyPage } from "@/api/queries";
import { applyPitchKind } from "@/page/apply-kind";
import { PITCH_KINDS, type ListingAudience, type PitchKind } from "@/page/page-types";
import {
  ATHLETE_LEVELS,
  CONTRACTOR_AUDIENCES,
  LISTING_AUDIENCES,
  REAL_ESTATE_AUDIENCES,
  REAL_ESTATE_SPECIALTIES,
  SALES_AUDIENCES,
  SALES_OFFERINGS,
  SCHOOL_TYPES,
  SPORTS,
  TRADES,
  type IntakeAnswers,
} from "@/page/intake-options";

/**
 * The questions a vertical asks before the builder opens.
 *
 * One screen for all six, because the shape is the same every time: one or two
 * choices, then through. The web has six near-identical routes; keeping them
 * apart here would mean six copies of the same save logic.
 *
 * Every list is a sheet rather than the web's inline dropdown — these run to
 * nineteen sports and sixteen trades, and a native list is scrollable, reachable
 * one-handed and readable at the largest text size.
 */

type Copy = { title: string; intro: string; footer: string };

const COPY: Record<string, Copy> = {
  athlete: {
    title: "Athlete pitch",
    intro: "First, tell us your sport and the level you're pitching for. The builder tailors its questions to what coaches and recruiters want to see.",
    footer: "Your athlete sections are already set up — you'll fill them in next. No résumé needed.",
  },
  contractor: {
    title: "Contractor bid",
    intro: "First, tell us who you're bidding to and what trade you work in. The builder tailors its questions to what GCs, owners and RFP reviewers want to see.",
    footer: "No résumé — your contractor-bid sections are already set up for you to fill in.",
  },
  "real-estate": {
    title: "Real estate pitch",
    intro: "First, tell us who you're pitching and what you specialize in. The builder tailors its questions to what clients and brokerages want to see.",
    footer: "No résumé — your real-estate sections are already set up for you to fill in.",
  },
  sales: {
    title: "Sales pitch",
    intro: "First, tell us who you're pitching to and what you're selling. The builder tailors its questions to what buyers want to see.",
    footer: "No résumé — your sales-pitch sections are already set up for you to fill in.",
  },
  listing: {
    title: "Property listing",
    intro: "A page for one property. Who is it for? That decides which sections we set up for you.",
    footer: "No résumé, no interview — you type the property facts and they publish exactly as entered.",
  },
  university: {
    title: "University application",
    intro: "First, tell us what you're applying for. The builder tailors its questions to what admissions committees want to see.",
    footer: "You can add your résumé later to fill out the answers for you.",
  },
};

export default function IntakeScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const page = useMyPage(id);

  const [answers, setAnswers] = useState<IntakeAnswers>({ listingAudience: "buyer" });
  const [busy, setBusy] = useState(false);

  const pitchKind = kind as PitchKind;
  const copy = COPY[pitchKind];

  if (page.isPending) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  /*
   * "job" and "other" are real page types that ask nothing before the builder,
   * so choose-type sends them straight there and never links here. A deep link
   * or an old URL still can, though, and showing "we couldn't open that page
   * type" with a Try again that can never work would be wrong twice over: the
   * type is fine, and there is nothing to retry. Send them where choosing that
   * type would have sent them.
   */
  const isRealKind = (PITCH_KINDS as readonly string[]).includes(pitchKind);
  if (!copy && isRealKind && page.data) {
    return <Redirect href={{ pathname: "/(app)/builder/[id]", params: { id } }} />;
  }

  if (page.isError || !page.data || !copy) {
    return (
      <Screen>
        <ScreenScroll contentClassName="pt-2 gap-4">
          <BackButton />
          <ErrorState
            error={page.error ?? new Error("We couldn't open that page type.")}
            onRetry={page.isError ? () => void page.refetch() : undefined}
          />
        </ScreenScroll>
      </Screen>
    );
  }

  const row = page.data;
  const set = (patch: IntakeAnswers) => setAnswers((current) => ({ ...current, ...patch }));

  /** Whether enough has been answered to go on. */
  function ready(): boolean {
    switch (pitchKind) {
      case "athlete":
        return Boolean(answers.sport && answers.level);
      case "contractor":
        return Boolean(answers.audience && answers.trade);
      case "real-estate":
        return Boolean(answers.audience && answers.specialty);
      case "sales":
        return Boolean(answers.audience && answers.offering);
      case "listing":
        return Boolean(answers.listingAudience);
      case "university":
        return Boolean(answers.schoolType) || answers.skipped === true;
      default:
        return true;
    }
  }

  async function go(withAnswers: IntakeAnswers) {
    setBusy(true);
    try {
      await applyPitchKind(row, pitchKind, withAnswers);
      await queryClient.invalidateQueries({ queryKey: keys.page(row.id) });
      await queryClient.invalidateQueries({ queryKey: keys.pages });
      router.replace({ pathname: "/(app)/builder/[id]", params: { id: row.id } });
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScreenScroll contentClassName="pt-2 gap-5">
          <BackButton />

          <View className="gap-2">
            <H1>{copy.title}</H1>
            <Body className="text-muted-foreground">{copy.intro}</Body>
          </View>

          <View className="gap-4">
            {pitchKind === "athlete" ? (
              <>
                <Select
                  label="What sport do you play?"
                  placeholder="Select a sport"
                  value={answers.sport ?? null}
                  options={SPORTS}
                  onChange={(sport) => set({ sport })}
                />
                <Select
                  label="What level are you pitching for?"
                  placeholder="Select a level"
                  value={answers.level ?? null}
                  options={ATHLETE_LEVELS}
                  onChange={(level) => set({ level })}
                />
              </>
            ) : null}

            {pitchKind === "contractor" ? (
              <>
                <Select
                  label="Who are you bidding to?"
                  value={answers.audience ?? null}
                  options={CONTRACTOR_AUDIENCES}
                  onChange={(audience) => set({ audience })}
                />
                <Select
                  label="What's your trade?"
                  placeholder="Select a trade"
                  value={answers.trade ?? null}
                  options={TRADES}
                  onChange={(trade) => set({ trade })}
                />
              </>
            ) : null}

            {pitchKind === "real-estate" ? (
              <>
                <Select
                  label="Who are you pitching to?"
                  value={answers.audience ?? null}
                  options={REAL_ESTATE_AUDIENCES}
                  onChange={(audience) => set({ audience })}
                />
                <Select
                  label="What do you specialize in?"
                  placeholder="Select a specialty"
                  value={answers.specialty ?? null}
                  options={REAL_ESTATE_SPECIALTIES}
                  onChange={(specialty) => set({ specialty })}
                />
              </>
            ) : null}

            {pitchKind === "sales" ? (
              <>
                <Select
                  label="Who are you pitching to?"
                  value={answers.audience ?? null}
                  options={SALES_AUDIENCES}
                  onChange={(audience) => set({ audience })}
                />
                <Select
                  label="What are you selling?"
                  placeholder="Select an offering"
                  value={answers.offering ?? null}
                  options={SALES_OFFERINGS}
                  onChange={(offering) => set({ offering })}
                />
              </>
            ) : null}

            {pitchKind === "listing" ? (
              <View className="gap-3">
                <Body className="font-body-medium">Who is this listing page for?</Body>
                {LISTING_AUDIENCES.map((option) => {
                  const selected = answers.listingAudience === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => set({ listingAudience: option.value as ListingAudience })}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${option.label}. ${option.hint ?? ""}`}
                      className={[
                        "gap-1 rounded-card border p-4",
                        selected ? "border-primary bg-card" : "border-border bg-card",
                      ].join(" ")}
                    >
                      <Body className="font-body-bold">{option.label}</Body>
                      {option.hint ? <Muted>{option.hint}</Muted> : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {pitchKind === "university" ? (
              <>
                <Select
                  label="What type of school are you applying for?"
                  placeholder="Select a type"
                  value={answers.schoolType ?? null}
                  options={SCHOOL_TYPES}
                  onChange={(schoolType) => set({ schoolType, skipped: false })}
                />
                {answers.schoolType === "undergraduate" ? (
                  <TextField
                    label="What major are you applying for?"
                    hint="Optional — leave it blank if you're still deciding."
                    value={answers.major ?? ""}
                    onChangeText={(major) => set({ major })}
                    maxLength={80}
                    placeholder="e.g. Computer Science"
                  />
                ) : null}
              </>
            ) : null}
          </View>

          <View className="gap-3">
            <Button
              title="Continue"
              loading={busy}
              disabled={!ready()}
              onPress={() => void go(answers)}
            />
            {pitchKind === "university" ? (
              <Button
                title="Skip for now"
                variant="ghost"
                disabled={busy}
                onPress={() => void go({ ...answers, skipped: true })}
              />
            ) : null}
          </View>

          <Muted className="text-center">{copy.footer}</Muted>
        </ScreenScroll>
      </KeyboardAvoidingView>
    </Screen>
  );
}
