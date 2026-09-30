/**
 * Unit tests on the logic that is expensive to get wrong: colour contrast, the
 * style key, page health and the block schema.
 *
 * Deliberately not the jest-expo preset. Nothing here touches a native module,
 * and that preset pulls the whole Expo runtime in to run arithmetic. The one
 * React Native import in the code under test is `Platform`, which is stubbed
 * below.
 *
 * Screens are not unit-tested: the browser sweep in CI renders every route and
 * checks layout, contrast and accessibility, which catches far more of what
 * actually breaks on a phone.
 */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: { "^.+\\.tsx?$": ["babel-jest", { presets: [["babel-preset-expo", { jsxImportSource: "react" }]] }] },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^react-native$": "<rootDir>/__tests__/__mocks__/react-native.ts",
  },
};
