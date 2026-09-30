import { useState } from "react";
import { Pressable, View } from "react-native";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react-native";

import { Body, Label, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { ChipField, LineList } from "@/components/ChipField";
import { Segmented } from "@/components/Select";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";
import type { BlockData, BlockType } from "@/page/page-sections";

/**
 * Editing one section's contents.
 *
 * Rebuilt for touch rather than ported. The web version puts repeating items in
 * multi-column grids that stack into an undifferentiated run of twenty fields,
 * asks for lists in newline-delimited textareas, and caps `cards` at four when
 * the schema allows twenty. Here each repeating item is a collapsible card
 * showing its own summary, lists are chips or discrete rows, and the caps match
 * the schema.
 *
 * Every limit below comes from `page-sections.ts`, which is copied from the
 * website. Enforcing them here as well as server-side means the user sees the
 * ceiling instead of having their text quietly truncated on save.
 */

export function BlockEditor({
  blockType,
  data,
  onChange,
}: {
  blockType: BlockType;
  data: BlockData;
  onChange: (next: BlockData) => void;
}) {
  const set = (patch: Record<string, unknown>) => onChange({ ...data, ...patch } as BlockData);

  switch (blockType) {
    case "metric_grid":
      return <MetricGridEditor data={data} set={set} />;
    case "text_block":
      return <TextBlockEditor data={data} set={set} />;
    case "timeline":
      return <TimelineEditor data={data} set={set} />;
    case "cards":
      return <CardsEditor data={data} set={set} />;
    case "quote_list":
      return <QuotesEditor data={data} set={set} />;
    case "logo_row":
      return <LogoRowEditor data={data} set={set} />;
    case "tag_list":
      return <TagListEditor data={data} set={set} />;
    case "chart":
      return <ChartEditor data={data} set={set} />;
    case "cta":
      return <CtaEditor data={data} set={set} />;
    default:
      return null;
  }
}

type Setter = (patch: Record<string, unknown>) => void;

// ─── a repeating item ───────────────────────────────────────────────────────

/**
 * One item in a list, collapsed to its own summary until opened. Keeping one
 * open at a time is the same discipline the section list uses, and is what
 * stops a five-item timeline becoming a wall of twenty inputs.
 */
function ItemCard({
  summary,
  index,
  open,
  onToggle,
  onRemove,
  onMoveUp,
  onMoveDown,
  children,
}: {
  summary: string;
  index: number;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children: React.ReactNode;
}) {
  const colors = useColors();

  return (
    <View className="overflow-hidden rounded-control border border-border bg-card">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={summary || `Item ${index + 1}`}
        style={{ minHeight: MIN_TAP }}
        className="flex-row items-center gap-2 px-3 py-2"
      >
        <Body numberOfLines={1} className="min-w-0 flex-1">
          {summary || `Item ${index + 1}`}
        </Body>
        {open ? (
          <ChevronUp size={18} color={colors.mutedForeground} />
        ) : (
          <ChevronDown size={18} color={colors.mutedForeground} />
        )}
      </Pressable>

      {open ? (
        <View className="gap-3 border-t border-border px-3 py-3">
          {children}

          <View className="flex-row items-center justify-between pt-1">
            <View className="flex-row gap-1">
              {/* Move controls stay visible rather than hiding behind a drag
                  gesture, so switch control and VoiceOver can reach them. */}
              <IconAction label="Move up" onPress={onMoveUp} disabled={!onMoveUp}>
                <ChevronUp size={18} color={colors.foreground} />
              </IconAction>
              <IconAction label="Move down" onPress={onMoveDown} disabled={!onMoveDown}>
                <ChevronDown size={18} color={colors.foreground} />
              </IconAction>
            </View>
            <IconAction label={`Remove ${summary || `item ${index + 1}`}`} onPress={onRemove}>
              <Trash2 size={18} color={colors.destructive} />
            </IconAction>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function IconAction({
  label,
  onPress,
  disabled = false,
  children,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || !onPress }}
      style={{ minHeight: MIN_TAP, minWidth: MIN_TAP }}
      className={["items-center justify-center rounded-control", disabled ? "opacity-30" : ""].join(" ")}
    >
      {children}
    </Pressable>
  );
}

function AddButton({ label, onPress, atMax }: { label: string; onPress: () => void; atMax: boolean }) {
  const colors = useColors();
  if (atMax) return <Muted>That's the maximum.</Muted>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ minHeight: MIN_TAP }}
      className="flex-row items-center justify-center gap-2 rounded-control border border-dashed border-border"
    >
      <Plus size={16} color={colors.primary} />
      <Body className="text-link">{label}</Body>
    </Pressable>
  );
}

/** Shared list state: which item is open, plus add/remove/move. */
function useItemList<T>(items: T[], set: Setter, blank: () => T, max: number) {
  const [openIndex, setOpenIndex] = useState<number | null>(items.length === 0 ? null : 0);

  const write = (next: T[]) => set({ items: next });

  return {
    items,
    openIndex,
    atMax: items.length >= max,
    toggle: (index: number) => setOpenIndex((current) => (current === index ? null : index)),
    add: () => {
      write([...items, blank()]);
      setOpenIndex(items.length);
    },
    update: (index: number, patch: Partial<T>) => {
      const next = [...items];
      next[index] = { ...(next[index] as T), ...patch };
      write(next);
    },
    remove: (index: number) => {
      write(items.filter((_, i) => i !== index));
      setOpenIndex(null);
    },
    move: (index: number, delta: number) => {
      const target = index + delta;
      if (target < 0 || target >= items.length) return;
      const next = [...items];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved as T);
      write(next);
      setOpenIndex(target);
    },
  };
}

// ─── the nine editors ───────────────────────────────────────────────────────

type Metric = { value?: string; label?: string; sub?: string };

function MetricGridEditor({ data, set }: { data: BlockData; set: Setter }) {
  const list = useItemList<Metric>(
    ((data as { items?: Metric[] }).items ?? []),
    set,
    () => ({ value: "", label: "", sub: "" }),
    8,
  );

  return (
    <View className="gap-3">
      <Muted>Real figures only — anything you'd be happy to be asked about.</Muted>
      {list.items.map((item, index) => (
        <ItemCard
          key={index}
          index={index}
          summary={[item.value, item.label].filter(Boolean).join(" · ")}
          open={list.openIndex === index}
          onToggle={() => list.toggle(index)}
          onRemove={() => list.remove(index)}
          onMoveUp={index > 0 ? () => list.move(index, -1) : undefined}
          onMoveDown={index < list.items.length - 1 ? () => list.move(index, 1) : undefined}
        >
          <TextField
            label="Figure"
            value={item.value ?? ""}
            onChangeText={(value) => list.update(index, { value })}
            maxLength={24}
            placeholder="98%"
          />
          <TextField
            label="What it measures"
            value={item.label ?? ""}
            onChangeText={(label) => list.update(index, { label })}
            maxLength={60}
            placeholder="On-time delivery"
          />
          <TextField
            label="Note"
            hint="Optional."
            value={item.sub ?? ""}
            onChangeText={(sub) => list.update(index, { sub })}
            maxLength={80}
          />
        </ItemCard>
      ))}
      <AddButton label="Add a figure" onPress={list.add} atMax={list.atMax} />
    </View>
  );
}

function TextBlockEditor({ data, set }: { data: BlockData; set: Setter }) {
  const d = data as {
    heading?: string;
    paragraphs?: string[];
    bullets?: string[];
    format?: "paragraph" | "bullets";
  };
  const format = d.format === "bullets" ? "bullets" : "paragraph";

  return (
    <View className="gap-4">
      <TextField
        label="Heading"
        hint="Optional."
        value={d.heading ?? ""}
        onChangeText={(heading) => set({ heading })}
        maxLength={120}
      />

      <Segmented
        label="Show as"
        value={format}
        options={[
          { value: "paragraph", label: "Paragraphs" },
          { value: "bullets", label: "Bullets" },
        ]}
        onChange={(next) => set({ format: next })}
      />

      {format === "bullets" ? (
        // The web has no manual editor for bullets at all — only an AI
        // reformat. Editing them directly is the obvious missing control.
        <LineList
          label="Bullets"
          value={d.bullets ?? []}
          onChange={(bullets) => set({ bullets })}
          max={8}
          maxLength={240}
          multiline={false}
          placeholder="One point per line"
          addLabel="Add a bullet"
        />
      ) : (
        <LineList
          label="Paragraphs"
          value={d.paragraphs ?? []}
          onChange={(paragraphs) => set({ paragraphs })}
          max={4}
          maxLength={800}
          placeholder="Write it the way you'd say it out loud."
          addLabel="Add a paragraph"
        />
      )}
    </View>
  );
}

type Period = { period?: string; title?: string; org?: string; bullets?: string[] };

function TimelineEditor({ data, set }: { data: BlockData; set: Setter }) {
  const d = data as { location?: string; items?: Period[] };
  const list = useItemList<Period>(
    d.items ?? [],
    set,
    () => ({ period: "", title: "", org: "", bullets: [] }),
    8,
  );

  return (
    <View className="gap-3">
      <TextField
        label="Location"
        hint="Optional."
        value={d.location ?? ""}
        onChangeText={(location) => set({ location })}
        maxLength={120}
        placeholder="Toronto, Canada"
      />

      {list.items.map((item, index) => (
        <ItemCard
          key={index}
          index={index}
          summary={[item.period, item.title, item.org].filter(Boolean).join(" · ")}
          open={list.openIndex === index}
          onToggle={() => list.toggle(index)}
          onRemove={() => list.remove(index)}
          onMoveUp={index > 0 ? () => list.move(index, -1) : undefined}
          onMoveDown={index < list.items.length - 1 ? () => list.move(index, 1) : undefined}
        >
          <TextField
            label="When"
            value={item.period ?? ""}
            onChangeText={(period) => list.update(index, { period })}
            maxLength={60}
            placeholder="2023–now"
          />
          <TextField
            label="Title"
            value={item.title ?? ""}
            onChangeText={(title) => list.update(index, { title })}
            maxLength={120}
            placeholder="Senior Nurse"
          />
          <TextField
            label="Where"
            value={item.org ?? ""}
            onChangeText={(org) => list.update(index, { org })}
            maxLength={160}
            placeholder="Mercy General"
          />
          <LineList
            label="What you did"
            value={item.bullets ?? []}
            onChange={(bullets) => list.update(index, { bullets })}
            max={6}
            maxLength={300}
            multiline={false}
            addLabel="Add a point"
          />
        </ItemCard>
      ))}

      <AddButton label="Add a role" onPress={list.add} atMax={list.atMax} />
    </View>
  );
}

type CardItem = { title?: string; body?: string; icon?: string };

function CardsEditor({ data, set }: { data: BlockData; set: Setter }) {
  // 20, the schema's cap. The web's editor stops at 4, which silently truncates
  // anyone with a fifth thing to say.
  const list = useItemList<CardItem>(
    ((data as { items?: CardItem[] }).items ?? []),
    set,
    () => ({ title: "", body: "", icon: "" }),
    20,
  );

  return (
    <View className="gap-3">
      {list.items.map((item, index) => (
        <ItemCard
          key={index}
          index={index}
          summary={item.title ?? ""}
          open={list.openIndex === index}
          onToggle={() => list.toggle(index)}
          onRemove={() => list.remove(index)}
          onMoveUp={index > 0 ? () => list.move(index, -1) : undefined}
          onMoveDown={index < list.items.length - 1 ? () => list.move(index, 1) : undefined}
        >
          <TextField
            label="Title"
            value={item.title ?? ""}
            onChangeText={(title) => list.update(index, { title })}
            maxLength={80}
          />
          <TextField
            label="Description"
            value={item.body ?? ""}
            onChangeText={(body) => list.update(index, { body })}
            maxLength={320}
            multiline
            minHeight={84}
          />
        </ItemCard>
      ))}
      <AddButton label="Add a card" onPress={list.add} atMax={list.atMax} />
    </View>
  );
}

type Quote = { quote?: string; name?: string; role?: string };

function QuotesEditor({ data, set }: { data: BlockData; set: Setter }) {
  const list = useItemList<Quote>(
    ((data as { items?: Quote[] }).items ?? []),
    set,
    () => ({ quote: "", name: "", role: "" }),
    6,
  );

  return (
    <View className="gap-3">
      <Muted>Their exact words, copied from a review, letter or email.</Muted>
      {list.items.map((item, index) => (
        <ItemCard
          key={index}
          index={index}
          summary={[item.name, item.role].filter(Boolean).join(" · ")}
          open={list.openIndex === index}
          onToggle={() => list.toggle(index)}
          onRemove={() => list.remove(index)}
          onMoveUp={index > 0 ? () => list.move(index, -1) : undefined}
          onMoveDown={index < list.items.length - 1 ? () => list.move(index, 1) : undefined}
        >
          <TextField
            label="What they said"
            value={item.quote ?? ""}
            onChangeText={(quote) => list.update(index, { quote })}
            maxLength={400}
            multiline
            minHeight={96}
          />
          <TextField
            label="Name"
            value={item.name ?? ""}
            onChangeText={(name) => list.update(index, { name })}
            maxLength={80}
          />
          <TextField
            label="Their role"
            value={item.role ?? ""}
            onChangeText={(role) => list.update(index, { role })}
            maxLength={120}
          />
        </ItemCard>
      ))}
      <AddButton label="Add a quote" onPress={list.add} atMax={list.atMax} />
    </View>
  );
}

function LogoRowEditor({ data, set }: { data: BlockData; set: Setter }) {
  const d = data as { heading?: string; names?: string[] };
  return (
    <View className="gap-4">
      {/* The web never exposes this heading, though the schema has it. */}
      <TextField
        label="Heading"
        hint="Optional."
        value={d.heading ?? ""}
        onChangeText={(heading) => set({ heading })}
        maxLength={80}
      />
      <ChipField
        label="Organisations"
        value={d.names ?? []}
        onChange={(names) => set({ names })}
        max={12}
        maxLength={60}
        placeholder="Add one and press return"
        hint="Only places you have genuinely worked with or for."
      />
    </View>
  );
}

function TagListEditor({ data, set }: { data: BlockData; set: Setter }) {
  const d = data as { heading?: string; tags?: string[] };
  return (
    <View className="gap-4">
      <TextField
        label="Heading"
        hint="Optional."
        value={d.heading ?? ""}
        onChangeText={(heading) => set({ heading })}
        maxLength={80}
      />
      <ChipField
        label="Tags"
        value={d.tags ?? []}
        onChange={(tags) => set({ tags })}
        max={16}
        maxLength={80}
        placeholder="Add one and press return"
      />
    </View>
  );
}

type Point = { label?: string; value?: number };

function ChartEditor({ data, set }: { data: BlockData; set: Setter }) {
  const d = data as { variant?: string; series?: Point[]; caption?: string };
  const variant = d.variant === "line" || d.variant === "donut" ? d.variant : "bars";
  const series = d.series ?? [];
  const [openIndex, setOpenIndex] = useState<number | null>(series.length ? 0 : null);

  const write = (next: Point[]) => set({ series: next });

  return (
    <View className="gap-4">
      <Segmented
        label="Chart type"
        value={variant}
        options={[
          { value: "bars", label: "Bars" },
          { value: "line", label: "Line" },
          { value: "donut", label: "Donut" },
        ]}
        onChange={(next) => set({ variant: next })}
      />
      <Muted>On a phone your page draws this as bars whichever you pick — a line or donut isn't readable at this width. The published page uses your choice.</Muted>

      {series.map((point, index) => (
        <ItemCard
          key={index}
          index={index}
          summary={[point.label, point.value].filter((v) => v !== undefined && v !== "").join(" · ")}
          open={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          onRemove={() => {
            write(series.filter((_, i) => i !== index));
            setOpenIndex(null);
          }}
        >
          <TextField
            label="Label"
            value={point.label ?? ""}
            onChangeText={(label) => {
              const next = [...series];
              next[index] = { ...next[index], label: label.slice(0, 60) };
              write(next);
            }}
            maxLength={60}
            placeholder="Q1"
          />
          <TextField
            label="Value"
            value={point.value === undefined ? "" : String(point.value)}
            onChangeText={(text) => {
              const next = [...series];
              // An empty field stays undefined rather than becoming 0: the web
              // coerces mid-typing and turns a cleared field into a real zero.
              const parsed = text.trim() === "" ? undefined : Number(text.replace(/[^0-9.-]/g, ""));
              next[index] = {
                ...next[index],
                value: parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined,
              };
              write(next);
            }}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </ItemCard>
      ))}

      <AddButton
        label="Add a point"
        onPress={() => {
          write([...series, { label: "", value: undefined }]);
          setOpenIndex(series.length);
        }}
        atMax={series.length >= 12}
      />

      <TextField
        label="Caption"
        hint="Optional."
        value={d.caption ?? ""}
        onChangeText={(caption) => set({ caption })}
        maxLength={120}
      />
    </View>
  );
}

function CtaEditor({ data, set }: { data: BlockData; set: Setter }) {
  const d = data as {
    heading?: string;
    sub?: string;
    label?: string;
    url?: string;
    email?: string;
  };

  return (
    <View className="gap-4">
      <TextField
        label="Heading"
        value={d.heading ?? ""}
        onChangeText={(heading) => set({ heading })}
        maxLength={120}
        placeholder="Let's talk"
      />
      <TextField
        label="Subline"
        hint="Optional."
        value={d.sub ?? ""}
        onChangeText={(sub) => set({ sub })}
        maxLength={200}
      />
      <TextField
        label="Button label"
        value={d.label ?? ""}
        onChangeText={(label) => set({ label })}
        maxLength={60}
        placeholder="Contact me"
      />
      <TextField
        label="Button link"
        value={d.url ?? ""}
        onChangeText={(url) => set({ url })}
        maxLength={500}
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="https://"
      />
      <TextField
        label="Email"
        value={d.email ?? ""}
        onChangeText={(email) => set({ email })}
        maxLength={200}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
      />
      <Muted>This section only shows on your page once it has a link or an email.</Muted>
    </View>
  );
}
