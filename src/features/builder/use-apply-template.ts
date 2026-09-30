import { useCallback, useState } from "react";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/Toast";
import { keys } from "@/api/queries";
import { savePage } from "@/api/supabase-direct";
import { currentPitchKind } from "@/page/apply-kind";
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
};

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

      setBusy(true);
      try {
        await savePage(
          row.id,
          {
            template: encodeStyleSelection(family.id, colorId, mode),
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
    [queryClient, row.id, row.template, row.updated_at, row.wizard_meta, toast],
  );

  return { apply, busy };
}
