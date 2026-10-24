// Types for the plugin, which stays plain CommonJS so Expo's config loader can
// run it, so that the tests can import it like any other module.
import type { ConfigPlugin } from "expo/config-plugins";

declare const withAppVariant: ConfigPlugin & {
  withVariantExport(contents: string, variant: string): string;
};

export = withAppVariant;
