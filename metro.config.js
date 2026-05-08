const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Enable image compression and optimization
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer.minifierConfig,
    keep_fnames: false,
    mangle: {
      ...config.transformer.minifierConfig?.mangle,
      keep_fnames: false,
    },
    output: {
      ...config.transformer.minifierConfig?.output,
      comments: false,
    },
  },
};

// Configure resolver for better bundling
config.resolver = {
  ...config.resolver,
  assetExts: [
    ...config.resolver.assetExts,
    // Add any additional asset extensions if needed
  ],
};

// Enable inline requires for better performance
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  inline: 2, // Enable inlining for small modules
};

module.exports = config;
