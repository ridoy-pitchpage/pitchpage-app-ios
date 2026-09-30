import { Text, View, type ViewStyle } from "react-native";

import { RADIUS_FOR, TYPE_SPECS, type TemplateTheme } from "./template-theme";
import type { BlockData, BlockType, PageSection } from "@/page/page-sections";

/**
 * The nine block types, drawn natively.
 *
 * Each one adapts to the archetype through a small number of decisions —
 * whether a group of things is a card or a ruled row, how heavy a line is,
 * whether labels are uppercase — rather than by having five separate
 * implementations. That keeps the rendering honest to the style while staying
 * one piece of code to maintain.
 */

// ─── shared treatments ──────────────────────────────────────────────────────

/** A container: a card on the soft archetype, ruled or bordered elsewhere. */
function containerStyle(theme: TemplateTheme): ViewStyle {
  const radius = RADIUS_FOR[theme.archetype];
  switch (theme.archetype) {
    case "soft":
      return { backgroundColor: theme.surface, borderRadius: radius, padding: 16 };
    case "bold":
      return { borderWidth: 2, borderColor: theme.line, borderRadius: radius, padding: 14 };
    case "console":
      return {
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.line,
        borderRadius: radius,
        padding: 14,
      };
    default:
      // Editorial and minimal use rules, never boxes.
      return { borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 14 };
  }
}

function bodyText(theme: TemplateTheme) {
  return {
    color: theme.ink,
    fontFamily: TYPE_SPECS[theme.archetype].bodyFamily,
    fontSize: 15,
    lineHeight: 23,
  } as const;
}

function mutedText(theme: TemplateTheme) {
  return { ...bodyText(theme), color: theme.inkMuted, fontSize: 13, lineHeight: 19 } as const;
}

/** The small label above or beside a thing. */
function Eyebrow({ theme, children }: { theme: TemplateTheme; children: string }) {
  const spec = TYPE_SPECS[theme.archetype];
  return (
    <Text
      style={{
        color: theme.inkMuted,
        fontFamily: spec.bodyFamily,
        fontSize: 11,
        letterSpacing: spec.eyebrowUppercase ? 1.1 : 0,
        textTransform: spec.eyebrowUppercase ? "uppercase" : "none",
      }}
    >
      {children}
    </Text>
  );
}

