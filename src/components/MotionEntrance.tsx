import { useEffect, type ReactNode } from "react";
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

/** A short, accessible entrance for screen content, capped for long lists. */
export function MotionEntrance({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const progress = useSharedValue(0);
  const delay = Math.min(Math.max(index, 0), 5) * 45;
  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 300, reduceMotion: ReduceMotion.System }),
      ReduceMotion.System,
    );
  }, [delay, progress]);
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 12 }],
  }));

  return (
    <Animated.View
      style={entranceStyle}
      className={className}
    >
      {children}
    </Animated.View>
  );
}
