import { Text as RNText, type TextProps as RNTextProps } from "react-native";

/**
 * Typography. Headings are Sora, bold and never italic; body is Manrope (§19).
 *
 * Nothing here sets `allowFontScaling={false}`: every size has to hold up at
 * the largest Dynamic Type setting, and turning scaling off is how that gets
 * quietly broken.
 *
 * One trap. Each of these sets its own text colour, so passing a different
 * colour class in `className` is a conflict, and on web Tailwind breaks the
 * tie by the order it emits utilities — which follows tailwind.config.js's
 * colour order, not the order of the classes here. `text-primary-foreground`
 * wins because `primary-foreground` is declared after `foreground`;
 * `text-background` silently loses because `background` is declared before it.
 * So a colour that has to override goes in `style`, which wins everywhere,
 * rather than in `className`.
 */

type Props = RNTextProps & { className?: string };

function join(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Screen title. One per screen. */
export function H1({ className, ...rest }: Props) {
  return <RNText {...rest} className={join("font-heading text-[28px] leading-9 text-foreground", className)} />;
}

/** Section heading within a screen. */
export function H2({ className, ...rest }: Props) {
  return <RNText {...rest} className={join("font-heading text-[20px] leading-7 text-foreground", className)} />;
}

/** Card or row heading. */
export function H3({ className, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      className={join("font-heading-semi text-[16px] leading-6 text-foreground", className)}
    />
  );
}

export function Body({ className, ...rest }: Props) {
  return <RNText {...rest} className={join("font-body text-[16px] leading-6 text-foreground", className)} />;
}

/** Supporting copy: hints, timestamps, captions. */
export function Muted({ className, ...rest }: Props) {
  return (
    <RNText {...rest} className={join("font-body text-[14px] leading-5 text-muted-foreground", className)} />
  );
}

/** Field labels and small emphasis. */
export function Label({ className, ...rest }: Props) {
  return (
    <RNText {...rest} className={join("font-body-medium text-[14px] leading-5 text-foreground", className)} />
  );
}
