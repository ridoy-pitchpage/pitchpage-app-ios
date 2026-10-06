import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";
import { vars } from "nativewind";

import { Button } from "./Button";
import { Body, H3 } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";
import { elevation, paletteVars } from "@/theme/tokens";
import { ModalSurface } from "./ModalSurface";

/**
 * "Are you sure?", on every platform.
 *
 * React Native's own Alert.alert is `static alert() {}` on react-native-web —
 * an empty function. Every confirmation in the app went through it, so on the
 * web build Delete, Sign out, Remove section and Remove portrait all silently
 * did nothing: the dialog never appeared, so the button that would have run
 * the action was never pressed. It worked on a device and nowhere else, which
 * is the worst way for something to be broken.
 *
 * This replaces it with a real dialog. It is the app's own, so it is also the
 * app's typography and colours rather than the OS's, it can carry a
 * destructive button that looks destructive, and it behaves the same whether
 * you are on an iPhone or in a browser.
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Delete this page?", confirmLabel: "Delete" })) …
 *
 * It resolves true or false rather than taking callbacks, so the caller reads
 * top to bottom.
 */

export type ConfirmOptions = {
  title: string;
  message?: string;
  /** Defaults to "OK". */
  confirmLabel?: string;
  /** Defaults to "Cancel". */
  cancelLabel?: string;
  /** Red confirm button, for anything that destroys something. */
  destructive?: boolean;
  /** One button only — a message to acknowledge, with nothing to decide. */
  dismissOnly?: boolean;
};

type Ask = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Ask | null>(null);

export function useConfirm(): Ask {
  const ask = useContext(ConfirmContext);
  if (!ask) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ask;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { palette } = useTheme();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const ask = useCallback<Ask>((next) => {
    // A second ask while one is open answers the first "no" rather than
    // leaving its promise hanging for the life of the app.
    resolver.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((answer: boolean) => {
    setOptions(null);
    const resolve = resolver.current;
    resolver.current = null;
    resolve?.(answer);
  }, []);

  const value = useMemo(() => ask, [ask]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        visible={options != null}
        transparent
        animationType="fade"
        // Android's back button, and Escape on web.
        onRequestClose={() => close(false)}
      >
        <ModalSurface>
          {/*
            A Modal renders outside the provider's view tree, so the theme's CSS
            variables have to be applied again here or the panel comes out
            unstyled. Same reason as Sheet.
          */}
          <View style={vars(paletteVars(palette))} className="flex-1">
            {/* The backdrop is a sibling of the panel, never a button parent. */}
            <Pressable
              onPress={() => close(false)}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
              className="absolute inset-0 bg-black/50"
            />
            {/* box-none so a tap beside the panel still reaches the backdrop. */}
            <View pointerEvents="box-none" className="flex-1 items-center justify-center px-6">
              <View
                accessibilityViewIsModal
                className="w-full max-w-[400px] gap-3 rounded-card border border-border p-5"
                style={[{ backgroundColor: palette.card }, elevation("#000000", 3)]}
              >
                <H3>{options?.title}</H3>
                {options?.message ? (
                  <Body className="text-muted-foreground">{options.message}</Body>
                ) : null}

                <View className="gap-2 pt-2">
                  <Button
                    title={options?.confirmLabel ?? "OK"}
                    variant={options?.destructive ? "destructive" : "primary"}
                    onPress={() => close(true)}
                  />
                  {options?.dismissOnly ? null : (
                    <Button
                      title={options?.cancelLabel ?? "Cancel"}
                      variant="secondary"
                      onPress={() => close(false)}
                    />
                  )}
                </View>
              </View>
            </View>
          </View>
        </ModalSurface>
      </Modal>
    </ConfirmContext.Provider>
  );
}
