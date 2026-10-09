/**
 * The logic under test imports `Platform`, to choose a monospace face, and
 * `Linking`, to hand a page's email links to Mail. Standing in for them keeps
 * these tests from needing the native runtime.
 */
export const Platform = {
  OS: "ios" as const,
  select: <T,>(spec: { ios?: T; android?: T; default?: T }): T | undefined =>
    spec.ios ?? spec.default,
};

export const Linking = {
  openURL: async (_url: string): Promise<boolean> => true,
};
