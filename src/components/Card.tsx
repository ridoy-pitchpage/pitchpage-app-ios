import { View, type ViewProps } from "react-native";

/**
 * A flat card surface with a hairline border.
 *
 * Deliberately not the web's `.app-card`: that carries a hard-coded steel-blue
 * gradient in `styles.css` which both the site and the signed-in app override
 * back to the plain card colour. The app renders what the user actually sees,
 * not the shared default they never meet.
 */
export function Card({ className, ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      {...rest}
      className={["rounded-card border border-border bg-card p-4", className ?? ""].join(" ")}
    />
  );
}
