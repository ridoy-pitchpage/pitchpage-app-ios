import { useState } from "react";
import { Alert, View } from "react-native";

import { Button } from "@/components/Button";
import { Sheet } from "@/components/Sheet";
import { TextField } from "@/components/TextField";
import { Muted } from "@/components/Text";
import { BlockEditor } from "./BlockEditor";
import { useDraft } from "@/state/draft-store";
import type { BlockData, PageSection } from "@/page/page-sections";

/**
 * Editing one section: its name, then its contents.
 *
 * The hint the seed carried is shown as the field's own guidance rather than
 * hidden in a tooltip — on the web it is only ever visible on hover, which does
 * not exist here, so the advice simply never reached a phone user.
 */
export function SectionSheet({
  sectionId,
  onClose,
}: {
  sectionId: string | null;
  onClose: () => void;
}) {
  const page = useDraft((s) => s.page);
  const setSections = useDraft((s) => s.setSections);
  const section = page?.sections.find((s) => s.id === sectionId) ?? null;

  /*
   * The field keeps its own copy of the title so typing stays smooth, and that
   * copy is reset when a DIFFERENT section opens — not whenever the section
   * object changes. It changes constantly: every write rebuilds the sections
   * array, so `section` is a new object on each keystroke, and an effect
   * watching it re-seeded the field from the store on every character typed.
   *
   * Adjusting state during render is React's own answer to "reset state when a
   * prop changes". It re-renders before anything is shown, where an effect
   * would commit the stale value first and then correct it.
   */
  const [title, setTitle] = useState("");
  const [titleFor, setTitleFor] = useState<string | null>(null);

  if (section && titleFor !== section.id) {
    setTitleFor(section.id);
    setTitle(section.title);
  }

  if (!page || !section) return null;

  function write(next: Partial<PageSection>) {
    if (!page || !section) return;
    setSections(page.sections.map((s) => (s.id === section.id ? { ...s, ...next } : s)));
  }

  function remove() {
    if (!page || !section) return;
    const drop = () => {
      setSections(page.sections.filter((s) => s.id !== section.id), { now: true });
      onClose();
    };

    // An empty section goes without asking — there is nothing to lose, and the
    // web does the same.
    const isEmpty = section.title.trim() === "" || Object.keys(section.data ?? {}).length === 0;
    if (isEmpty) {
      drop();
      return;
    }

    Alert.alert("Remove this section?", `"${section.title}" and everything in it will go.`, [
      { text: "Keep it", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: drop },
    ]);
  }

  return (
    <Sheet visible={sectionId != null} onClose={onClose} title={section.title || "Section"}>
      <View className="gap-4 pb-2">
        <TextField
          label="Section name"
          value={title}
          onChangeText={(next) => {
            setTitle(next);
            write({ title: next.slice(0, 80) });
          }}
          maxLength={80}
        />

        {section.hint ? <Muted>{section.hint}</Muted> : null}

        <BlockEditor
          blockType={section.blockType}
          data={section.data}
          onChange={(data: BlockData) => write({ data })}
        />

        <View className="pt-2">
          <Button title="Remove this section" variant="secondary" onPress={remove} />
        </View>

        <Muted>An empty section never shows on your published page.</Muted>
      </View>
    </Sheet>
  );
}