export function SectionHeading({ theme, children }: { theme: TemplateTheme; children: string }) {
  const spec = TYPE_SPECS[theme.archetype];
  return (
    <Text
      style={{
        color: theme.ink,
        fontFamily: spec.displayFamily,
        fontSize: 20,
        lineHeight: 26,
        letterSpacing: spec.displayTracking,
        textTransform: spec.displayUppercase ? "uppercase" : "none",
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}

// ─── the blocks ─────────────────────────────────────────────────────────────

type Items<T> = { items?: T[] };

function MetricGrid({ data, theme }: { data: BlockData; theme: TemplateTheme }) {
  const items = ((data as Items<{ value?: string; label?: string; sub?: string }>).items ?? []).filter(
    (item) => item.value?.trim() || item.label?.trim(),
  );
  if (items.length === 0) return null;

  const spec = TYPE_SPECS[theme.archetype];
  const ruled = theme.archetype === "editorial" || theme.archetype === "minimal";

  return (
    <View className="flex-row flex-wrap" style={{ gap: 12 }}>
      {items.map((item, index) => (
        <View
          key={index}
          style={[
            // Two up, so a figure stays large enough to read at a glance.
            { flexBasis: "47%", flexGrow: 1 },
            ruled
              ? { borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 8 }
              : containerStyle(theme),
          ]}
        >
          <Text
            style={{
              color: index === 0 ? theme.accentText : theme.ink,
              fontFamily: spec.displayFamily,
              fontSize: 26,
              lineHeight: 32,
              letterSpacing: spec.displayTracking,
            }}
          >
            {item.value}
          </Text>
          {item.label ? <Text style={mutedText(theme)}>{item.label}</Text> : null}
          {item.sub ? (
            <Text style={[mutedText(theme), { fontSize: 12, opacity: 0.8 }]}>{item.sub}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function TextBlock({ data, theme }: { data: BlockData; theme: TemplateTheme }) {
  const d = data as {
    heading?: string;
    paragraphs?: string[];
    bullets?: string[];
    format?: "paragraph" | "bullets";
  };
  const paragraphs = (d.paragraphs ?? []).filter((p) => p.trim());
  const bullets = (d.bullets ?? []).filter((b) => b.trim());
  const useBullets = d.format === "bullets" && bullets.length > 0;

  if (!d.heading?.trim() && paragraphs.length === 0 && bullets.length === 0) return null;

  return (
    <View style={{ gap: 8 }}>
      {d.heading?.trim() ? (
        <Text style={[bodyText(theme), { fontFamily: TYPE_SPECS[theme.archetype].displayFamily }]}>
          {d.heading}
        </Text>
      ) : null}

      {useBullets
        ? bullets.map((bullet, index) => (
            <View key={index} className="flex-row" style={{ gap: 8 }}>
              <Text style={[bodyText(theme), { color: theme.accentText }]}>•</Text>
              <Text style={[bodyText(theme), { flex: 1 }]}>{bullet}</Text>
            </View>
          ))
        : paragraphs.map((paragraph, index) => (
            <Text key={index} style={bodyText(theme)}>
              {paragraph}
            </Text>
          ))}
    </View>
  );
}

function Timeline({ data, theme }: { data: BlockData; theme: TemplateTheme }) {
  const d = data as {
    location?: string;
    items?: Array<{ period?: string; title?: string; org?: string; bullets?: string[] }>;
  };
  const items = (d.items ?? []).filter(
    (item) => item.title?.trim() || item.org?.trim() || item.period?.trim(),
  );
  if (items.length === 0) return null;

  const spec = TYPE_SPECS[theme.archetype];

  return (
    <View style={{ gap: 14 }}>
      {d.location?.trim() ? <Eyebrow theme={theme}>{d.location}</Eyebrow> : null}

      {items.map((item, index) => (
        <View
          key={index}
          style={{
            borderLeftWidth: theme.archetype === "bold" ? 3 : 2,
            borderLeftColor: index === 0 ? theme.accent : theme.line,
            paddingLeft: 12,
            gap: 3,
          }}
        >
          {item.period?.trim() ? <Eyebrow theme={theme}>{item.period}</Eyebrow> : null}
          {item.title?.trim() ? (
            <Text style={[bodyText(theme), { fontFamily: spec.displayFamily, fontSize: 16 }]}>
              {item.title}
            </Text>
          ) : null}
          {item.org?.trim() ? <Text style={mutedText(theme)}>{item.org}</Text> : null}
          {(item.bullets ?? [])
            .filter((b) => b.trim())
            .map((bullet, bulletIndex) => (
              <Text key={bulletIndex} style={[mutedText(theme), { color: theme.ink }]}>
                • {bullet}
              </Text>
            ))}
        </View>
      ))}
    </View>
  );
}

function Cards({ data, theme }: { data: BlockData; theme: TemplateTheme }) {
  const items = ((data as Items<{ title?: string; body?: string }>).items ?? []).filter(
    (item) => item.title?.trim() || item.body?.trim(),
  );
  if (items.length === 0) return null;

  const spec = TYPE_SPECS[theme.archetype];

  return (
    <View style={{ gap: 10 }}>
      {items.map((item, index) => (
        <View key={index} style={containerStyle(theme)}>
          {item.title?.trim() ? (
            <Text style={[bodyText(theme), { fontFamily: spec.displayFamily, fontSize: 16 }]}>
              {item.title}
            </Text>
          ) : null}
          {item.body?.trim() ? (
            <Text style={[bodyText(theme), { marginTop: 4 }]}>{item.body}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function QuoteList({ data, theme }: { data: BlockData; theme: TemplateTheme }) {
  const items = ((data as Items<{ quote?: string; name?: string; role?: string }>).items ?? []).filter(
    (item) => item.quote?.trim() || item.name?.trim(),
  );
  if (items.length === 0) return null;

  return (
    <View style={{ gap: 14 }}>
      {items.map((item, index) => (
        <View
          key={index}
          style={{ borderLeftWidth: 2, borderLeftColor: theme.accent, paddingLeft: 12, gap: 4 }}
        >
          {item.quote?.trim() ? (
            <Text style={[bodyText(theme), { fontStyle: "italic" }]}>“{item.quote}”</Text>
          ) : null}
          {item.name?.trim() || item.role?.trim() ? (
            <Text style={mutedText(theme)}>
              {[item.name, item.role].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function LogoRow({ data, theme }: { data: BlockData; theme: TemplateTheme }) {
  const d = data as { heading?: string; names?: string[] };
  const names = (d.names ?? []).filter((name) => name.trim());
  if (names.length === 0) return null;

  return (
    <View style={{ gap: 8 }}>
      {d.heading?.trim() ? <Eyebrow theme={theme}>{d.heading}</Eyebrow> : null}
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {names.map((name, index) => (
          <Text
            key={index}
            style={[
              bodyText(theme),
              { fontSize: 14, color: theme.inkMuted },
            ]}
          >
            {name}
            {index < names.length - 1 ? "  ·" : ""}
          </Text>
        ))}
      </View>
    </View>
  );
}

function TagList({ data, theme }: { data: BlockData; theme: TemplateTheme }) {
  const d = data as { heading?: string; tags?: string[] };
  const tags = (d.tags ?? []).filter((tag) => tag.trim());
  if (tags.length === 0) return null;

  // Minimal and editorial set these as a line of text, not chips — a row of
  // pills is a product-UI idea and reads wrong in a serif, ruled layout.
  const asChips = theme.archetype === "soft" || theme.archetype === "bold" || theme.archetype === "console";

  return (
    <View style={{ gap: 8 }}>
      {d.heading?.trim() ? <Eyebrow theme={theme}>{d.heading}</Eyebrow> : null}

      {asChips ? (
        <View className="flex-row flex-wrap" style={{ gap: 7 }}>
          {tags.map((tag, index) => (
            <View
              key={index}
              style={{
                borderWidth: theme.archetype === "bold" ? 2 : 1,
                borderColor: theme.archetype === "bold" ? theme.accent : theme.line,
                borderRadius: theme.archetype === "soft" ? 999 : RADIUS_FOR[theme.archetype],
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Text style={[mutedText(theme), { color: theme.ink }]}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={bodyText(theme)}>
          {tags.map((tag, index) => (
            <Text key={index}>
              {tag}
              {index < tags.length - 1 ? (
                <Text style={{ color: theme.accentText }}> ◆ </Text>
              ) : null}
            </Text>
          ))}
        </Text>
      )}
    </View>
  );
}

function Chart({ data, theme }: { data: BlockData; theme: TemplateTheme }) {
  const d = data as {
    variant?: "bars" | "line" | "donut";
    series?: Array<{ label?: string; value?: number }>;
    caption?: string;
  };
  const series = (d.series ?? []).filter((point) => typeof point.value === "number");
  if (series.length === 0) return null;

  const values = series.map((point) => point.value ?? 0);
  const max = Math.max(...values, 1);
  const spec = TYPE_SPECS[theme.archetype];

  return (
    <View style={{ gap: 10 }}>
      {/*
        Always horizontal bars, whichever variant was chosen. A line or a donut
        at 358pt wide with six labels is unreadable, and a bar per row keeps
        every label legible at the largest text size. The real page draws the
        chosen variant; this is the honest phone reading of it.
      */}
      {series.map((point, index) => (
        <View key={index} style={{ gap: 4 }}>
          <View className="flex-row items-baseline justify-between">
            <Text style={[mutedText(theme), { color: theme.ink }]}>{point.label}</Text>
            <Text style={[mutedText(theme), { fontFamily: spec.displayFamily, color: theme.ink }]}>
              {point.value}
            </Text>
          </View>
          <View
            style={{
              height: 6,
              backgroundColor: theme.line,
              borderRadius: theme.archetype === "soft" ? 3 : 0,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${Math.max(2, ((point.value ?? 0) / max) * 100)}%`,
                height: "100%",
                backgroundColor: theme.accent,
              }}
            />
          </View>
        </View>
      ))}
      {d.caption?.trim() ? <Text style={mutedText(theme)}>{d.caption}</Text> : null}
    </View>
  );
}

function Cta({ data, theme }: { data: BlockData; theme: TemplateTheme }) {
  const d = data as {
    heading?: string;
    sub?: string;
    label?: string;
    url?: string;
    email?: string;
  };
  if (!d.url?.trim() && !d.email?.trim()) return null;

  const spec = TYPE_SPECS[theme.archetype];

  return (
    <View style={[containerStyle(theme), { gap: 8 }]}>
      {d.heading?.trim() ? (
        <Text style={[bodyText(theme), { fontFamily: spec.displayFamily, fontSize: 18 }]}>
          {d.heading}
        </Text>
      ) : null}
      {d.sub?.trim() ? <Text style={mutedText(theme)}>{d.sub}</Text> : null}

      <View
        style={{
          alignSelf: "flex-start",
          backgroundColor: theme.accent,
          borderRadius: theme.archetype === "soft" ? 999 : RADIUS_FOR[theme.archetype],
          paddingHorizontal: 16,
          paddingVertical: 10,
          marginTop: 4,
        }}
      >
        <Text
          style={{
            color: theme.onAccent,
            fontFamily: spec.bodyFamily,
            fontSize: 14,
            fontWeight: "600",
          }}
        >
          {d.label?.trim() || "Get in touch"}
        </Text>
      </View>

      {d.email?.trim() ? <Text style={mutedText(theme)}>{d.email}</Text> : null}
    </View>
  );
}

// ─── dispatch ───────────────────────────────────────────────────────────────

const RENDERERS: Record<
  BlockType,
  (props: { data: BlockData; theme: TemplateTheme }) => React.ReactElement | null
> = {
  metric_grid: MetricGrid,
  text_block: TextBlock,
  timeline: Timeline,
  cards: Cards,
  quote_list: QuoteList,
  logo_row: LogoRow,
  tag_list: TagList,
  chart: Chart,
  cta: Cta,
};

/** One section's body. Returns null when there is nothing in it to show. */
export function BlockBody({
  section,
  theme,
}: {
  section: PageSection;
  theme: TemplateTheme;
}): React.ReactElement | null {
  const Renderer = RENDERERS[section.blockType];
  if (!Renderer) return null;
  return <Renderer data={section.data} theme={theme} />;
}
