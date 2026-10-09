import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { BriefcaseBusiness, FileText, Globe2, MessageSquareText, Trash2, Upload } from "lucide-react-native";

import { ActionBar } from "@/components/ActionBar";
import { BackButton } from "@/components/BackButton";
import { fileSize } from "@/features/media/local-file";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H3, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { BlockLoader } from "@/components/BlockLoader";
import { ErrorState, Loading } from "@/components/States";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/components/Toast";
import { keys, useMyPage } from "@/api/queries";
import { AppApiError, appApiPost } from "@/api/app-api";
import { savePage } from "@/api/supabase-direct";
import { ConsentSheet } from "@/features/ai/ConsentSheet";
import { hasAiConsent, recordAiConsent } from "@/features/ai/consent";
import {
  MEDIA_LIMITS,
  removeMedia,
  storagePathFromUrl,
  tooLargeMessage,
  uploadMedia,
} from "@/features/media/upload";
import { applyComposedToPage, withUnconfirmed, type ComposeResultToApply } from "@/page/apply-composed";
import { currentPitchKind, savedListingAudience } from "@/page/apply-kind";
import { sectionsToBuild } from "@/page/build-sections";
import { clampSections } from "@/page/page-sections";
import { useColors } from "@/theme/ThemeProvider";

/**
 * The last step before the builder: what the page is made from.
 *
 * The website's material step, on a phone. The person tells us about
 * themselves and adds a CV, and "Build my page" has AI write a first draft
 * into the sections their page type set up, so they edit something rather
 * than facing empty fields. The AI runs on the website
 * (POST /api/app/v1/ai/compose-sections, the same composeIntoSections the
 * website calls), and the draft is applied by the website's own rule
 * (src/page/apply-composed.ts): only empty sections the person hasn't written
 * in, only blank basics. Building by hand stays one tap away.
 */

const RESUME_EXTENSIONS = ["pdf", "doc", "docx"];

/** The website's limits (web: src/lib/wizard-meta.ts, MaterialStep). */
const MAX_BUILD_PROMPT = 4000;
/** Below this a prompt alone can't build anything; the server refuses under 40 characters of material. */
const MIN_PROMPT_TO_BUILD = 40;

type ComposeResult = ComposeResultToApply & { unreadable: string[] };

