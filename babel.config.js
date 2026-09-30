module.exports = function (api) {
  const platform = api.caller((caller) => caller && caller.platform);

  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    plugins: [
      ...(platform === "web"
        ? [["@babel/plugin-transform-class-properties", { loose: true }]]
        : []),
    ],
  };
};
