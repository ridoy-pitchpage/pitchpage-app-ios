import { useState } from "react";
import { Pressable, View } from "react-native";
import { ChevronDown, ChevronUp, Plus } from "lucide-react-native";

import { Sheet } from "@/components/Sheet";
import { Body, Muted } from "@/components/Text";
import { useDraft } from "@/state/draft-store";
import { blockIsEmpty, MAX_SECTIONS, type PageSection } from "@/page/page-sections";
import { PRESET_GROUPS, SECTION_PRESETS, sectionFromPreset } from "@/page/section-library";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";

/** Reordering, adding and opening sections. */
export function SectionsSheet({
  visible,
  onClose,
  onEditSection,
  /** Open straight on the list of sections to add, skipping the summary. */
  startOnAdd = false,
}: {
  visible: boolean;
  onClose: () => void;
  onEditSection: (section: PageSection) => void;
  startOnAdd?: boolean;
}) {
  const colors = useColors();
  const page = useDraft((s) => s.page);
  const setSections = useDraft((s) => s.setSections);
  const [adding, setAdding] = useState(false);
  const [wasVisible, setWasVisible] = useState(false);

  /*
   * Each opening decides for itself which pane to show, so arriving from the
   * page's own "Add a section" goes straight to the picker while the toolbar
   * button still opens the summary. Resetting on open also fixes a smaller
   * thing: closing from the picker used to leave it there, so the next
   * opening showed the add list instead of the sections.
   */
  if (visible !== wasVisible) {
    setWasVisible(visible);
    setAdding(visible ? startOnAdd : false);
  }

  if (!page) return null;

  const sections = [...page.sections].sort((a, b) => a.order - b.order);
  const atMax = sections.length >= MAX_SECTIONS;

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved as PageSection);
    setSections(next);
  }

  return (
    <>
      <Sheet visible={visible && !adding} onClose={onClose} title="Your sections">
        <Muted className="pb-1">
          {sections.length} of {MAX_SECTIONS}. Tap one to edit it. An empty section never shows on
          your published page.
        </Muted>

        {sections.map((section, index) => {
          const empty = blockIsEmpty(section.blockType, section.data);
          return (
            <View
              key={section.id}
              className="flex-row items-center gap-1 border-b border-border"
              style={{ minHeight: 56 }}
            >
              <Pressable
                onPress={() => {
                  onClose();
                  onEditSection(section);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${section.title || "untitled section"}${empty ? ", empty" : ""}`}
                style={{ minHeight: MIN_TAP }}
                className="min-w-0 flex-1 justify-center gap-0.5 py-2"
              >
                <Body numberOfLines={1}>{section.title || "Untitled section"}</Body>
                {empty ? <Muted>Empty</Muted> : null}
              </Pressable>

              <Pressable
                onPress={() => move(index, -1)}
                disabled={index === 0}
                accessibilityRole="button"
                accessibilityLabel={`Move ${section.title} up`}
                accessibilityState={{ disabled: index === 0 }}
                style={{ minHeight: MIN_TAP, minWidth: MIN_TAP }}
                className={["items-center justify-center", index === 0 ? "opacity-30" : ""].join(" ")}
              >
                <ChevronUp size={20} color={colors.foreground} />
              </Pressable>

              <Pressable
                onPress={() => move(index, 1)}
                disabled={index === sections.length - 1}
                accessibilityRole="button"
                accessibilityLabel={`Move ${section.title} down`}
                accessibilityState={{ disabled: index === sections.length - 1 }}
                style={{ minHeight: MIN_TAP, minWidth: MIN_TAP }}
                className={[
                  "items-center justify-center",
                  index === sections.length - 1 ? "opacity-30" : "",
                ].join(" ")}
              >
                <ChevronDown size={20} color={colors.foreground} />
              </Pressable>
            </View>
          );
        })}

        <Pressable
          onPress={() => setAdding(true)}
          disabled={atMax}
          accessibilityRole="button"
          accessibilityLabel="Add a section"
          accessibilityState={{ disabled: atMax }}
          style={{ minHeight: MIN_TAP }}
          className={[
            "mt-3 flex-row items-center justify-center gap-2 rounded-control border border-dashed border-border",
            atMax ? "opacity-40" : "",
          ].join(" ")}
        >
          <Plus size={16} color={colors.primary} />
          <Body className="text-link">
            {atMax ? `You have the maximum of ${MAX_SECTIONS}` : "Add a section"}
          </Body>
        </Pressable>
      </Sheet>

      <Sheet visible={adding} onClose={() => setAdding(false)} title="Add a section">
        <Muted className="pb-1">
          It arrives empty, ready for you to fill in, and stays off your published page until you do.
        </Muted>

        {PRESET_GROUPS.map((group) => (
          <View key={group} className="gap-1 pt-3">
            <Muted className="uppercase">{group}</Muted>
            {SECTION_PRESETS.filter((preset) => preset.group === group).map((preset) => (
              <Pressable
                key={preset.id}
                onPress={() => {
                  setSections([...sections, sectionFromPreset(preset, sections.length)], { now: true });
                  setAdding(false);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={`${preset.title}. ${preset.about}`}
                style={{ minHeight: 56 }}
                className="justify-center gap-0.5 border-b border-border py-2"
              >
                <Body>{preset.title}</Body>
                <Muted>{preset.about}</Muted>
              </Pressable>
            ))}
          </View>
        ))}
      </Sheet>
    </>
  );
}
