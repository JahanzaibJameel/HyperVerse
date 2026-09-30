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
  };
});

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([])),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/document/',
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1000 })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('mock content')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  createDownloadResumable: jest.fn(() => ({
    downloadAsync: jest.fn(() => Promise.resolve({ status: 200 })),
  })),
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
