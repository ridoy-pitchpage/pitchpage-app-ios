import { createContext, useContext } from "react";

/**
 * How a field inside a Sheet asks to be scrolled into view when it gains focus.
 *
 * Its own module so TextField can use it without importing the Sheet, which
 * imports Text, which would make the two depend on each other.
 */
export const SheetFocusContext = createContext<(() => void) | null>(null);

/** Null outside a Sheet, where the screen's own scroll view handles it. */
export function useSheetFocusReveal(): (() => void) | null {
  return useContext(SheetFocusContext);
}
