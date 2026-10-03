module.exports = function (api) {
  api.cache(true);
  return {
    // `unstable_transformImportMeta` must stay enabled: `@xenova/transformers`
    // (imported by lib/ai/models/ModelManager.ts) uses `import.meta`, which
    // Hermes cannot execute without this polyfill. Dropping it fails the bundle
    // with "`import.meta` is not supported in Hermes".
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    plugins: [
      // WatermelonDB models use legacy decorator syntax (`@field`, `@date`,
      // `@relation`, `@children`), which requires `legacy: true`.
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      // The decorators plugin requires class properties to be loose. Plugin
      // order matters: decorators must come first.
      ['@babel/plugin-transform-class-properties', { loose: true }],
    ],
  };
};