/** wizard_meta as this screen reads and writes it: an object, whatever was stored. */
function metaObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export default function BuildScreen() {
  const colors = useColors();
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const page = useMyPage(id);

  const [linkedin, setLinkedin] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [busy, setBusy] = useState<"resume" | "save" | "build" | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const building = useRef<AbortController | null>(null);

  if (page.isPending) {
    return (
      <Screen>
        <Loading label="Loading your page…" />
      </Screen>
    );
  }

  if (page.isError || !page.data) {
    return (
      <Screen>
        <ScreenScroll contentClassName="pt-2 gap-4">
          <BackButton />
          <ErrorState error={page.error} onRetry={() => void page.refetch()} />
        </ScreenScroll>
      </Screen>
    );
  }

  const row = page.data;
  // Null means "not edited on this screen yet", so the field shows what is
  // already saved without overwriting it with a stale empty string.
  const linkedinValue = linkedin ?? row.linkedin_url ?? "";
  const portfolioValue = portfolio ?? row.primary_cta_url ?? "";
  const meta = metaObject(row.wizard_meta);
  const promptValue = prompt ?? (typeof meta.buildPrompt === "string" ? meta.buildPrompt : "");
  const sections = clampSections(row.sections);
  const resumePath = row.resume_url ? storagePathFromUrl("resume", row.resume_url) : null;
  const canBuild =
    sections.length > 0 && (promptValue.trim().length >= MIN_PROMPT_TO_BUILD || resumePath != null);

  async function pickResume() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      copyToCacheDirectory: true,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;

    const ext = (asset.name.split(".").pop() ?? "pdf").toLowerCase();
    if (!RESUME_EXTENSIONS.includes(ext)) {
      toast.error(new Error("A CV needs to be a PDF or a Word document."));
      return;
    }

    setBusy("resume");
    try {
      const size = asset.size ?? (await fileSize(asset.uri));
      if (size > MEDIA_LIMITS.documentBytes) {
        toast.error(new Error(tooLargeMessage("document")));
        return;
      }
      const { url } = await uploadMedia({
        kind: "resume",
        pageId: row.id,
        uri: asset.uri,
        ext,
        contentType: asset.mimeType ?? "application/pdf",
        replaces: row.resume_url,
      });
      await savePage(row.id, { resume_url: url }, row.updated_at);
      await queryClient.invalidateQueries({ queryKey: keys.page(row.id) });
      toast.success("CV added");
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(null);
    }
  }

  async function removeResume() {
    const ok = await confirm({
      title: "Remove your CV?",
      message: "You can upload another one any time.",
      confirmLabel: "Remove",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (!ok) return;
    const previous = row.resume_url;
    await savePage(row.id, { resume_url: null }, row.updated_at);
    await queryClient.invalidateQueries({ queryKey: keys.page(row.id) });
    if (previous) await removeMedia("resume", [previous]);
  }

  /** Build my page: consent first, once per account. */
  async function startBuild() {
    if (!canBuild || busy) return;
    try {
      if (await hasAiConsent()) await build();
      else setConsentOpen(true);
    } catch (error) {
      toast.error(error);
    }
  }

  async function allowAi() {
    setConsentBusy(true);
    try {
      await recordAiConsent();
      setConsentOpen(false);
      await build();
    } catch (error) {
      toast.error(error);
    } finally {
      setConsentBusy(false);
    }
  }

  /**
   * Ask the website for a draft, apply it by the website's rule, and save it
   * with this screen's links in one write, so nothing on this screen is lost
   * and the page's version check covers all of it.
   */
  async function build() {
    const controller = new AbortController();
    building.current = controller;
    setBusy("build");
    try {
      const brief = promptValue.trim().slice(0, MAX_BUILD_PROMPT);
      // A template's untouched examples are not the person's writing, so the
      // draft may replace them; without this the website's apply rule saw
      // every section as written and kept none of the draft (build-sections.ts).
      const target = sectionsToBuild(sections, currentPitchKind(row.wizard_meta), row.email ?? "", {
        listingAudience: savedListingAudience(row.wizard_meta),
      });
      const result = await appApiPost<ComposeResult>(
        "/ai/compose-sections",
        {
          pitchPageId: row.id,
          sections: target.map((s) => ({ id: s.id, title: s.title, blockType: s.blockType, hint: s.hint ?? "" })),
          documents: resumePath ? [{ path: resumePath, bucket: "resumes", name: "Your CV" }] : [],
          promptText: brief,
          roleHint: typeof meta.jobTarget === "string" ? meta.jobTarget : "",
          pitchKind: typeof meta.pitchKind === "string" ? meta.pitchKind : "",
        },
        { signal: controller.signal },
      );

      const applied = applyComposedToPage(
        { sections: target, full_name: row.full_name, headline: row.headline, bio: row.bio },
        stringList(meta.edited),
        result,
      );
      await savePage(
        row.id,
        {
          ...applied.basics,
          sections: applied.sections,
          linkedin_url: linkedinValue.trim() || null,
          primary_cta_url: portfolioValue.trim() || null,
          wizard_meta: {
            ...meta,
            buildPrompt: brief,
            ...(applied.appliedDrafts.length > 0
              ? { unconfirmed: withUnconfirmed(stringList(meta.unconfirmed), applied.appliedDrafts) }
              : {}),
          },
        },
        row.updated_at,
      );
      await queryClient.invalidateQueries({ queryKey: keys.page(row.id) });
      await queryClient.invalidateQueries({ queryKey: keys.pages });
      if (result.unreadable.length > 0) {
        toast.error(new Error("We couldn't read your CV, so your draft is built from what you typed."));
      } else {
        toast.success("Your first draft is ready");
      }
      router.replace({ pathname: "/(app)/builder/[id]", params: { id: row.id } });
    } catch (error) {
      // Cancelled by the person: nothing to say. A timeout is not a cancel.
      const timedOut = error instanceof AppApiError && error.code === "TIMEOUT";
      if (controller.signal.aborted && !timedOut) return;
      toast.error(error);
    } finally {
      building.current = null;
      setBusy(null);
    }
  }

  /** Save what is on this screen, then open the builder. */
  async function saveAndBuild() {
    setBusy("save");
    try {
      await savePage(
        row.id,
        {
          linkedin_url: linkedinValue.trim() || null,
          primary_cta_url: portfolioValue.trim() || null,
        },
        row.updated_at,
      );
      await queryClient.invalidateQueries({ queryKey: keys.page(row.id) });
      await queryClient.invalidateQueries({ queryKey: keys.pages });
      router.replace({ pathname: "/(app)/builder/[id]", params: { id: row.id } });
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(null);
    }
  }

  if (busy === "build") {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <BlockLoader mode="build" label="Building your page…" />
          <Muted className="text-center">
            This takes about 30 seconds. Your draft goes into the sections your page already has.
          </Muted>
          {/* A Button that isn't full width pins itself to the start; this
              wrapper is what the centred column centres. */}
          <View>
            <Button
              title="Cancel"
              variant="secondary"
              fullWidth={false}
              onPress={() => building.current?.abort()}
            />
          </View>
        </View>
      </Screen>
    );
  }

  const promptLength = promptValue.length;

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
            <H1>Add the essentials</H1>
            <Muted>
              Tell us about yourself and add your CV, and we'll write a first draft you can change.
            </Muted>
          </View>

          <Card flat className="gap-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-control bg-secondary">
                <MessageSquareText size={20} color={colors.link} strokeWidth={1.8} />
              </View>
              <View className="min-w-0 flex-1">
                <H3>Tell us about yourself</H3>
                <Muted className="text-[12px]">Who you are, and who this page is for</Muted>
              </View>
            </View>
            <TextField
              label="About you"
              value={promptValue}
              onChangeText={setPrompt}
              multiline
              minHeight={132}
              maxLength={MAX_BUILD_PROMPT}
              placeholder="Who you are, what you do, and who this page is for — e.g. I run a commercial electrical contractor in Dallas doing hospital and data-centre fit-outs, mostly as a sub to large GCs. This page is for RFP reviewers; lead with our safety record and the size of jobs we take on."
              hint={
                // Only once it matters: maxLength stops the typing, so the
                // limit must be visible before it bites.
                promptLength > MAX_BUILD_PROMPT * 0.75 ? `${promptLength} / ${MAX_BUILD_PROMPT}` : undefined
              }
            />
          </Card>

          <Card flat className="gap-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-control bg-secondary">
                <FileText size={20} color={colors.link} strokeWidth={1.8} />
              </View>
              <View className="min-w-0 flex-1">
                <H3>Your CV</H3>
                <Muted className="text-[12px]">Optional</Muted>
              </View>
            </View>
            <Muted>PDF or Word. It becomes the resume people can download from your page.</Muted>

            {row.resume_url ? (
              <View className="flex-row items-center gap-3">
                <FileText size={20} color={colors.primary} />
                <Body className="min-w-0 flex-1">CV added</Body>
                <Button
                  title="Remove"
                  variant="secondary"
                  fullWidth={false}
                  icon={<Trash2 size={16} color={colors.destructive} />}
                  onPress={() => void removeResume()}
                />
              </View>
            ) : (
              <Button
                title="Upload your CV"
                variant="secondary"
                loading={busy === "resume"}
                icon={<Upload size={17} color={colors.foreground} />}
                onPress={() => void pickResume()}
              />
            )}
          </Card>

          <Card flat className="gap-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-control bg-secondary">
                <Globe2 size={20} color={colors.link} strokeWidth={1.8} />
              </View>
              <View className="min-w-0 flex-1">
                <H3>Your links</H3>
                <Muted className="text-[12px]">Where people can find more</Muted>
              </View>
            </View>
            <TextField
              label="LinkedIn"
              icon={<BriefcaseBusiness size={18} color={colors.mutedForeground} />}
              value={linkedinValue}
              onChangeText={setLinkedin}
              placeholder="linkedin.com/in/you"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TextField
              label="Portfolio or website"
              icon={<Globe2 size={18} color={colors.mutedForeground} />}
              value={portfolioValue}
              onChangeText={setPortfolio}
              placeholder="yoursite.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </Card>
        </ScreenScroll>

        <ActionBar safeBottom className="gap-2">
          {!canBuild ? (
            <Muted className="text-center">
              Tell us about yourself, or add your CV, and this turns on.
            </Muted>
          ) : null}
          <Button
            title="Build my page"
            disabled={!canBuild || busy != null}
            onPress={() => void startBuild()}
          />
          <Button
            title="I'll fill it in myself"
            variant="ghost"
            loading={busy === "save"}
            disabled={busy === "resume"}
            onPress={() => void saveAndBuild()}
          />
        </ActionBar>
      </KeyboardAvoidingView>

      <ConsentSheet
        visible={consentOpen}
        busy={consentBusy}
        onAllow={() => void allowAi()}
        onNotNow={() => setConsentOpen(false)}
      />
    </Screen>
  );
}
