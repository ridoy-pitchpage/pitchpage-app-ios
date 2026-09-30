import { inlineRe } from "@/content/guide-inline";

/**
 * Guide copy's inline syntax, parsed into a tree.
 *
 * Kept separate from the component that draws it so it can be tested without
 * rendering anything, and because the nesting is the part that is easy to get
 * wrong: a link label may itself contain bold, as in
 * `[**more than 300 applications**](https://…)`, which the copy uses in the
 * statistics guide. A parser that treats a label as plain text puts literal
 * asterisks in the middle of a sentence.
 */

export type InlineNode =
  | { type: "text"; text: string }
  | { type: "bold"; children: InlineNode[] }
  | { type: "italic"; children: InlineNode[] }
  | { type: "link"; href: string; children: InlineNode[] };

/** Guards against a pathological nesting in hand-written copy. */
const MAX_DEPTH = 5;

export function parseInline(text: string, depth = 0): InlineNode[] {
  if (depth >= MAX_DEPTH) return text ? [{ type: "text", text }] : [];

  const nodes: InlineNode[] = [];
  const re = inlineRe();
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) != null) {
    if (match.index > last) nodes.push({ type: "text", text: text.slice(last, match.index) });

    const [whole, linkLabel, href, bold, italic] = match;

    if (linkLabel != null && href != null) {
      nodes.push({ type: "link", href, children: parseInline(linkLabel, depth + 1) });
    } else if (bold != null) {
      nodes.push({ type: "bold", children: parseInline(bold, depth + 1) });
    } else if (italic != null) {
      nodes.push({ type: "italic", children: parseInline(italic, depth + 1) });
    }

    last = match.index + whole.length;
    // The pattern cannot match empty, but a future change to it must not be
    // able to hang a screen.
    if (whole.length === 0) re.lastIndex += 1;
  }

  if (last < text.length) nodes.push({ type: "text", text: text.slice(last) });
  return nodes;
}

/** The words a parsed tree renders, with every marker gone. */
export function nodesToPlainText(nodes: InlineNode[]): string {
  return nodes
    .map((node) => (node.type === "text" ? node.text : nodesToPlainText(node.children)))
    .join("");
}
