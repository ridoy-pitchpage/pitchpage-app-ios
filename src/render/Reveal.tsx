import type { ReactNode } from "react";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";

/**
 * The scroll-in for a section.
 *
 * The web's published pages hold one invariant that is worth carrying over
 * exactly: **content is visible by default and animation is additive.** Two
 * separate blank-page bugs there came from reveal logic that hid everything and
 * then failed to un-hide it. Reanimated's `entering` works the same way round —
 * if animations are off or the driver never runs, the element is simply there.
 *
 * `ReduceMotion.System` means the whole thing becomes instant when the device
 * asks for reduced motion, without a second code path.
 */
export function Reveal({
  children,
  /** Position in the list, used to stagger. */
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <Animated.View
      // Capped so a long page does not end up with a two-second wait on the
      // last section.
      entering={FadeInDown.duration(380)
        .delay(Math.min(index, 6) * 55)
        .reduceMotion(ReduceMotion.System)}
      className={className}
    >
      {children}
    </Animated.View>
  );
}
