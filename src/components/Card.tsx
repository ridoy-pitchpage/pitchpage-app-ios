import { View, type ViewProps } from "react-native";

import { useColors } from "@/theme/ThemeProvider";

/** Quiet surfaces keep the content, not the container, in focus. */
export function Card({
  className,
  flat = false,
  level = 1,
  style,
  ...rest
}: ViewProps & {
  className?: string;
  flat?: boolean;
  /** Higher emphasis uses a stronger edge, never a glowing shadow. */
  level?: 1 | 2 | 3;
}) {
  const colors = useColors();
  return (
    <View
      {...rest}
      style={[!flat && level > 1 ? { borderColor: colors.input } : null, style]}
      className={["rounded-card border border-border bg-card p-4", className ?? ""].join(" ")}
    />
  );
}
