module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // react-native-worklets/plugin has to stay last: Reanimated 4 needs it to
    // see the final output of every other transform.
    plugins: ["react-native-worklets/plugin"],
  };
};
