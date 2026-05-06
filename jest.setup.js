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

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

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

// Mock WatermelonDB
jest.mock('@nozbe/watermelondb', () => ({
  Database: jest.fn(() => ({
    write: jest.fn((fn) => fn()),
    read: jest.fn((fn) => fn()),
    adapter: {
      isReady: true,
    },
  })),
  Model: jest.fn(() => ({})),
  field: jest.fn(),
  date: jest.fn(),
  readonly: jest.fn(),
}));

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

// Mock LanceDB
jest.mock('lancedb', () => ({
  Database: {
    connect: jest.fn(() => Promise.resolve({
      openTable: jest.fn(() => Promise.resolve({
        add: jest.fn(),
        delete: jest.fn(),
        toArray: jest.fn(() => Promise.resolve([])),
        where: jest.fn(() => ({
          toArray: jest.fn(() => Promise.resolve([])),
        })),
        search: jest.fn(() => ({
          limit: jest.fn(() => ({
            toArray: jest.fn(() => Promise.resolve([])),
          })),
        })),
      })),
      createTable: jest.fn(() => Promise.resolve()),
      close: jest.fn(() => Promise.resolve()),
    })),
  },
}));
