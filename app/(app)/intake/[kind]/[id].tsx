import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react-native";

import { ActionBar } from "@/components/ActionBar";
import { Button } from "@/components/Button";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Select } from "@/components/Select";
import { ErrorState, Loading } from "@/components/States";
import { Body, H1, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { useColors } from "@/theme/ThemeProvider";
import { keys, useMyPage } from "@/api/queries";
import { applyPitchKind, savedListingAudience } from "@/page/apply-kind";
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
    intro: "Choose your sport and target level. We’ll set up the sections coaches and recruiters expect.",
    footer: "Your athlete sections are already set up — you'll fill them in next. No resume needed.",
  },
  contractor: {
    title: "Contractor bid",
    intro: "Choose your trade and who you’re bidding to. We’ll start with sections that fit your work.",
    footer: "No resume — your contractor-bid sections are already set up for you to fill in.",
  },
  "real-estate": {
    title: "Real estate pitch",
    intro: "Tell us who you’re pitching and what you specialize in to give your page the right starting point.",
    footer: "No resume — your real-estate sections are already set up for you to fill in.",
  },
  sales: {
    title: "Sales pitch",
    intro: "Choose your audience and what you’re selling. We’ll start with sections that support your pitch.",
    footer: "No resume — your sales-pitch sections are already set up for you to fill in.",
  },
  listing: {
    title: "Property listing",
    intro: "A page for one property. Who is it for? That decides which sections we set up for you.",
    footer: "No resume, no interview — you type the property facts and they publish exactly as entered.",
  },
  university: {
    title: "University application",
    intro: "Tell us what you’re applying for. We’ll start with sections that fit your application.",
    footer: "You can add a downloadable resume on the next screen.",
  },
};

export default function IntakeScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const toast = useToast();
  const colors = useColors();
  const queryClient = useQueryClient();
  const page = useMyPage(id);

  const [edits, setAnswers] = useState<IntakeAnswers>({});
  const answers: IntakeAnswers = {
    listingAudience: savedListingAudience(page.data?.wizard_meta),
    ...edits,
  };
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
      // The CV and links step comes next, then the builder.
      router.replace({ pathname: "/(app)/build/[id]", params: { id: row.id } });
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScreenScroll contentClassName="pt-2 gap-5">
          <View className="flex-row items-center justify-between gap-3">
            <BackButton />
            <Muted className="min-w-0 flex-1 text-right font-body-bold text-[12px]" style={{ color: colors.link }}>
              SET UP YOUR PAGE · 3 OF 3
            </Muted>
          </View>

          <View className="gap-3">
            <View className="flex-row gap-1.5" accessibilityRole="progressbar"
              accessibilityLabel="Content. Step 3 of 3: page type, design, content."
              accessibilityValue={{ min: 1, max: 3, now: 3 }}>
              {[0, 1, 2].map((step) => <View key={step} className="h-1 flex-1 rounded-full"
                style={{ backgroundColor: colors.primary }} />)}
            </View>
            <H1>{copy.title}</H1>
            <Muted>{copy.intro}</Muted>
          </View>

          <View className="gap-5 rounded-card border border-border bg-card p-4">
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
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={`${option.label}. ${option.hint ?? ""}`}
                      className={[
                        "flex-row items-center gap-3 rounded-control border p-4",
                        selected ? "border-primary bg-card" : "border-border bg-card",
                      ].join(" ")}
                    >
                      <View className="h-6 w-6 items-center justify-center rounded-full border"
                        style={{ borderColor: selected ? colors.primary : colors.input,
                          backgroundColor: selected ? colors.primary : undefined }}>
                        {selected ? <Check size={16} color={colors.primaryForeground} /> : null}
                      </View>
                      <View className="min-w-0 flex-1 gap-1">
                        <Body className="font-body-bold">{option.label}</Body>
                        {option.hint ? <Muted>{option.hint}</Muted> : null}
                      </View>
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

          <Muted>{copy.footer}</Muted>
        </ScreenScroll>

        <ActionBar safeBottom className="gap-2">
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
        </ActionBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
