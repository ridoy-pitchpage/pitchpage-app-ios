import { Text } from "react-native";

import { parseInline, type InlineNode } from "@/content/guide-inline-parse";
import { openGuideHref } from "@/content/guide-links";

/**
 * Guide copy's inline syntax — [text](/path), **bold**, *italic* — rendered as
 * real text.
 *
 * Nested Text is how React Native does a run of styled text inside a
 * paragraph, and it is the only way the result still wraps, still selects as
 * one block and still scales with Dynamic Type. Building it out of Views would
 * break all three, and it is also what lets a link label carry its own bold.
 *
 * A link is a nested Text with onPress rather than a Pressable, for the same
 * reason: a Pressable inside a paragraph cannot wrap across lines. That costs
 * the 44pt tap target a standalone control needs, which is why guides never
 * put a call to action in a paragraph — the CTA at the end of each article is
 * a real Button.
 */

function renderNodes(nodes: InlineNode[], linkClassName: string): React.ReactNode[] {
  return nodes.map((node, index) => {
    if (node.type === "text") return node.text;

    const children = renderNodes(node.children, linkClassName);

    if (node.type === "link") {
      return (
        <Text
          key={index}
          className={linkClassName}
          onPress={() => openGuideHref(node.href)}
          accessibilityRole="link"
        >
          {children}
        </Text>
      );
    }

    return (
      <Text key={index} className={node.type === "bold" ? "font-body-bold" : "italic"}>
        {children}
      </Text>
    );
  });
}

export function InlineText({
  text,
  className,
  linkClassName = "text-link underline",
}: {
  text: string;
  className?: string;
  linkClassName?: string;
}) {
  return <Text className={className}>{renderNodes(parseInline(text), linkClassName)}</Text>;
}
