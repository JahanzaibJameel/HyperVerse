const config = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)',
  ],
  // Detox e2e specs run through `npm run test:e2e`, not Jest.
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/e2e/',
    '/\\.kilo/worktrees/',
    '/static-build/',
  ],
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'services/**/*.{js,jsx,ts,tsx}',
  ],
  // Floors, not targets. Measured 2026-10-03 at 39.67 / 35.69 / 34.01 / 39.79
  // (stmts / branch / funcs / lines); each threshold sits ~1.5-2pp below that so
  // ordinary churn cannot flip the build. They exist to catch a real drop — a
  // deleted test suite, an untested module added wholesale — and they are not a
  // claim that this app is well covered. It is not: `app/` is still outside the
  // globs above, so no screen code is measured at all. Widening the globs needs
  // a fresh baseline and is tracked in docs/followups.md.
  coverageThreshold: {
    global: {
      statements: 38,
      branches: 34,
      functions: 33,
      lines: 38,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // pnpm nests real packages under node_modules/.pnpm/<id>/node_modules/<pkg>,
  // so the lookahead has to skip that segment before matching package names.
  transformIgnorePatterns: [
    'node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:jest-)?(?:react-native|@react-native|expo|expo-.*|@expo/.*|@react-navigation/.*)/)',
  ],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

export default config;
