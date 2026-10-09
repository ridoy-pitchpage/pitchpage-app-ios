import type { ConfirmOptions } from "./Confirm";

/** The shape Alert.alert takes, without importing react-native into a pure module. */
export type AlertButtonSpec = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress: () => void;
};

/**
 * A confirm's buttons as the system alert shows them: one to acknowledge, or
 * Cancel and the action, with the action marked destructive when it destroys
 * something. Each button answers the confirm's promise.
 */
export function alertButtons(options: ConfirmOptions, resolve: (answer: boolean) => void): AlertButtonSpec[] {
  const confirm: AlertButtonSpec = {
    text: options.confirmLabel ?? "OK",
    style: options.destructive ? "destructive" : "default",
    onPress: () => resolve(true),
  };
  if (options.dismissOnly) return [confirm];
  return [{ text: options.cancelLabel ?? "Cancel", style: "cancel", onPress: () => resolve(false) }, confirm];
}
