import { useState } from "react";
import { View } from "react-native";

import { Button } from "@/components/Button";
import { useConfirm } from "@/components/Confirm";
import { Sheet } from "@/components/Sheet";
import { TextField } from "@/components/TextField";
import { Muted } from "@/components/Text";
import { useToast } from "@/components/Toast";
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
  const confirm = useConfirm();
  const toast = useToast();
  const page = useDraft((s) => s.page);
  const setSections = useDraft((s) => s.setSections);
  const flush = useDraft((s) => s.flush);
  const section = page?.sections.find((s) => s.id === sectionId) ?? null;

  /*
   * Edits save themselves, but a sheet with only "Remove this section" in it
   * left people unsure whether what they typed was kept (2026-10-08). Save
   * writes now and closes; it is off until something here has changed.
   */
  const [changed, setChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  // Per opening, not per section: this sheet stays mounted while closed, so
  // reopening the section just edited would otherwise still say "Save" for
  // edits that saved themselves long ago.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  if (sectionId !== openedFor) {
    setOpenedFor(sectionId);
    setChanged(false);
  }

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
    setChanged(true);
    setSections(page.sections.map((s) => (s.id === section.id ? { ...s, ...next } : s)));
  }

  async function save() {
    setSaving(true);
    try {
      if (await flush()) {
        setChanged(false);
        toast.success("Saved");
        onClose();
      } else {
        toast.error(useDraft.getState().lastError ?? new Error("That didn't save. Try again."));
      }
    } finally {
      setSaving(false);
    }
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

    void (async () => {
      const ok = await confirm({
        title: "Remove this section?",
        message: `"${section.title}" and everything in it will go.`,
        confirmLabel: "Remove",
        cancelLabel: "Keep it",
        destructive: true,
      });
      if (ok) drop();
    })();
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

        <View className="gap-2 pt-2">
          <Button
            title={changed ? "Save" : "Saved"}
            disabled={!changed || saving}
            loading={saving}
            onPress={() => void save()}
          />
          <Button title="Remove this section" variant="secondary" onPress={remove} />
        </View>

        <Muted>An empty section never shows on your published page.</Muted>
      </View>
    </Sheet>
  );
}
