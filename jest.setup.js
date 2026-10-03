import 'react-native-gesture-handler/jestSetup';

// Mock expo modules
jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => Promise.resolve({ Inter_400Regular: 'mock' })),
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.0.0',
    ios: { buildNumber: '1' },
  },
}));

jest.mock('expo-application', () => ({
  applicationId: 'com.test.hyperverse',
  nativeBuildVersion: '1.0.0',
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(() => Promise.resolve('mock-digest')),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
}));

// SecureStore has no native module under Jest; back it with an in-memory map so
// round-trips (save then load) behave like the real thing.
// Mirrors the real `expo-secure-store` surface at 15.0.8. This app calls only
// the four async methods below; the accessibility constants, the synchronous
// accessors, and `canUseBiometricAuthentication` are included so the mock cannot
// silently diverge from the real module the way an omitted export would.
jest.mock('expo-secure-store', () => {
  let store = {};
  return {
    getItemAsync: jest.fn((key) => Promise.resolve(store[key] ?? null)),
    setItemAsync: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key) => {
      delete store[key];
      return Promise.resolve();
    }),
isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  // stubs — configure per test if the return value matters
  getItem: jest.fn((key) => store[key] ?? null),
  setItem: jest.fn((key, value) => {
    store[key] = value;
  }),
  canUseBiometricAuthentication: jest.fn(() => false),
  // Real values come from the native `ExpoSecureStore` module, so these are
  // placeholders. This repo never passes `keychainAccessible`, so no behaviour
  // depends on them.
  WHEN_UNLOCKED: 1,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 2,
  AFTER_FIRST_UNLOCK: 3,
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 4,
  ALWAYS: 5,
  ALWAYS_THIS_DEVICE_ONLY: 6,
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 7,
});

// Mirrors the real `expo-local-authentication` surface at 17.0.9. `jest.mock`
// replaces the whole module, so any export omitted here would be `undefined` to
// a caller. `getEnrolledLevelAsync` and `cancelAuthenticate` are present in the
// real package even though this app does not call them yet.
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([])),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  getEnrolledLevelAsync: jest.fn(() => Promise.resolve(3)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  cancelAuthenticate: jest.fn(() => Promise.resolve()),
  // Numeric enums, matching the built `LocalAuthentication.types.js` exactly.
  // `BIOMETRIC` is deliberately absent: the real enum resolves it through a
  // deprecation-warning getter that needs `Platform`, and no test reads it.
  SecurityLevel: {
    NONE: 0,
    SECRET: 1,
    BIOMETRIC_WEAK: 2,
    BIOMETRIC_STRONG: 3,
  },
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

// Both the modern entry point and the legacy one are mocked. Since
// expo-file-system 19 the imperative API this repo uses lives at
// `expo-file-system/legacy`; the bare path resolves to the Directory/File API.
// Neither is covered by a test today — the only importers are unreachable AI
// code — but mocking both keeps the paths honest if either gains a caller.
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/mock/document/',
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1000 })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('mock content')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readDirectoryAsync: jest.fn(() => Promise.resolve([])),
  deleteAsync: jest.fn(() => Promise.resolve()),
  getFreeDiskStorageAsync: jest.fn(() => Promise.resolve(1024 * 1024 * 1024)),
  createDownloadResumable: jest.fn(() => ({
    downloadAsync: jest.fn(() => Promise.resolve({ status: 200 })),
  })),
}));

jest.mock('expo-file-system', () => ({
  Paths: { document: new URL('./mock/document/', 'file:///').pathname },
  File: class {},
  Directory: class {},
}));

// AsyncStorage has no native module under Jest.
jest.mock('@react-native-async-storage/async-storage', () => {
  let store = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key) => Promise.resolve(store[key] ?? null)),
      setItem: jest.fn((key, value) => {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        store = {};
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
      multiGet: jest.fn((keys) =>
        Promise.resolve(keys.map((key) => [key, store[key] ?? null]))
      ),
      multiSet: jest.fn((pairs) => {
        pairs.forEach(([key, value]) => {
          store[key] = value;
        });
        return Promise.resolve();
      }),
    },
  };
});

// WatermelonDB's core (schema, models, decorators, query engine) is pure JS, but
// the SQLite adapter needs a native module that is absent under Jest. Swap in the
// bundled pure-JS LokiJS adapter so database tests exercise real query behavior
// instead of a hollow stub.
jest.mock('@nozbe/watermelondb/adapters/sqlite', () => {
  const LokiJSAdapter =
    require('@nozbe/watermelondb/adapters/lokijs').default ||
    require('@nozbe/watermelondb/adapters/lokijs');

  return {
    __esModule: true,
    default: class TestSQLiteAdapter extends LokiJSAdapter {
      constructor(options) {
        super({
          ...options,
          useWebWorker: false,
          useIncrementalIndexedDB: false,
        });
      }
    },
  };
});

// Mock Transformers.js
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(() => Promise.resolve({
    tokenzier: { eos_token_id: 1 },
  })),
  env: {
    localModelPath: '/mock/models/',
    allowRemoteModels: false,
    allowLocalModels: true,
  },
}));
