/**
 * The logic under test imports `Platform` only, to choose a monospace face.
 * Standing in for it keeps these tests from needing the native runtime.
 */
export const Platform = {
  OS: "ios" as const,
  select: <T,>(spec: { ios?: T; android?: T; default?: T }): T | undefined =>
    spec.ios ?? spec.default,
};
