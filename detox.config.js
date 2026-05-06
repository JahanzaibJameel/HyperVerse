/** @type {import('detox').DetoxConfig} */
module.exports = {
  testRunner: 'jest',
  runnerConfig: {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'node',
  },
  configurations: {
    'ios.sim.debug': {
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/HyperVerse.app',
      build: 'xcodebuild -workspace ios/HyperVerse.xcworkspace -scheme HyperVerse -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15',
      },
    },
    'ios.sim.release': {
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/HyperVerse.app',
      build: 'xcodebuild -workspace ios/HyperVerse.xcworkspace -scheme HyperVerse -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15',
      },
    },
    'android.emu.debug': {
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..',
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_30',
      },
    },
    'android.emu.release': {
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd ..',
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_30',
      },
    },
  },
};
