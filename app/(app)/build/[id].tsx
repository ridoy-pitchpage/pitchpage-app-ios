import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { BriefcaseBusiness, FileText, Globe2, Sparkles, Trash2, Upload } from "lucide-react-native";

import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H3, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { ErrorState, Loading } from "@/components/States";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/components/Toast";
import { keys, useMyPage } from "@/api/queries";
import { savePage } from "@/api/supabase-direct";
import { MEDIA_LIMITS, removeMedia, tooLargeMessage, uploadMedia } from "@/features/media/upload";
import { useColors } from "@/theme/ThemeProvider";
import type { Json } from "@/api/database.types";

/**
 * The last step before the builder: what the page is made from.
 *
 * The website's wizard takes a résumé, has AI read it, and composes a first
 * draft — so the person edits something rather than facing empty fields. This
 * step is the app's version of that: the CV, the links worth carrying over,
 * and the button that turns them into a page.
 *
 * The AI compose itself is server work. It reads LOVABLE_API_KEY, which is a
 * server secret, and an app that shipped with that key in its bundle would be
 * handing it to anyone who downloaded the app. So the button explains what it
 * is waiting for rather than pretending, and "Build it myself" — which works
 * today — is the other half of the choice rather than a consolation.
 *
 * Everything typed here is saved either way, so when the endpoint lands it has
 * the CV and the links already sitting on the page.
 */

const RESUME_EXTENSIONS = ["pdf", "doc", "docx"];

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
  const [busy, setBusy] = useState<"resume" | "save" | null>(null);

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
  const savedPrompt =
    row.wizard_meta &&
    typeof row.wizard_meta === "object" &&
    !Array.isArray(row.wizard_meta) &&
    typeof row.wizard_meta.app_build_prompt === "string"
      ? row.wizard_meta.app_build_prompt
      : "";
  const promptValue = prompt ?? savedPrompt;

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
      const size = asset.size ?? new File(asset.uri).size ?? 0;
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

  /** Save what is on this screen, then open the builder. */
  async function saveAndBuild() {
    setBusy("save");
    try {
      await savePage(
        row.id,
        {
          linkedin_url: linkedinValue.trim() || null,
          primary_cta_url: portfolioValue.trim() || null,
          wizard_meta: withBuildPrompt(row.wizard_meta, promptValue),
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

  async function buildWithAi() {
    await confirm({
      title: "AI build is coming",
      message:
        "This will read your CV and links and write a first draft of the whole page for you. It runs on PitchPage's servers, so it needs an endpoint the app can call — it isn't switched on yet. Your CV and links are saved, so it will have them the moment it is. In the meantime you can build the page yourself; every section is one tap.",
      confirmLabel: "Build it myself",
      dismissOnly: true,
    });
    await saveAndBuild();
  }

  return (
    <Screen edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScreenScroll contentClassName="pt-2 gap-5">
          <BackButton />

          <View className="gap-2">
            <H1>What should we build from?</H1>
            <Muted>
              Tell us what you want, then add anything useful. You can change all of it later.
            </Muted>
          </View>

          <Card className="gap-3">
            <View className="flex-row items-center gap-2">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-secondary">
                <Sparkles size={18} color={colors.link} />
              </View>
              <View className="flex-1">
                <H3>Describe the page you want</H3>
                <Muted className="text-[12px]">Give AI a clear direction.</Muted>
              </View>
            </View>
            <TextField
              value={promptValue}
              onChangeText={setPrompt}
              multiline
              minHeight={144}
              maxLength={600}
              placeholder="Example: Build a confident page for product design roles. Highlight my mobile work, leadership, and strongest case study."
              accessibilityLabel="Describe the page you want"
            />
            <Muted className="text-right">{promptValue.length}/600</Muted>
          </Card>

          <Card className="gap-3">
            <H3>Your CV</H3>
            <Muted>PDF or Word. It becomes the résumé people can download from your page.</Muted>

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

          <Card className="gap-3">
            <H3>Your links</H3>
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

        <View className="gap-2 border-t border-border bg-card px-4 py-3">
          <Button
            title="Build my page with AI"
            loading={busy === "save"}
            icon={<Sparkles size={17} color={colors.primaryForeground} />}
            onPress={() => void buildWithAi()}
          />
          <Button
            title="Build it myself"
            variant="secondary"
            onPress={() => void saveAndBuild()}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function withBuildPrompt(meta: Json, prompt: string): Json {
  const base = meta && typeof meta === "object" && !Array.isArray(meta) ? meta : {};
  return { ...base, app_build_prompt: prompt.trim() };
}
