const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Storybook's dynamic story imports rely on require.context, which Metro
// disables by default. Enabling it here is what makes `stories/**/*.stories.tsx`
// resolve at runtime rather than being silently dropped.
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
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

// Auto-generate `.storybook/storybook.requires.ts` whenever Metro runs, so the
// story index is always in sync with the stories glob. `--config .storybook`
// points the generator at the config directory.
if (process.env.SB_GENERATE_REQUIRES !== "0") {
  try {
    const { generate } = require("@storybook/react-native/scripts/generate");
    generate({
      configPath: ".storybook",
      absolute: false,
      useJs: false,
    });
  } catch (error) {
    // Storybook generation is best-effort: a missing or malformed stories glob
    // must not break the app build.
    console.warn("Storybook requires generation failed:", error);
  }
}

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
  compress: {
    ...config.transformer.minifierConfig?.compress,
    inline: 2, // Enable inlining for small modules
  },
};

module.exports = config;
