import { useCallback, useState } from "react";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/Toast";
import { keys } from "@/api/queries";
import { savePage, type SavePagePatch } from "@/api/supabase-direct";
import { currentPitchKind, hasSectionContent } from "@/page/apply-kind";
import { clampSections, type PageSection } from "@/page/page-sections";
import { freshId } from "@/page/page-types";
import { TEMPLATE_SEEDS } from "@/page/template-seeds";
import {
  DEFAULT_TEMPLATE,
  STYLE_FAMILIES,
  encodeStyleSelection,
  resolveStyle,
} from "@/page/style-families";

/**
 * Save a template choice, then go wherever the page goes next.
 *
 * Two screens end here — the picker's grid and the preview of a single
 * template — and the part that is easy to get subtly different in two copies is
 * the routing: kinds that ask their own questions go to intake first, the rest
 * straight to the CV and links. Keeping the colour and mode off the stored
 * string is the other half: picking a template changes the layout only, so the
 * page keeps the colour it already had unless the family has no say in it.
 */

/** Just the columns this needs, so either screen's row satisfies it. */
type TemplateTarget = {
  id: string;
  template: string | null;
  updated_at: string | null;
  wizard_meta: unknown;
  sections: unknown;
  portrait_url: string | null;
};

/**
 * The family's sample content, with ids of its own.
 *
 * Fresh ids rather than the website's: two pages seeded from the same
 * family would otherwise carry the same section ids, and section-level
 * analytics key on them.
 */
function seedSections(familyId: string): PageSection[] | null {
  const seed = TEMPLATE_SEEDS[familyId];
  if (!seed?.sections.length) return null;
  return seed.sections.map((section, index) => ({
    id: freshId(),
    title: section.title,
    blockType: section.blockType,
    data: section.data,
    order: index,
    visible: true,
  }));
}

export function useApplyTemplate(row: TemplateTarget) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const apply = useCallback(
    async (familyId: string) => {
      const current = resolveStyle(row.template);
      const family = STYLE_FAMILIES.find((f) => f.id === familyId) ?? current.family;

      // A page still on the starting style is not carrying a colour anyone
      // chose, so it takes the family's own. Otherwise picking Pitch Deck —
      // whose sample is green — left the page the default blue, and the
      // screen after looked like nothing had happened.
      //
      // A colour someone did pick is kept: choosing a template changes the
      // layout, not their mind about the colour.
      const untouched = !row.template || row.template === DEFAULT_TEMPLATE;
      const colorId = untouched ? family.defaultColor : current.color.id;
      const mode = untouched
        ? family.defaultMode
        : family.supportsMode
          ? current.mode
          : family.defaultMode;

      // A template arrives with its own example content, but only onto a page
      // that has none. Anything typed already outranks a sample, and a second
      // trip through the picker must never overwrite it.
      const seeded = hasSectionContent(clampSections(row.sections))
        ? null
        : seedSections(family.id);
      const seedPortrait = TEMPLATE_SEEDS[family.id]?.portraitUrl ?? null;

      setBusy(true);
      try {
        await savePage(
          row.id,
          {
            template: encodeStyleSelection(family.id, colorId, mode),
            ...(seeded
              ? { sections: seeded as unknown as SavePagePatch["sections"] }
              : {}),
            // Only where the sample has a portrait the site actually serves,
            // and only when the page has none of its own.
            ...(seeded && seedPortrait && !row.portrait_url
              ? { portrait_url: seedPortrait }
              : {}),
          },
          row.updated_at,
        );
        await queryClient.invalidateQueries({ queryKey: keys.page(row.id) });
        await queryClient.invalidateQueries({ queryKey: keys.pages });

        const kind = currentPitchKind(row.wizard_meta);
        if (kind && kind !== "job" && kind !== "other") {
          router.push({ pathname: "/(app)/intake/[kind]/[id]", params: { kind, id: row.id } });
        } else {
          router.push({ pathname: "/(app)/build/[id]", params: { id: row.id } });
        }
      } catch (error) {
        toast.error(error);
      } finally {
        setBusy(false);
      }
    },
    [
      queryClient,
      row.id,
      row.portrait_url,
      row.sections,
      row.template,
      row.updated_at,
      row.wizard_meta,
      toast,
    ],
  );

  return { apply, busy };
}
