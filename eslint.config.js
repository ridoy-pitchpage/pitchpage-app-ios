// Expo's own flat config, plus the few adjustments this codebase needs.
// `dist/` is build output and `.expo/` is generated, so neither is linted.
const expo = require("eslint-config-expo/flat");

module.exports = [
  ...expo,
  { ignores: ["dist/*", ".expo/*", "node_modules/*", ".e2e-out/*"] },
  {
    // The end-to-end suite is plain Node scripts, not React Native: they use
    // Buffer, process and console, none of which exist in the app itself.
    files: ["e2e/**/*.mjs"],
    languageOptions: {
      globals: { Buffer: "readonly", process: "readonly", console: "readonly" },
    },
  },
  {
    rules: {
      /*
       * Off deliberately. The rule exists because a bare apostrophe in JSX
       * text can be ambiguous in HTML, but nothing here renders to HTML —
       * React Native draws strings into a Text node, where `'` is just an
       * apostrophe and `&apos;` would render as those six literal characters.
       * Escaping it would put visible entity codes in the app's copy.
       */
      "react/no-unescaped-entities": "off",

      /*
       * Off deliberately. `Array<T>` and `T[]` are the same type, and several
       * of the files this would rewrite are copied verbatim from the website
       * (src/content/guide-*.ts, src/page/*.ts) so that re-copying them stays
       * a straight overwrite. Reformatting them here would make every future
       * copy a merge.
       */
      "@typescript-eslint/array-type": "off",
    },
  },
];
